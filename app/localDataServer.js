import { Buffer } from 'node:buffer'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createEmailHandler } from './emailServer.js'

/**
 * A small local backend for `vite` and `vite preview`, so every signed-in user shares one workspace.
 * - GET/PUT /api/workspace keeps the workspace JSON in local-data/workspace.json. A PUT must name the
 *   revision it was built on; a stale write is refused with 409 so the browser can rebase and retry.
 * - PUT/GET/DELETE /api/photos/:id saves uploaded images as files in local-data/uploads.
 * - GET /api/email/status and POST /api/email send email over SMTP (see emailServer.js).
 */
const DATA_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'local-data')
const UPLOAD_DIR = path.join(DATA_DIR, 'uploads')
const WORKSPACE_FILE = path.join(DATA_DIR, 'workspace.json')
const EXTENSIONS = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp' }
const TYPES = Object.fromEntries(Object.entries(EXTENSIONS).map(([type, ext]) => [ext, type]))

const safeName = (id) => decodeURIComponent(id).replace(/[^\w.-]/g, '_').slice(0, 180)

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = []
    req.on('data', (chunk) => chunks.push(chunk))
    req.on('end', () => resolve(Buffer.concat(chunks)))
    req.on('error', reject)
  })
}

function readWorkspace() {
  try {
    return JSON.parse(fs.readFileSync(WORKSPACE_FILE, 'utf8'))
  } catch {
    return null
  }
}

function sendJson(res, status, body) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json')
  res.setHeader('Cache-Control', 'no-store')
  res.end(JSON.stringify(body))
}

function findUpload(name) {
  if (!fs.existsSync(UPLOAD_DIR)) return null
  const file = fs.readdirSync(UPLOAD_DIR).find((entry) => path.parse(entry).name === name)
  return file ? path.join(UPLOAD_DIR, file) : null
}

async function handle(email, req, res, next) {
  const url = new URL(req.url, 'http://local')
  try {
    if (url.pathname === '/api/email/status' && req.method === 'GET') return sendJson(res, 200, email.status())
    if (url.pathname === '/api/email' && req.method === 'POST') {
      try {
        return sendJson(res, 200, await email.send(JSON.parse((await readBody(req)).toString('utf8'))))
      } catch (error) {
        return sendJson(res, 502, { error: error instanceof Error ? error.message : 'The email could not be sent.' })
      }
    }

    if (url.pathname === '/api/workspace') {
      if (req.method === 'GET') {
        const saved = readWorkspace()
        return saved ? sendJson(res, 200, saved) : sendJson(res, 404, { rev: 0 })
      }
      if (req.method === 'PUT') {
        const { baseRev, data } = JSON.parse((await readBody(req)).toString('utf8'))
        const current = readWorkspace()
        const currentRev = current?.rev ?? 0
        if (baseRev !== currentRev) return sendJson(res, 409, current ?? { rev: 0 })
        const saved = { rev: currentRev + 1, savedAt: new Date().toISOString(), data }
        fs.mkdirSync(DATA_DIR, { recursive: true })
        fs.writeFileSync(`${WORKSPACE_FILE}.tmp`, JSON.stringify(saved))
        fs.renameSync(`${WORKSPACE_FILE}.tmp`, WORKSPACE_FILE)
        return sendJson(res, 200, { rev: saved.rev })
      }
    }

    if (url.pathname === '/api/photos' && req.method === 'DELETE') {
      fs.rmSync(UPLOAD_DIR, { recursive: true, force: true })
      return sendJson(res, 200, { ok: true })
    }

    const photo = url.pathname.match(/^\/api\/photos\/([^/]+)$/)
    if (photo) {
      const name = safeName(photo[1])
      if (req.method === 'PUT') {
        const type = String(req.headers['content-type'] ?? '').split(';')[0]
        if (!EXTENSIONS[type]) return sendJson(res, 415, { error: 'Only JPG, PNG or WebP images can be uploaded.' })
        const body = await readBody(req)
        fs.mkdirSync(UPLOAD_DIR, { recursive: true })
        const existing = findUpload(name)
        if (existing) fs.rmSync(existing)
        fs.writeFileSync(path.join(UPLOAD_DIR, `${name}${EXTENSIONS[type]}`), body)
        return sendJson(res, 200, { id: name })
      }
      if (req.method === 'GET') {
        const file = findUpload(name)
        if (!file) return sendJson(res, 404, { error: 'Photo not found.' })
        res.setHeader('Content-Type', TYPES[path.extname(file)] ?? 'application/octet-stream')
        res.setHeader('Cache-Control', 'private, max-age=31536000, immutable')
        return fs.createReadStream(file).pipe(res)
      }
    }
  } catch (error) {
    return sendJson(res, 500, { error: error instanceof Error ? error.message : 'Local data server error.' })
  }
  return next()
}

/** `env` holds the server-only settings from .env (SMTP_*). */
export function localDataServer(env = {}) {
  const email = createEmailHandler(env)
  const middleware = (req, res, next) => handle(email, req, res, next)
  return {
    name: 'terralink-local-data',
    configureServer(server) { server.middlewares.use(middleware) },
    configurePreviewServer(server) { server.middlewares.use(middleware) },
  }
}

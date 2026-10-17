import { createEmailHandler } from '../emailServer.js'

/**
 * Vercel counterpart of the local data server's POST /api/email. Same payload and response as
 * emailServer.js, so the browser code does not need a second delivery path.
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed.' })
  }
  res.setHeader('Cache-Control', 'no-store')
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body ?? {})
    const result = await createEmailHandler(process.env).send(body)
    res.status(200).json(result)
  } catch (error) {
    res.status(502).json({ error: error instanceof Error ? error.message : 'The email could not be sent.' })
  }
}

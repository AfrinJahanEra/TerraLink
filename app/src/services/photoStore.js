/**
 * Evidence photos live in IndexedDB and, when it runs, the local data server; the workspace JSON keeps only a photo id.
 * Images are downscaled in the browser before they are stored.
 */
import { deleteUploadedPhotos, downloadPhoto, hasLocalServer, uploadPhoto } from './localServer'

const DB_NAME = 'terralink.evidence'
const UPLOAD_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const STORE = 'photos'
const MAX_EDGE = 1280

function openDb() {
  return new Promise((resolve, reject) => {
    if (!('indexedDB' in window)) {
      reject(new Error('This browser cannot store photos.'))
      return
    }
    const request = window.indexedDB.open(DB_NAME, 1)
    request.onupgradeneeded = () => request.result.createObjectStore(STORE)
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error('Photo storage could not be opened.'))
  })
}

async function withStore(mode, run) {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE, mode)
    const request = run(transaction.objectStore(STORE))
    transaction.oncomplete = () => { db.close(); resolve(request?.result) }
    transaction.onerror = () => { db.close(); reject(transaction.error ?? new Error('Photo storage failed.')) }
  })
}

const putLocal = (id, value) => withStore('readwrite', (store) => store.put(value, id))
const getLocal = (id) => withStore('readonly', (store) => store.get(id))

const isUploadable = (value) => value instanceof Blob && UPLOAD_TYPES.includes(value.type)

/** Images are also uploaded to the local data server, so other users and browsers can see them. */
export async function putPhoto(id, value) {
  await putLocal(id, value)
  if (isUploadable(value) && await hasLocalServer()) await uploadPhoto(id, value)
}

// Photos saved before the local data server existed are uploaded the first time this browser shows them.
const backfilled = new Set()

/** This browser's copy first; otherwise the uploaded file, which is then kept locally. */
export async function getPhoto(id) {
  const local = await getLocal(id).catch(() => undefined)
  if (local) {
    if (isUploadable(local) && !backfilled.has(id) && await hasLocalServer()) {
      backfilled.add(id)
      void uploadPhoto(id, local).catch(() => backfilled.delete(id))
    }
    return local
  }
  if (!await hasLocalServer()) return local
  const blob = await downloadPhoto(id).catch(() => null)
  if (blob) await putLocal(id, blob).catch(() => undefined)
  return blob ?? undefined
}

export async function clearPhotos() {
  await withStore('readwrite', (store) => store.clear()).catch(() => undefined)
  if (await hasLocalServer()) await deleteUploadedPhotos()
}

/** Resize to a JPEG no larger than 1280 px on its longest edge. */
export async function compressImage(file) {
  const bitmap = await createImageBitmap(file).catch(() => {
    throw new Error(`${file.name} could not be opened as an image.`)
  })
  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close?.()
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.78))
  if (!blob) throw new Error(`${file.name} could not be processed.`)
  return blob
}

/** Downscales and stores picked files, returning the `{ id, name }` references that records keep. */
export async function storePhotos(files, prefix) {
  const stamp = Date.now()
  const stored = []
  for (const [index, file] of files.entries()) {
    const id = `${prefix}-${stamp}-${index}`
    await putPhoto(id, await compressImage(file))
    stored.push({ id, name: file.name })
  }
  return stored
}

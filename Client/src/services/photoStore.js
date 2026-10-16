/**
 * Evidence photos live in IndexedDB, not in the workspace JSON, so reports keep only a photo id.
 * Images are downscaled in the browser before they are stored.
 */
const DB_NAME = 'terralink.evidence'
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

export const putPhoto = (id, blob) => withStore('readwrite', (store) => store.put(blob, id))
export const getPhoto = (id) => withStore('readonly', (store) => store.get(id))
export const clearPhotos = () => withStore('readwrite', (store) => store.clear()).catch(() => undefined)

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

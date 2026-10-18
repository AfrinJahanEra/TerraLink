/**
 * The local data server (see localDataServer.js) runs with `npm run dev` and `npm run preview`.
 * On a static host it is absent, and the app falls back to this browser's storage only.
 */
let availability = null

export function hasLocalServer() {
  availability ??= fetch('/api/workspace', { cache: 'no-store' })
    .then((response) => (response.ok || response.status === 404) && (response.headers.get('content-type') ?? '').includes('application/json'))
    .catch(() => false)
  return availability
}

export async function fetchWorkspace() {
  const response = await fetch('/api/workspace', { cache: 'no-store' })
  if (response.status === 404) return { rev: 0, data: null }
  if (!response.ok) throw new Error('The shared workspace could not be loaded.')
  return response.json()
}

/** Resolves with the new revision, or with `{ conflict }` holding the newer saved workspace. */
export async function saveWorkspace(baseRev, data) {
  const response = await fetch('/api/workspace', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ baseRev, data }),
  })
  if (response.status === 409) return { conflict: await response.json() }
  if (!response.ok) throw new Error('The shared workspace could not be saved.')
  return response.json()
}

export async function uploadPhoto(id, blob) {
  const response = await fetch(`/api/photos/${encodeURIComponent(id)}`, { method: 'PUT', headers: { 'Content-Type': blob.type }, body: blob })
  if (!response.ok) throw new Error('The photo could not be uploaded.')
}

export async function downloadPhoto(id) {
  const response = await fetch(`/api/photos/${encodeURIComponent(id)}`)
  return response.ok ? response.blob() : null
}

export const deleteUploadedPhotos = () => fetch('/api/photos', { method: 'DELETE' }).catch(() => undefined)

import { useEffect, useState } from 'react'
import { getPhoto } from '../services/photoStore'

/** Resolves a stored evidence photo id to an object URL. Returns { url, state } where state is loading, ready or missing. */
export function usePhoto(photoId) {
  const [result, setResult] = useState({ id: null, url: '', state: 'loading' })

  useEffect(() => {
    if (!photoId) return undefined
    let objectUrl = ''
    let cancelled = false
    getPhoto(photoId)
      .then((blob) => {
        if (cancelled) return
        if (!blob) {
          setResult({ id: photoId, url: '', state: 'missing' })
          return
        }
        objectUrl = URL.createObjectURL(blob)
        setResult({ id: photoId, url: objectUrl, state: 'ready' })
      })
      .catch(() => { if (!cancelled) setResult({ id: photoId, url: '', state: 'missing' }) })
    return () => {
      cancelled = true
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [photoId])

  if (!photoId) return { url: '', state: 'missing' }
  return result.id === photoId ? result : { url: '', state: 'loading' }
}

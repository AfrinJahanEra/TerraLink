import { useEffect, useState } from 'react'
import { aerialSnapshot, getAerialMetadata } from '../services/aerial'
import { enhanceImage } from '../services/imageEnhance'

/** The sharpened version of an image URL when `enabled`, otherwise (and until it is ready) the original. */
export function useEnhancedImage(src, enabled) {
  const [result, setResult] = useState({ src: '', url: '' })

  useEffect(() => {
    if (!enabled || !src) return undefined
    let live = true
    enhanceImage(src).then((url) => { if (live) setResult({ src, url }) }).catch(() => undefined)
    return () => { live = false }
  }, [src, enabled])

  return enabled && result.src === src && result.url ? result.url : src
}

/** High-resolution aerial snapshot around a point, plus Esri's capture metadata. */
export function useAerialSnapshot(lat, lon, options) {
  const key = lat === undefined || lon === undefined ? '' : `${lat},${lon}`
  const [result, setResult] = useState({ key: '', url: '', metadata: null, state: 'loading' })

  useEffect(() => {
    if (!key) return undefined
    let live = true
    let objectUrl = ''
    Promise.all([aerialSnapshot(lat, lon, options), getAerialMetadata(lat, lon)])
      .then(([blob, metadata]) => {
        if (!live) return
        objectUrl = URL.createObjectURL(blob)
        setResult({ key, url: objectUrl, metadata, state: 'ready' })
      })
      .catch(() => { if (live) setResult({ key, url: '', metadata: null, state: 'missing' }) })
    return () => {
      live = false
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
    // `options` is a plain settings object; the snapshot only changes with the point.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  return result.key === key ? result : { url: '', metadata: null, state: 'loading' }
}

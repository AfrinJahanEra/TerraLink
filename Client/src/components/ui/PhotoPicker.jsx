import { Camera, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { PHOTO_RULES } from '../../constants/reports'
import { cn } from '../../utils/cn'

/** Chooses up to `max` images and previews them. `photos` are `{ file, url }`; the owner decides when to store them. */
export function PhotoPicker({ photos, onChange, max = PHOTO_RULES.maxFiles, error, hint = 'JPG, PNG or WebP, up to 10 MB each' }) {
  const [problem, setProblem] = useState('')
  const input = useRef(null)
  const urls = useRef(new Set())

  useEffect(() => {
    const set = urls.current
    return () => set.forEach((url) => URL.revokeObjectURL(url))
  }, [])

  function add(fileList) {
    let message = ''
    const accepted = []
    Array.from(fileList).forEach((file) => {
      if (!PHOTO_RULES.types.includes(file.type)) message = `${file.name} is not a JPG, PNG or WebP image.`
      else if (file.size > PHOTO_RULES.maxBytes) message = `${file.name} is larger than 10 MB.`
      else accepted.push(file)
    })
    const room = max - photos.length
    if (accepted.length > room) message = `You can attach up to ${max} photos.`
    const next = accepted.slice(0, Math.max(room, 0)).map((file) => {
      const url = URL.createObjectURL(file)
      urls.current.add(url)
      return { file, url }
    })
    setProblem(message)
    onChange([...photos, ...next])
    if (input.current) input.current.value = ''
  }

  function remove(url) {
    URL.revokeObjectURL(url)
    urls.current.delete(url)
    onChange(photos.filter((photo) => photo.url !== url))
  }

  const shown = problem || error
  return (
    <div>
      <div className="grid grid-cols-3 gap-3">
        {photos.map((photo, index) => (
          <div key={photo.url} className="relative aspect-square overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
            <img src={photo.url} alt={`Selected photo ${index + 1}`} className="size-full object-cover" />
            <button type="button" onClick={() => remove(photo.url)} aria-label={`Remove photo ${index + 1}`} className="absolute right-1.5 top-1.5 grid size-7 place-items-center rounded-md bg-white/95 text-slate-700 shadow-card hover:text-rose-600"><X size={14} /></button>
          </div>
        ))}
        {photos.length < max && (
          <label className={cn('flex aspect-square cursor-pointer flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed bg-slate-50 text-center text-slate-500 transition hover:border-brand-400 hover:bg-white', shown ? 'border-rose-300' : 'border-slate-300')}>
            <Camera size={20} />
            <span className="px-2 text-[11px] font-semibold">Take or choose a photo</span>
            <input ref={input} type="file" accept={PHOTO_RULES.types.join(',')} multiple className="sr-only" onChange={(event) => add(event.target.files)} />
          </label>
        )}
      </div>
      <p className="mt-2 text-[11px] text-slate-400">{hint}</p>
      {shown && <p role="alert" className="mt-1.5 text-[11px] font-medium text-rose-600">{shown}</p>}
    </div>
  )
}

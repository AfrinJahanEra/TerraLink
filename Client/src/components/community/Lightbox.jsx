import { X } from 'lucide-react'

/** Full-size view of an evidence photo. Click anywhere outside the photo to close. */
export function Lightbox({ url, onClose }) {
  return (
    <div role="dialog" aria-modal="true" aria-label="Evidence photo" className="fixed inset-0 z-[1100] grid place-items-center bg-slate-950/85 p-4" onClick={onClose}>
      <button type="button" onClick={onClose} aria-label="Close photo" className="absolute right-4 top-4 grid size-10 place-items-center rounded-lg bg-white/95 text-slate-700"><X size={18} /></button>
      <img src={url} alt="Evidence in full size" className="max-h-full max-w-full rounded-lg object-contain" onClick={(event) => event.stopPropagation()} />
    </div>
  )
}

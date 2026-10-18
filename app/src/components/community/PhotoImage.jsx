import { ImageOff } from 'lucide-react'
import { usePhoto } from '../../hooks/usePhoto'
import { cn } from '../../utils/cn'

/** Evidence photo loaded from local storage by id, with loading and missing states. */
export function PhotoImage({ photoId, alt, className, onClick }) {
  const { url, state } = usePhoto(photoId)

  if (state === 'ready') {
    const image = <img src={url} alt={alt} className={cn('size-full object-cover', className)} />
    return onClick
      ? <button type="button" onClick={() => onClick(url)} className="block size-full" aria-label={`Open ${alt}`}>{image}</button>
      : image
  }
  return (
    <div className={cn('grid size-full place-items-center bg-slate-100 text-slate-400', state === 'loading' && 'animate-pulse', className)}>
      {state === 'missing' && <span className="flex flex-col items-center gap-1 text-[10px]"><ImageOff size={16} />Photo unavailable</span>}
    </div>
  )
}

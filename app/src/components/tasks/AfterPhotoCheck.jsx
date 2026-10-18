import { BrainCircuit, CircleCheck, LoaderCircle, TriangleAlert } from 'lucide-react'
import { NOT_CLEARED } from '../../services/cleanupAi'
import { cn } from '../../utils/cn'

const percent = (value) => `${Math.round(value * 100)}%`

/**
 * The AI's verdict on each after-photo as soon as it is added: a scan while the model reads it, then clean or waste.
 * `checks` maps a photo's preview URL to { status: 'checking' | 'done' | 'error', waste, top }.
 */
export function AfterPhotoCheck({ photos, checks, download }) {
  if (!photos.length) return null
  const loading = download?.total > 0 && download.loaded < download.total
  return (
    <div className="mt-3 rounded-lg border border-slate-200 bg-white p-3">
      <p className="flex items-center gap-2 text-[11px] font-semibold text-slate-800"><BrainCircuit size={14} className="text-brand-700" />AI check of the after-photos<span className="ml-auto text-[10px] font-normal text-slate-400">CLIP vision model · on this device</span></p>
      {loading && (
        <div className="mt-2">
          <p className="text-[10.5px] text-slate-500">Loading the AI model once · {Math.round(download.loaded / 1_048_576)} of {Math.round(download.total / 1_048_576)} MB</p>
          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-brand-600 transition-all" style={{ width: `${Math.round((download.loaded / download.total) * 100)}%` }} /></div>
        </div>
      )}
      <ul className="mt-2 space-y-2">
        {photos.map((photo, index) => {
          const check = checks[photo.url] ?? { status: 'checking' }
          const dirty = check.status === 'done' && check.waste >= NOT_CLEARED
          return (
            <li key={photo.url} className={cn('flex items-center gap-3 rounded-lg p-2', check.status === 'done' ? (dirty ? 'bg-rose-50' : 'bg-green-50') : 'bg-slate-50')}>
              <span className="relative h-12 w-16 shrink-0 overflow-hidden rounded-md bg-slate-900">
                <img src={photo.url} alt={`After-photo ${index + 1}`} className="size-full object-cover" />
                {check.status === 'checking' && <><span className="waste-scan-grid absolute inset-0 bg-slate-950/20" /><span className="waste-scan-line" /></>}
              </span>
              <div className="min-w-0 flex-1">
                {check.status === 'checking' && <p className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-700"><LoaderCircle size={13} className="animate-spin text-brand-600" />Checking photo {index + 1} for waste…</p>}
                {check.status === 'error' && <p className="text-[11px] font-medium text-amber-800">The AI could not check this photo. The manager will check it.</p>}
                {check.status === 'done' && (
                  <>
                    <p className={cn('flex items-center gap-1.5 text-[11px] font-bold', dirty ? 'text-rose-700' : 'text-green-700')}>
                      {dirty ? <TriangleAlert size={13} /> : <CircleCheck size={13} />}
                      {dirty ? `Waste still visible · ${percent(check.waste)}` : `Clean · waste ${percent(check.waste)}`}
                    </p>
                    <p className="truncate text-[10.5px] text-slate-500">AI sees {check.top.slice(0, 2).map((item) => `${item.text} ${percent(item.probability)}`).join(', ')}</p>
                    {dirty && <p className="text-[10.5px] font-medium text-rose-700">Finish the cleanup, then replace this photo.</p>}
                  </>
                )}
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

import { CircleAlert, LoaderCircle, SearchX } from 'lucide-react'
import { useState } from 'react'
import { usePhoto } from '../../hooks/usePhoto'
import { cn } from '../../utils/cn'
import { formatAcquired } from '../../utils/observations'
import { Button } from '../ui/Button'

const WIDTH = 720
const HEIGHT = 480

/** Draws the mapped outline in the same lon/lat box the images were rendered in, so it sits exactly on the water. */
function Outline({ site }) {
  const [west, south, east, north] = site.imageBox
  const toPoint = ([lat, lon]) => `${(((lon - west) / (east - west)) * WIDTH).toFixed(1)},${(((north - lat) / (north - south)) * HEIGHT).toFixed(1)}`
  const path = [site.boundary, ...site.boundaryHoles].map((ring) => `M${ring.map(toPoint).join('L')}Z`).join(' ')
  return (
    <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} preserveAspectRatio="none" className="pointer-events-none absolute inset-0 size-full" aria-hidden="true">
      <path d={path} fill="none" stroke="#ffffff" strokeWidth="2" vectorEffect="non-scaling-stroke" fillRule="evenodd" />
    </svg>
  )
}

function PaneState({ run, side, onUseSuggestion }) {
  if (run.state === 'none') {
    return (
      <div className="absolute inset-0 grid place-items-center bg-slate-100 p-6 text-center">
        <div className="max-w-xs">
          <SearchX size={26} className="mx-auto text-slate-400" />
          <p className="mt-3 text-sm font-semibold text-slate-800">No usable scene in this window</p>
          <p className="mt-1 text-xs leading-5 text-slate-500">No Sentinel-2 scene fully covers this water body near the chosen date.</p>
          {run.suggestion && <Button type="button" variant="secondary" className="mt-4 min-h-9 text-xs" onClick={() => onUseSuggestion(side, run.suggestion.date)}>Use nearest scene, {run.suggestion.date}</Button>}
        </div>
      </div>
    )
  }
  if (run.state === 'error') {
    return (
      <div className="absolute inset-0 grid place-items-center bg-slate-100 p-6 text-center">
        <div className="max-w-xs"><CircleAlert size={26} className="mx-auto text-rose-500" /><p className="mt-3 text-sm font-semibold text-slate-800">Imagery could not be loaded</p><p className="mt-1 text-xs leading-5 text-slate-500">{run.message}</p></div>
      </div>
    )
  }
  return (
    <div className="absolute inset-0 grid place-items-center bg-slate-100 p-6 text-center">
      <div><LoaderCircle size={24} className="mx-auto animate-spin text-brand-600" /><p className="mt-3 text-xs font-semibold text-slate-700">{run.message || 'Starting'}</p><p className="mt-1 text-[11px] text-slate-400">Real satellite pixels are downloaded for this water body. A first run can take about half a minute.</p></div>
    </div>
  )
}

function Pane({ run, label, site, showMask, showOutline, onUseSuggestion }) {
  const observation = run.observation
  const rgb = usePhoto(observation?.imageKeys.rgb)
  const mask = usePhoto(observation?.imageKeys.mask)

  if (run.state !== 'done' || !observation) return <PaneState run={run} side={label === 'Earlier' ? 'from' : 'to'} onUseSuggestion={onUseSuggestion} />
  return (
    <>
      {rgb.url ? <img src={rgb.url} alt={`${label} satellite image of ${site.name} from ${formatAcquired(observation.acquiredAt).date}`} className="absolute inset-0 size-full object-cover" draggable={false} /> : <div className="absolute inset-0 animate-pulse bg-slate-200" />}
      {showMask && mask.url && <img src={mask.url} alt="" className="absolute inset-0 size-full object-cover" style={{ imageRendering: 'pixelated' }} draggable={false} />}
      {showOutline && <Outline site={site} />}
    </>
  )
}

function Chip({ children, className }) {
  return <span className={cn('pointer-events-none absolute top-3 z-10 rounded-lg bg-slate-950/75 px-2.5 py-1.5 text-[10px] font-semibold text-white backdrop-blur-sm', className)}>{children}</span>
}

const captionFor = (label, run) => run.observation ? `${label} · ${formatAcquired(run.observation.acquiredAt).date}` : label

/** Side-by-side or swipe view of two dated observations over the same extent. */
export function ComparisonViewer({ site, earlier, later, onUseSuggestion }) {
  const [mode, setMode] = useState('swipe')
  const [position, setPosition] = useState(50)
  const [showMask, setShowMask] = useState(true)
  const [showOutline, setShowOutline] = useState(true)
  const ready = earlier.state === 'done' && later.state === 'done'
  const paneProps = { site, showMask, showOutline, onUseSuggestion }
  // Until both dates have an image there is nothing to swipe between, so each date shows its own progress.
  const effectiveMode = ready ? mode : 'side'

  const toggle = (checked, setChecked, label) => (
    <label className="inline-flex cursor-pointer items-center gap-2 text-xs font-medium text-slate-600"><input type="checkbox" checked={checked} onChange={(event) => setChecked(event.target.checked)} className="size-4 accent-brand-700" />{label}</label>
  )

  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-card" aria-label="Satellite comparison">
      <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
        <div><h2 className="text-sm font-semibold text-slate-900">Same water body, two dates</h2><p className="mt-0.5 text-xs text-slate-400">Both images cover the same extent and are drawn from real Sentinel-2 scenes.</p></div>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
          <div role="group" aria-label="View mode" className="inline-flex rounded-lg border border-slate-200 p-0.5 text-xs font-semibold">
            {[['swipe', 'Swipe'], ['side', 'Side by side']].map(([id, label]) => <button key={id} type="button" aria-pressed={mode === id} onClick={() => setMode(id)} className={cn('rounded-md px-3 py-1.5 transition', mode === id ? 'bg-slate-800 text-white' : 'text-slate-600 hover:bg-slate-50')}>{label}</button>)}
          </div>
          {toggle(showMask, setShowMask, 'Water mask')}
          {toggle(showOutline, setShowOutline, 'Outline')}
        </div>
      </div>

      {effectiveMode === 'side' ? (
        <div className="grid gap-px bg-slate-200 md:grid-cols-2">
          {[['Earlier', earlier], ['Later', later]].map(([label, run]) => (
            <div key={label} className="relative aspect-[3/2] overflow-hidden bg-slate-100">
              <Pane run={run} label={label} {...paneProps} />
              <Chip className="left-3">{captionFor(label, run)}</Chip>
            </div>
          ))}
        </div>
      ) : (
        <div className="relative aspect-[3/2] overflow-hidden bg-slate-100">
          <div className="absolute inset-0"><Pane run={earlier} label="Earlier" {...paneProps} /></div>
          <div className="absolute inset-0" style={{ clipPath: `inset(0 0 0 ${position}%)` }}><Pane run={later} label="Later" {...paneProps} /></div>
          <Chip className="left-3">{captionFor('Earlier', earlier)}</Chip>
          <Chip className="right-3">{captionFor('Later', later)}</Chip>
          <>
              <div className="pointer-events-none absolute inset-y-0 z-10 w-0.5 bg-white shadow-[0_0_0_1px_rgba(15,23,42,0.3)]" style={{ left: `${position}%` }} />
              <input type="range" min="0" max="100" value={position} onChange={(event) => setPosition(Number(event.target.value))} aria-label="Swipe between the earlier and later image" className="absolute inset-x-0 bottom-3 z-20 mx-auto w-[min(90%,520px)] accent-white" />
          </>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 border-t border-slate-100 px-5 py-3 text-[11px] text-slate-500">
        <span className="inline-flex items-center gap-2"><span className="size-3 rounded-sm bg-cyan-500/70" />Water (NDWI above 0)</span>
        <span className="inline-flex items-center gap-2"><span className="size-3 rounded-sm bg-slate-500/70" />Unusable pixels (cloud, shadow, no data)</span>
        <span className="inline-flex items-center gap-2"><span className="h-0.5 w-4 bg-slate-700" />Mapped outline plus a 10 m tolerance</span>
        <span className="ml-auto text-slate-400">Contains modified Copernicus Sentinel data</span>
      </div>
    </section>
  )
}

import { ArrowRight, Layers, ScanLine } from 'lucide-react'
import { Link } from 'react-router-dom'
import { VERDICT } from '../../constants/observations'
import { formatAcquired, formatHa, formatPercent, formatSignedHa } from '../../utils/observations'
import { PhotoImage } from '../community/PhotoImage'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'

const verdictTone = { decrease: 'amber', increase: 'brand', within_uncertainty: 'brand', not_reliable: 'neutral' }

function Frame({ observation, label }) {
  return (
    <figure className="relative aspect-[3/2] overflow-hidden rounded-lg bg-slate-100">
      <PhotoImage photoId={observation.imageKeys.rgb} alt={`${label} satellite image from ${formatAcquired(observation.acquiredAt).date}`} />
      <figcaption className="absolute bottom-2 left-2 rounded-md bg-slate-950/75 px-2 py-1 text-[10px] font-semibold text-white">{label} · {formatAcquired(observation.acquiredAt).date}</figcaption>
    </figure>
  )
}

/** Latest saved measurement for a water body, or an honest "not measured yet" with a way to run one. */
export function MeasuredComparison({ site, showActions = true }) {
  const saved = site.measured

  if (!saved && !showActions) return null
  if (!saved) {
    return (
      <section className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-card sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-600"><ScanLine size={17} /></span>
          <div><h2 className="text-sm font-semibold text-slate-900">Water-area change: not yet measured</h2><p className="mt-1 max-w-xl text-xs leading-5 text-slate-500">Compare two dated Sentinel-2 images of this water body. TerraLink measures the water inside the mapped outline on each date and reports the difference with its uncertainty.</p></div>
        </div>
        <Button as={Link} to={`/compare/${site.id}`} className="shrink-0"><Layers size={15} />Run satellite comparison</Button>
      </section>
    )
  }

  const { earlier, later, result } = saved
  const unreliable = result.verdict === 'not_reliable'
  return (
    <section className="rounded-xl border border-slate-200 bg-white shadow-card" aria-label="Measured comparison">
      <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div><h2 className="text-sm font-semibold text-slate-900">Measured water area</h2><p className="mt-0.5 text-xs text-slate-400">Saved by {saved.savedBy} · Sentinel-2, NDWI inside the mapped outline</p></div>
        <Badge tone={verdictTone[result.verdict]} className="self-start sm:self-auto">{VERDICT[result.verdict].label}</Badge>
      </div>
      <div className="grid gap-5 p-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <div className="grid grid-cols-2 gap-3"><Frame observation={earlier} label="Earlier" /><Frame observation={later} label="Later" /></div>
        <div className="flex flex-col justify-center">
          <dl className="grid grid-cols-2 gap-x-4 gap-y-4 text-xs">
            <div><dt className="text-slate-400">Earlier water area</dt><dd className="mt-0.5 text-lg font-bold text-slate-900">{formatHa(earlier.waterAreaM2)}</dd></div>
            <div><dt className="text-slate-400">Later water area</dt><dd className="mt-0.5 text-lg font-bold text-slate-900">{formatHa(later.waterAreaM2)}</dd></div>
            <div><dt className="text-slate-400">Change</dt><dd className="mt-0.5 text-lg font-bold text-slate-900">{unreliable ? 'Not reported' : `${formatSignedHa(result.deltaM2)}`}</dd></div>
            <div><dt className="text-slate-400">Percent</dt><dd className="mt-0.5 text-lg font-bold text-slate-900">{unreliable ? 'Not reported' : formatPercent(result.percent)}</dd></div>
          </dl>
          <p className="mt-4 text-xs leading-5 text-slate-500">{VERDICT[result.verdict].detail} Uncertainty ± {formatHa(result.uncertaintyM2)}.{result.reliable ? '' : ' Treat as indicative.'}</p>
          {showActions && <Button as={Link} to={`/compare/${site.id}?from=${earlier.requestedDate}&to=${later.requestedDate}&w=${earlier.windowDays}`} variant="secondary" className="mt-4 self-start">Open full comparison <ArrowRight size={15} /></Button>}
        </div>
      </div>
    </section>
  )
}

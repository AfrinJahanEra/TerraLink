import { ScanLine } from 'lucide-react'
import { VERDICT } from '../../constants/observations'
import { cn } from '../../utils/cn'
import { formatAcquired, formatHa, formatPercent, formatSignedHa } from '../../utils/observations'
import { Badge } from '../ui/Badge'

const verdictTone = { decrease: 'amber', increase: 'brand', within_uncertainty: 'brand', not_reliable: 'neutral' }

function Figure({ label, value, detail, muted }) {
  return (
    <div className="min-w-0 border-b border-slate-100 p-4 last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0">
      <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">{label}</p>
      <p className={cn('mt-2 text-xl font-bold tracking-tight', muted ? 'text-slate-400' : 'text-slate-900')}>{value}</p>
      <p className="mt-1 text-[10px] text-slate-400">{detail}</p>
    </div>
  )
}

/** Measured water area for each date, the difference and an honest verdict. */
export function AreaChangeSummary({ earlier, later, result }) {
  const verdict = VERDICT[result.verdict]
  const unreliable = result.verdict === 'not_reliable'

  return (
    <section className="rounded-xl border border-slate-200 bg-white shadow-card" aria-label="Measured change">
      <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-600"><ScanLine size={17} /></span>
          <div><h2 className="text-sm font-semibold text-slate-900">Measured water area</h2><p className="mt-0.5 text-xs text-slate-400">Inside the mapped outline, from the pixels classified as water</p></div>
        </div>
        <Badge tone={verdictTone[result.verdict]} className="self-start sm:self-auto">{verdict.label}{!unreliable && !result.reliable ? ', indicative' : ''}</Badge>
      </div>

      <div className="grid sm:grid-cols-2 xl:grid-cols-4">
        <Figure label={`Earlier · ${formatAcquired(earlier.acquiredAt).date}`} value={formatHa(earlier.waterAreaM2)} detail={`± ${formatHa(earlier.uncertaintyM2)} pixel-edge uncertainty`} muted={unreliable} />
        <Figure label={`Later · ${formatAcquired(later.acquiredAt).date}`} value={formatHa(later.waterAreaM2)} detail={`± ${formatHa(later.uncertaintyM2)} pixel-edge uncertainty`} muted={unreliable} />
        <Figure label="Change in area" value={unreliable ? 'Not reported' : formatSignedHa(result.deltaM2)} detail={unreliable ? 'Imagery or size does not support it' : `Combined uncertainty ± ${formatHa(result.uncertaintyM2)}`} muted={unreliable} />
        <Figure label="Change in percent" value={unreliable ? 'Not reported' : formatPercent(result.percent)} detail={result.percent === null && !unreliable ? 'Earlier area is zero' : 'Relative to the earlier date'} muted={unreliable} />
      </div>

      <div className="grid gap-4 border-t border-slate-100 px-5 py-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <p className="text-xs leading-5 text-slate-600"><strong className="font-semibold text-slate-800">{verdict.label}.</strong> {verdict.detail}</p>
        <div className="rounded-lg bg-slate-50 px-4 py-3 font-mono text-[11px] leading-6 text-slate-600">
          <p>Change = later − earlier = {formatSignedHa(result.deltaM2)}</p>
          <p>Percent = change ÷ earlier × 100 = {formatPercent(result.percent)}</p>
          <p>Verdict rule: a change inside ± {formatHa(result.uncertaintyM2)} is not told apart from noise.</p>
        </div>
      </div>
    </section>
  )
}

import { CalendarRange, CloudSun, Database, Info, ScanLine, Waves } from 'lucide-react'
import { analysisSources } from '../../data/siteAnalysis'

function Metric({ icon: Icon, label, value, detail, valueClass = 'text-slate-900' }) {
  return (
    <div className="min-w-0 border-b border-slate-100 p-4 last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0">
      <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400"><Icon size={14} className="text-slate-500" />{label}</div>
      <p className={`mt-2 text-xl font-bold tracking-tight ${valueClass}`}>{value}</p>
      <p className="mt-1 text-[10px] text-slate-400">{detail}</p>
    </div>
  )
}

export function AnalysisSummary({ comparison }) {
  const hasMeasurement = comparison.change !== null
  const changeText = hasMeasurement ? `${comparison.change > 0 ? '+' : ''}${comparison.change}%` : 'Unavailable'
  const qualityLabel = comparison.coverage >= 80 ? 'Good coverage' : comparison.coverage >= 60 ? 'Moderate coverage' : 'Limited coverage'

  return (
    <>
      <section className="grid overflow-hidden rounded-xl border border-slate-200 bg-white shadow-card sm:grid-cols-2 xl:grid-cols-4">
        <Metric icon={Waves} label="Earlier area" value={hasMeasurement ? `${comparison.previousArea} ha` : '—'} detail={comparison.beforeDate} />
        <Metric icon={Waves} label="Later area" value={hasMeasurement ? `${comparison.currentArea} ha` : '—'} detail={comparison.afterDate} />
        <Metric icon={ScanLine} label="Estimated change" value={changeText} detail="Sample figure" valueClass={comparison.change < 0 ? 'text-rose-700' : 'text-slate-900'} />
        <Metric icon={CloudSun} label="Clear-pixel coverage" value={`${comparison.coverage}%`} detail={qualityLabel} />
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-card">
        <div className="flex items-start gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-600"><Info size={17} /></span>
          <div><h2 className="text-sm font-semibold text-slate-900">Data quality and interpretation</h2><p className="mt-1 text-xs leading-5 text-slate-500">Use this comparison as evidence for review, not as proof of encroachment, damage, or permanent wetland loss.</p></div>
        </div>
        <div className="mt-4 grid gap-3 border-t border-slate-100 pt-4 sm:grid-cols-3">
          <div className="flex gap-2.5"><CloudSun size={15} className="mt-0.5 shrink-0 text-slate-500" /><p className="text-[11px] leading-5 text-slate-500"><strong className="block font-semibold text-slate-700">Cloud and shadow</strong>{comparison.coverage}% of compared pixels are clear enough for this sample.</p></div>
          <div className="flex gap-2.5"><CalendarRange size={15} className="mt-0.5 shrink-0 text-slate-500" /><p className="text-[11px] leading-5 text-slate-500"><strong className="block font-semibold text-slate-700">Seasonal context</strong>Both dates represent the {comparison.season.toLowerCase()} to reduce seasonal bias.</p></div>
          <div className="flex gap-2.5"><Database size={15} className="mt-0.5 shrink-0 text-slate-500" /><p className="text-[11px] leading-5 text-slate-500"><strong className="block font-semibold text-slate-700">Source and resolution</strong>{analysisSources.resolution}; boundaries and area figures are illustrative.</p></div>
        </div>
      </section>
    </>
  )
}

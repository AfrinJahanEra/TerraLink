import { ArrowDownRight, ArrowUpRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { cn } from '../../utils/cn'

const toneStyles = {
  blue: 'bg-sky-50 text-sky-700',
  amber: 'bg-amber-50 text-amber-700',
  purple: 'bg-violet-50 text-violet-700',
  emerald: 'bg-emerald-50 text-emerald-700',
}

export function KpiCard({ icon: Icon, label, value, trend, trendLabel, tone = 'blue', to }) {
  const positive = trend >= 0
  const content = (
    <>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-slate-500">{label}</p>
          <p className="mt-2 text-[28px] font-bold tracking-[-0.04em] text-slate-950">{value}</p>
        </div>
        <span className={cn('grid size-10 place-items-center rounded-xl', toneStyles[tone])}><Icon size={19} strokeWidth={1.8} /></span>
      </div>
      <div className="mt-4 flex items-center gap-1.5 text-[11px]">
        <span className={cn('inline-flex items-center gap-0.5 font-semibold', positive ? 'text-emerald-600' : 'text-rose-600')}>
          {positive ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}{Math.abs(trend)}%
        </span>
        <span className="text-slate-400">{trendLabel}</span>
      </div>
    </>
  )

  return to ? (
    <Link to={to} className="block rounded-xl border border-slate-200 bg-white p-5 shadow-card transition duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md">
      {content}
    </Link>
  ) : (
    <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-card">{content}</article>
  )
}

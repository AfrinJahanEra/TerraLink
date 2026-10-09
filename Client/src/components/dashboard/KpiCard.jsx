import { ArrowDownRight, ArrowUpRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { cn } from '../../utils/cn'

export function KpiCard({ icon: Icon, label, value, trend, trendLabel, to }) {
  const positive = trend >= 0
  const content = (
    <>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-slate-500">{label}</p>
          <p className="mt-2 text-[28px] font-bold tracking-[-0.04em] text-slate-950">{value}</p>
        </div>
        <span className="grid size-10 place-items-center rounded-xl bg-slate-100 text-slate-600"><Icon size={19} strokeWidth={1.8} /></span>
      </div>
      <div className="mt-4 flex items-center gap-1.5 text-[11px]">
        <span className={cn('inline-flex items-center gap-0.5 font-semibold', positive ? 'text-emerald-600' : 'text-rose-600')}>
          {positive ? <ArrowUpRight size={13} className="text-slate-500" /> : <ArrowDownRight size={13} className="text-slate-500" />}{Math.abs(trend)}%
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

import { ArrowRight, MapPin } from 'lucide-react'
import { Link } from 'react-router-dom'
import { cn } from '../../utils/cn'

const statusStyles = {
  needs_review: { label: 'Needs review', className: 'bg-amber-50 text-amber-700 ring-amber-200', dot: 'bg-amber-500' },
  no_change: { label: 'No change', className: 'bg-emerald-50 text-emerald-700 ring-emerald-200', dot: 'bg-emerald-500' },
  insufficient_data: { label: 'Insufficient data', className: 'bg-slate-100 text-slate-600 ring-slate-200', dot: 'bg-slate-400' },
}

export function SiteSnapshot({ sites }) {
  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-card">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
        <div><h2 className="text-sm font-semibold text-slate-900">Wetland sites</h2><p className="mt-0.5 text-xs text-slate-400">Latest monitoring snapshot</p></div>
        <Link to="/map" className="flex items-center gap-1 text-xs font-semibold text-brand-700 hover:text-brand-900">Open map <ArrowRight size={14} className="text-slate-500" /></Link>
      </div>

      <div className="divide-y divide-slate-100">
        {sites.map((site) => {
          const status = statusStyles[site.status]
          return (
            <Link key={site.id} to={`/sites/${site.id}`} className="group flex items-center gap-3 px-4 py-3 transition hover:bg-slate-50/80 sm:px-5">
              <div className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                <img src={site.image} alt="" className="size-full object-cover transition duration-300 group-hover:scale-105" />
                <span className="absolute inset-x-0 bottom-0 bg-slate-950/55 py-0.5 text-center text-[7px] font-semibold uppercase tracking-wide text-white">Sample visual</span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2"><h3 className="truncate text-sm font-semibold text-slate-800">{site.name}</h3>{site.change !== null && <span className={cn('text-[11px] font-semibold', site.change < 0 ? 'text-rose-600' : 'text-emerald-600')}>{site.change > 0 ? '+' : ''}{site.change}%</span>}</div>
                <p className="mt-1 flex items-center gap-1 text-[11px] text-slate-400"><MapPin size={11} /> {site.location} · {site.area}</p>
              </div>
              <span className={cn('hidden items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold ring-1 ring-inset sm:inline-flex', status.className)}><span className={cn('size-1.5 rounded-full', status.dot)} />{status.label}</span>
              <ArrowRight size={15} className="text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-slate-700" />
            </Link>
          )
        })}
      </div>
    </section>
  )
}

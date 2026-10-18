import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { SITE_STATUS, isTaskClosed } from '../../constants/status'
import { cn } from '../../utils/cn'
import { formatBdt } from '../../utils/currency'

/** One line per lake: status, open reports, active tasks and, when `budgetRows` is given, budget used. */
export function SiteOverview({ sites, tasks, budgetRows = null, title = 'Water bodies at a glance', showRegister = true, limit = sites.length }) {
  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-card">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
        <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
        {showRegister && <Link to="/sites" className="flex items-center gap-1 text-xs font-semibold text-brand-700 hover:text-brand-900">Sites register <ArrowRight size={14} className="text-slate-500" /></Link>}
      </div>
      <div className={cn('hidden gap-4 border-b border-slate-100 bg-slate-50/70 px-5 py-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400 sm:grid', budgetRows ? 'sm:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_70px_70px_minmax(0,1.1fr)]' : 'sm:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_70px_70px]')}>
        <span>Water body</span><span>Status</span><span className="text-right">Reports</span><span className="text-right">Tasks</span>{budgetRows && <span>Budget used</span>}
      </div>
      <div className="divide-y divide-slate-100">
        {sites.slice(0, limit).map((site) => {
          const status = SITE_STATUS[site.status]
          const activeTasks = tasks.filter((task) => task.siteId === site.id && !isTaskClosed(task)).length
          const budget = budgetRows?.find((row) => row.id === site.id)
          const used = budget?.planned ? Math.round((budget.actual / budget.planned) * 100) : 0
          return (
            <Link key={site.id} to={`/sites/${site.id}`} className={cn('grid grid-cols-2 items-center gap-x-4 gap-y-1 px-5 py-3 text-xs transition hover:bg-slate-50', budgetRows ? 'sm:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_70px_70px_minmax(0,1.1fr)]' : 'sm:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_70px_70px]')}>
              <span className="flex min-w-0 items-center gap-2.5">
                <img src={site.image} alt="" loading="lazy" className="size-8 shrink-0 rounded-md bg-slate-100 object-cover" />
                <span className="min-w-0"><span className="block truncate font-semibold text-slate-800">{site.name}</span><span className="block truncate text-[10.5px] text-slate-400">{site.location}</span></span>
              </span>
              <span className="flex min-w-0 items-center gap-1.5 text-slate-600"><span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: status?.color }} /><span className="truncate">{status?.label}</span></span>
              <span className="text-slate-600 sm:text-right"><span className="sm:hidden">Reports </span><span className={cn('tabular-nums', site.openReports && 'font-semibold text-amber-700')}>{site.openReports}</span></span>
              <span className="text-slate-600 sm:text-right"><span className="sm:hidden">Tasks </span><span className="tabular-nums">{activeTasks}</span></span>
              {budget && (
                <span className="col-span-2 sm:col-span-1">
                  <span className="flex items-baseline justify-between gap-2 text-[10.5px] tabular-nums"><span className={cn('font-semibold', budget.overBudget ? 'text-rose-700' : 'text-slate-700')}>{formatBdt(budget.actual)}</span><span className="text-slate-400">of {formatBdt(budget.planned)}</span></span>
                  <span className="mt-1 block h-1.5 overflow-hidden rounded-full bg-slate-100"><span className={cn('block h-full rounded-full', budget.overBudget ? 'bg-rose-500' : used > 80 ? 'bg-amber-500' : 'bg-brand-500')} style={{ width: `${Math.min(used, 100)}%` }} /></span>
                </span>
              )}
            </Link>
          )
        })}
        {!sites.length && <p className="px-5 py-8 text-center text-xs text-slate-400">No water bodies to show.</p>}
      </div>
    </section>
  )
}

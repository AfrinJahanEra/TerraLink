import { ArrowRight, CalendarDays } from 'lucide-react'
import { Link } from 'react-router-dom'
import { cn } from '../../utils/cn'

const statuses = {
  review_pending: { label: 'Review pending', className: 'bg-amber-50 text-amber-700' },
  approved: { label: 'Approved', className: 'bg-sky-50 text-sky-700' },
  in_progress: { label: 'In progress', className: 'bg-brand-50 text-brand-700' },
}

export function TaskList({ tasks, title = 'Open tasks', subtitle = 'Priority work across all sites' }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white shadow-card">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
        <div><h2 className="text-sm font-semibold text-slate-900">{title}</h2><p className="mt-0.5 text-xs text-slate-400">{subtitle}</p></div>
        <Link to="/tasks" className="flex items-center gap-1 text-xs font-semibold text-brand-700 hover:text-brand-900">View all <ArrowRight size={14} className="text-slate-500" /></Link>
      </div>
      <div className="divide-y divide-slate-100">
        {tasks.map((task) => {
          const status = statuses[task.status]
          return (
            <Link key={task.id} to="/tasks" className="group grid gap-3 px-5 py-3.5 transition hover:bg-slate-50/80 sm:grid-cols-[minmax(0,1fr)_110px_90px_120px] sm:items-center">
              <div className="min-w-0"><p className="truncate text-sm font-medium text-slate-800">{task.title}</p><p className="mt-1 text-[11px] text-slate-400">{task.id} · {task.site}</p></div>
              <div className="flex items-center gap-2"><span className="grid size-7 shrink-0 place-items-center rounded-full bg-slate-100 text-[9px] font-bold text-slate-600">{task.initials}</span><span className="truncate text-xs text-slate-500">{task.assignee.split(' ')[0]}</span></div>
              <span className={cn('flex items-center gap-1 text-xs', task.due === 'Today' ? 'font-semibold text-rose-600' : 'text-slate-500')}><CalendarDays size={13} className="text-slate-500" />{task.due}</span>
              <span className={cn('w-fit rounded-full px-2.5 py-1 text-[10px] font-semibold', status.className)}>{status.label}</span>
            </Link>
          )
        })}
      </div>
    </section>
  )
}

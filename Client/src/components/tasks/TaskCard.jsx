import { CalendarDays, CircleDollarSign, FileText, MessageSquareText, UserRound } from 'lucide-react'
import { TASK_STATUS } from '../../constants/status'
import { cn } from '../../utils/cn'
import { isTaskOverdue } from '../../utils/tasks'
import { Badge } from '../ui/Badge'

const priorityStyles = {
  Urgent: 'text-amber-700',
  High: 'text-slate-900',
  Medium: 'text-slate-600',
  Low: 'text-slate-400',
}

export function TaskCard({ task, onOpen, showStatus = false }) {
  const overdue = isTaskOverdue(task)
  const status = TASK_STATUS[task.status]

  return (
    <button type="button" onClick={() => onOpen(task.id)} className="w-full rounded-lg border border-slate-200 bg-white p-3.5 text-left shadow-card transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0"><p className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">{task.id} · {task.site}</p><h3 className="mt-1.5 text-xs font-semibold leading-5 text-slate-800">{task.title}</h3></div>
        <span className={cn('shrink-0 text-[10px] font-bold uppercase tracking-wide', priorityStyles[task.priority])}>{task.priority}</span>
      </div>

      {(showStatus || task.reportId) && <div className="mt-3 flex flex-wrap items-center gap-2">{showStatus && <Badge tone={status.tone} className="text-[10px]">{status.label}</Badge>}{task.reportId && <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-500"><FileText size={11} />{task.reportId}</span>}</div>}

      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-slate-100 pt-3 text-[10px] text-slate-500">
        <span className="flex items-center gap-1"><UserRound size={12} className="text-slate-500" />{task.assignee}</span>
        <span className={cn('flex items-center gap-1', overdue && 'font-semibold text-amber-700')}><CalendarDays size={12} className="text-slate-500" />{overdue ? 'Overdue · ' : ''}{task.due}</span>
        <span className="flex items-center gap-1"><CircleDollarSign size={12} className="text-slate-500" />৳{Number(task.estimatedCost).toLocaleString('en-US')}</span>
        {task.comments.length > 0 && <span className="ml-auto flex items-center gap-1"><MessageSquareText size={12} className="text-slate-500" />{task.comments.length}</span>}
      </div>
    </button>
  )
}

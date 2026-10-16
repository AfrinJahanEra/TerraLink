import { CircleAlert, FileText, MessageSquareText } from 'lucide-react'
import { isTaskClosed, TASK_STATUS } from '../../constants/status'
import { cn } from '../../utils/cn'
import { formatBdt } from '../../utils/currency'
import { formatTaskDate, isTaskOverdue, relativeDue } from '../../utils/tasks'
import { Badge } from '../ui/Badge'

/* A plain text tag; only Urgent is set in ink so the eye finds it without colour. */
export function PriorityPill({ priority, className }) {
  const urgent = priority === 'Urgent'
  return (
    <span title={`${priority} priority`} className={cn('inline-flex h-4 shrink-0 items-center rounded-[3px] border px-1 text-[9px] font-semibold uppercase leading-none tracking-[0.06em]', urgent ? 'border-slate-800 text-slate-900' : 'border-slate-200 text-slate-500', className)}>
      {priority}
    </span>
  )
}

/** The deadline. `compact` keeps it to the date, with an alert mark when it has passed; `relative` phrases open work as "Due in 3 days". */
export function DueChip({ task, className, compact = false, relative = false }) {
  const overdue = isTaskOverdue(task)
  const label = relative && !isTaskClosed(task) ? relativeDue(task) : overdue && !compact ? `Overdue · ${task.due}` : task.due
  return (
    <span className={cn('inline-flex items-center gap-1 whitespace-nowrap text-[10.5px] tabular-nums', overdue ? 'font-medium text-rose-600' : 'text-slate-500', className)} title={overdue ? `Overdue since ${task.due}` : `Due ${task.due}`}>
      {overdue && compact && <CircleAlert size={11} className="text-rose-500" />}
      {label}
    </span>
  )
}

export function Assignee({ task, className, compact = false, firstName = false }) {
  return (
    <span className={cn('flex min-w-0 items-center gap-1.5', className)} title={task.assignee}>
      <span className="grid size-5 shrink-0 place-items-center rounded-full bg-slate-200 text-[8.5px] font-semibold text-slate-600">{task.initials}</span>
      {!compact && <span className="truncate text-[10.5px] text-slate-600">{firstName ? task.assignee.split(' ')[0] : task.assignee}</span>}
    </span>
  )
}

const firstName = (name) => name?.split(' ')[0] ?? 'someone'
const onDay = (iso) => (iso ? `, ${formatTaskDate(iso.slice(0, 10))}` : '')

/* One line that explains why the card sits in its column. */
function stageContext(task) {
  if (task.status === 'blocked' && task.blockedReason) return task.blockedReason
  const latest = task.submissions?.at(-1)
  if (task.status === 'awaiting_verification' && latest) return `Submitted by ${firstName(latest.submittedBy)}${onDay(latest.submittedAt)}`
  if (task.status === 'completed' && task.resolution) return `Signed off by ${firstName(task.resolution.by)}${onDay(task.resolution.at)}`
  return null
}

export function TaskCard({ task, onOpen, showStatus = false }) {
  const status = TASK_STATUS[task.status]
  const completed = task.status === 'completed'
  const context = stageContext(task)

  return (
    <button
      type="button"
      onClick={() => onOpen(task.id)}
      className="w-full rounded-md border border-slate-200 bg-white px-3 py-2.5 text-left transition-colors duration-150 hover:border-slate-400 focus-visible:border-slate-500 focus-visible:outline-none"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] font-medium tabular-nums text-slate-400">{task.id}</span>
        <PriorityPill priority={task.priority} />
      </div>

      <h3 className={cn('mt-1 line-clamp-2 text-[12px] font-semibold leading-[1.4] text-slate-900', completed && 'text-slate-500')}>{task.title}</h3>
      <p className="mt-0.5 truncate text-[10.5px] text-slate-500">{task.site}</p>

      {context && <p className="mt-2 line-clamp-2 border-l-2 border-slate-200 pl-2 text-[10.5px] leading-snug text-slate-500">{context}</p>}

      <div className="mt-2.5 flex items-center justify-between gap-2 border-t border-slate-100 pt-2">
        <Assignee task={task} compact className="shrink-0" />
        <span className="flex min-w-0 flex-1 items-center gap-2.5 overflow-hidden">
          {showStatus && <Badge tone={status.tone} className="px-1.5 py-0 text-[9.5px]">{status.label}</Badge>}
          <DueChip task={task} compact relative />
          {task.reportId && <span title={`Created from report ${task.reportId}`} className="hidden items-center gap-0.5 whitespace-nowrap text-[10px] text-slate-400 min-[1400px]:inline-flex"><FileText size={10} />{task.reportId}</span>}
          {task.comments.length > 0 && <span className="inline-flex items-center gap-0.5 text-[10px] text-slate-400" title={`${task.comments.length} note${task.comments.length === 1 ? '' : 's'}`}><MessageSquareText size={10} />{task.comments.length}</span>}
        </span>
        <span className="shrink-0 text-[10.5px] font-semibold tabular-nums text-slate-700">{formatBdt(task.estimatedCost)}</span>
      </div>
    </button>
  )
}

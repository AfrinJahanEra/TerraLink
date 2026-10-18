import { X } from 'lucide-react'
import { BOARD_STATUSES, TASK_STATUS } from '../../constants/status'
import { cn } from '../../utils/cn'
import { formatBdt } from '../../utils/currency'
import { isTaskOverdue } from '../../utils/tasks'
import { stageTotal } from './stages'

/** A flat summary bar of the workflow; each stage cell doubles as the stage filter. */
export function TaskPipeline({ tasks, activeStatus, reviewCount = 0, onSelect }) {
  const boardTasks = tasks.filter((task) => BOARD_STATUSES.includes(task.status))
  const total = boardTasks.length
  const completed = boardTasks.filter((task) => task.status === 'completed').length
  const percent = total ? Math.round((completed / total) * 100) : 0

  return (
    <section aria-label="Task summary" className="flex flex-wrap items-stretch overflow-hidden rounded-lg border border-slate-200 bg-white">
      <div className="grid min-w-0 flex-1 grid-cols-2 divide-x divide-slate-100 sm:grid-cols-3 lg:grid-cols-5">
        {BOARD_STATUSES.map((statusId) => {
          const stageTasks = boardTasks.filter((task) => task.status === statusId)
          const overdue = stageTasks.filter(isTaskOverdue).length
          const active = activeStatus === statusId
          const needsReview = statusId === 'awaiting_verification' && reviewCount > 0
          return (
            <button
              key={statusId}
              type="button"
              aria-pressed={active}
              onClick={() => onSelect(active ? 'all' : statusId)}
              className={cn('relative min-w-0 px-3.5 py-2 text-left transition-colors hover:bg-slate-50', active && 'bg-slate-50')}
            >
              {active && <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-[2px] bg-slate-900" />}
              <span className={cn('block truncate text-[9.5px] font-semibold uppercase tracking-[0.08em]', active ? 'text-slate-900' : 'text-slate-400')}>{TASK_STATUS[statusId].label}</span>
              <span className="mt-0.5 flex items-baseline gap-1.5">
                <span className="text-[15px] font-semibold leading-tight tabular-nums text-slate-900">{stageTasks.length}</span>
                <span className="truncate text-[10px] tabular-nums text-slate-400">
                  {overdue > 0 ? <span className="font-medium text-rose-600">{overdue} overdue</span>
                    : needsReview ? <span className="font-medium text-slate-700">{reviewCount} for you</span>
                      : formatBdt(stageTotal(stageTasks))}
                </span>
              </span>
            </button>
          )
        })}
      </div>
      <div className="flex shrink-0 items-center gap-3 border-l border-slate-100 px-3.5 py-2">
        <div>
          <span className="block text-[9.5px] font-semibold uppercase tracking-[0.08em] text-slate-400">Signed off</span>
          <span className="mt-0.5 block text-[15px] font-semibold leading-tight tabular-nums text-slate-900">{percent}%<span className="ml-1.5 text-[10px] font-normal text-slate-400">of {total}</span></span>
        </div>
        {activeStatus !== 'all' && (
          <button type="button" onClick={() => onSelect('all')} className="inline-flex h-6 items-center gap-1 rounded border border-slate-200 px-1.5 text-[10px] font-medium text-slate-500 transition-colors hover:border-slate-300 hover:text-slate-900" title="Show all stages">
            <X size={11} />Clear
          </button>
        )}
      </div>
    </section>
  )
}

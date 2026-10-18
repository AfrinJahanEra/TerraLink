import { ChevronRight, LayoutGrid, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { BOARD_STATUSES, TASK_STATUS } from '../../constants/status'
import { taskBudget } from '../../utils/budget'
import { cn } from '../../utils/cn'
import { formatBdt } from '../../utils/currency'
import { isTaskOverdue } from '../../utils/tasks'
import { Badge } from '../ui/Badge'
import { STAGE_EMPTY, STAGE_ICONS as columnIcons, stageTotal } from './stages'
import { Assignee, DueChip, PriorityPill, TaskCard } from './TaskCard'

/* Each column previews its first two tasks; the rest of the queue opens in a floating panel. */
const PREVIEW_COUNT = 2

function CountPill({ value }) {
  return <span className="text-[10.5px] font-medium tabular-nums text-slate-400">{value}</span>
}

export function TaskBoard({ tasks, focusStatus = null, onClearFocus, onOpenTask }) {
  const [openStage, setOpenStage] = useState(null)
  const stageTasks = openStage ? tasks.filter((task) => task.status === openStage) : []

  if (focusStatus) return <FocusedStage statusId={focusStatus} tasks={tasks} onClear={onClearFocus} onOpenTask={onOpenTask} />

  return (
    <div className="overflow-x-auto pb-2">
      <div className="grid min-w-[1040px] grid-cols-5 gap-2.5">
        {BOARD_STATUSES.map((statusId) => {
          const columnTasks = tasks.filter((task) => task.status === statusId)
          const preview = columnTasks.slice(0, PREVIEW_COUNT)
          const extra = columnTasks.length - preview.length
          const Icon = columnIcons[statusId]
          return (
            <section key={statusId} className="flex flex-col rounded-lg border border-slate-200 bg-slate-50">
              <header className="flex items-center gap-1.5 border-b border-slate-200 px-3 py-2">
                <Icon size={12} aria-hidden="true" className="shrink-0 text-slate-400" />
                <h2 className="min-w-0 flex-1 truncate text-[11px] font-semibold text-slate-700">{TASK_STATUS[statusId].label}</h2>
                <CountPill value={columnTasks.length} />
              </header>
              <div className="flex flex-1 flex-col gap-1.5 p-1.5">
                {preview.length ? preview.map((task) => <TaskCard key={task.id} task={task} onOpen={onOpenTask} />) : (
                  <p className="px-1.5 py-6 text-center text-[10.5px] text-slate-400">{STAGE_EMPTY[statusId]}</p>
                )}
              </div>
              {extra > 0 && (
                <button type="button" onClick={() => setOpenStage(statusId)} className="flex h-7 w-full items-center justify-between border-t border-slate-200 px-3 text-[10.5px] font-medium text-slate-500 transition-colors hover:bg-white hover:text-slate-900">
                  <span>{extra} more</span><span className="inline-flex items-center gap-0.5">View all<ChevronRight size={12} /></span>
                </button>
              )}
            </section>
          )
        })}
      </div>

      {openStage && (
        <StageTasksPanel
          statusId={openStage}
          tasks={stageTasks}
          onClose={() => setOpenStage(null)}
          onOpenTask={(taskId) => { setOpenStage(null); onOpenTask(taskId) }}
        />
      )}
    </div>
  )
}

/* A single stage at full width, reached from the pipeline; every task shows as a card. */
function FocusedStage({ statusId, tasks, onClear, onOpenTask }) {
  const Icon = columnIcons[statusId] ?? LayoutGrid
  const overdue = tasks.filter(isTaskOverdue).length
  return (
    <section className="animate-fade-in rounded-lg border border-slate-200 bg-slate-50">
      <header className="flex flex-wrap items-center gap-x-2 gap-y-1 border-b border-slate-200 px-3 py-2">
        <Icon size={12} aria-hidden="true" className="text-slate-400" />
        <h2 className="text-[11.5px] font-semibold text-slate-800">{TASK_STATUS[statusId]?.label}</h2>
        <CountPill value={tasks.length} />
        <span className="text-[10.5px] tabular-nums text-slate-400">· {formatBdt(stageTotal(tasks))} budget{overdue > 0 && <span className="text-rose-600"> · {overdue} overdue</span>}</span>
        <button type="button" onClick={onClear} className="ml-auto inline-flex h-6 items-center gap-1 rounded border border-slate-200 bg-white px-2 text-[10.5px] font-medium text-slate-600 transition-colors hover:border-slate-300 hover:text-slate-900"><X size={11} />Clear stage</button>
      </header>
      <div className="grid gap-1.5 p-1.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {tasks.map((task) => <TaskCard key={task.id} task={task} onOpen={onOpenTask} />)}
      </div>
    </section>
  )
}

/* One row per task in a single column; the columns line up so the eye can scan down them. */
const STAGE_COLUMNS = 'md:grid-cols-[64px_minmax(0,1fr)_96px_110px_130px_84px]'

function StageTasksPanel({ statusId, tasks, onClose, onOpenTask }) {
  const Icon = columnIcons[statusId]
  const overdue = tasks.filter(isTaskOverdue).length

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-[1000] grid place-items-center bg-slate-950/40 p-4 backdrop-blur-[2px]" role="dialog" aria-modal="true" aria-labelledby="stage-panel-title" onClick={onClose}>
      <div className="animate-fade-in flex max-h-[85vh] w-full max-w-5xl flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-pop" onClick={(event) => event.stopPropagation()}>
        <header className="flex items-center gap-2.5 border-b border-slate-200 px-4 py-3">
          <Icon size={13} className="shrink-0 text-slate-400" />
          <div className="min-w-0 flex-1">
            <h2 id="stage-panel-title" className="text-[12px] font-semibold text-slate-900">{TASK_STATUS[statusId].label}</h2>
            <p className="flex flex-wrap items-center gap-x-1.5 text-[10.5px] tabular-nums text-slate-500">
              <span>{tasks.length} {tasks.length === 1 ? 'task' : 'tasks'}</span>
              <span aria-hidden="true" className="text-slate-300">•</span>
              <span>{formatBdt(stageTotal(tasks))} budget</span>
              {overdue > 0 && <><span aria-hidden="true" className="text-slate-300">•</span><span className="text-rose-600">{overdue} overdue</span></>}
            </p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="grid size-7 place-items-center rounded text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"><X size={15} /></button>
        </header>
        <div className="task-column-scroll min-h-0 flex-1 overflow-y-auto bg-white">
          <div className={cn('sticky top-0 z-10 hidden gap-4 border-b border-slate-200 bg-slate-50 px-4 py-1.5 text-[9.5px] font-semibold uppercase tracking-[0.08em] text-slate-500 md:grid', STAGE_COLUMNS)}>
            <span>ID</span><span>Task</span><span>Priority</span><span>Assignee</span><span>Due</span><span className="text-right">Budget</span>
          </div>
          <div className="space-y-1.5 bg-slate-50 p-2 md:hidden">
            {tasks.map((task) => <TaskCard key={task.id} task={task} onOpen={onOpenTask} />)}
          </div>
          <div className="hidden divide-y divide-slate-100 md:block">
            {tasks.map((task) => (
              <button key={task.id} type="button" onClick={() => onOpenTask(task.id)} className={cn('grid w-full items-center gap-4 px-4 py-2 text-left text-[11px] transition hover:bg-slate-50 focus-visible:bg-slate-50', STAGE_COLUMNS)}>
                <span className="text-[10.5px] tabular-nums text-slate-400">{task.id}</span>
                <span className="min-w-0">
                  <span className={cn('block truncate text-[11.5px] font-medium text-slate-900', task.status === 'completed' && 'text-slate-500')}>{task.title}</span>
                  <span className="block truncate text-[10.5px] text-slate-500">{task.site}{task.reportId ? ` · from ${task.reportId}` : ''}</span>
                </span>
                <span><PriorityPill priority={task.priority} /></span>
                <Assignee task={task} firstName />
                <DueChip task={task} />
                <span className="text-right font-medium tabular-nums text-slate-700">{formatBdt(taskBudget(task))}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

const LIST_COLUMNS = 'md:grid-cols-[72px_minmax(220px,1fr)_100px_170px_150px_140px_90px]'

export function TaskListView({ tasks, onOpenTask }) {
  return (
    <section className="overflow-hidden rounded-lg border border-slate-200 bg-white">
      <div className={cn('hidden gap-4 border-b border-slate-200 bg-slate-50 px-4 py-2 text-[9.5px] font-semibold uppercase tracking-[0.08em] text-slate-500 md:grid', LIST_COLUMNS)}>
        <span>ID</span><span>Task</span><span>Priority</span><span>Assignee</span><span>Due date</span><span>Status</span><span className="text-right">Budget</span>
      </div>
      <div className="divide-y divide-slate-100 md:hidden">
        {tasks.map((task) => <div key={task.id} className="p-2"><TaskCard task={task} onOpen={onOpenTask} showStatus /></div>)}
      </div>
      <div className="hidden divide-y divide-slate-100 md:block">
        {tasks.map((task) => (
          <button key={task.id} type="button" onClick={() => onOpenTask(task.id)} className={cn('grid w-full items-center gap-4 px-4 py-2 text-left text-[11px] transition hover:bg-slate-50', LIST_COLUMNS)}>
            <span className="text-[10.5px] tabular-nums text-slate-400">{task.id}</span>
            <span className="min-w-0"><span className="block truncate text-[11.5px] font-medium text-slate-900">{task.title}</span><span className="block truncate text-[10.5px] text-slate-500">{task.site}</span></span>
            <span><PriorityPill priority={task.priority} /></span>
            <Assignee task={task} />
            <span><DueChip task={task} /></span>
            <span><Badge tone={TASK_STATUS[task.status].tone} className="px-1.5 py-0 text-[10px]">{TASK_STATUS[task.status].label}</Badge></span>
            <span className="text-right font-medium tabular-nums text-slate-700">{formatBdt(taskBudget(task))}</span>
          </button>
        ))}
      </div>
    </section>
  )
}

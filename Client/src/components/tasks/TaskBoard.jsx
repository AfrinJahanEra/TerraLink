import { BOARD_STATUSES, TASK_STATUS } from '../../constants/status'
import { TaskCard } from './TaskCard'

const columnStyles = {
  open: 'border-t-slate-300',
  in_progress: 'border-t-brand-500',
  blocked: 'border-t-amber-400',
  awaiting_verification: 'border-t-brand-300',
  completed: 'border-t-brand-800',
}

export function TaskBoard({ tasks, onOpenTask }) {
  return (
    <div className="overflow-x-auto pb-2">
      <div className="grid min-w-[1020px] grid-cols-5 gap-3">
        {BOARD_STATUSES.map((statusId) => {
          const columnTasks = tasks.filter((task) => task.status === statusId)
          return (
            <section key={statusId} className={`min-h-[420px] rounded-xl border border-t-2 border-slate-200 bg-slate-50/70 ${columnStyles[statusId]}`}>
              <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
                <h2 className="text-xs font-semibold text-slate-800">{TASK_STATUS[statusId].label}</h2>
                <span className="grid size-6 place-items-center rounded-full bg-white text-[10px] font-bold text-slate-600 ring-1 ring-slate-200">{columnTasks.length}</span>
              </div>
              <div className="space-y-3 p-3">
                {columnTasks.map((task) => <TaskCard key={task.id} task={task} onOpen={onOpenTask} />)}
                {!columnTasks.length && <p className="rounded-lg border border-dashed border-slate-200 bg-white/60 px-3 py-8 text-center text-[11px] text-slate-400">No tasks in this stage</p>}
              </div>
            </section>
          )
        })}
      </div>
    </div>
  )
}

export function TaskListView({ tasks, onOpenTask }) {
  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-card">
      <div className="hidden grid-cols-[90px_minmax(220px,1fr)_140px_150px_120px] gap-4 border-b border-slate-100 bg-slate-50/70 px-5 py-3 text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400 md:grid">
        <span>ID</span><span>Task</span><span>Assignee</span><span>Due date</span><span>Status</span>
      </div>
      <div className="divide-y divide-slate-100 md:hidden">
        {tasks.map((task) => <div key={task.id} className="p-3"><TaskCard task={task} onOpen={onOpenTask} showStatus /></div>)}
      </div>
      <div className="hidden divide-y divide-slate-100 md:block">
        {tasks.map((task) => (
          <button key={task.id} type="button" onClick={() => onOpenTask(task.id)} className="grid w-full grid-cols-[90px_minmax(220px,1fr)_140px_150px_120px] items-center gap-4 px-5 py-3.5 text-left text-xs transition hover:bg-slate-50">
            <span className="font-semibold text-slate-500">{task.id}</span>
            <span className="min-w-0"><span className="block truncate font-semibold text-slate-800">{task.title}</span><span className="mt-0.5 block truncate text-[10px] text-slate-400">{task.site}</span></span>
            <span className="truncate text-slate-600">{task.assignee}</span>
            <span className="text-slate-600">{task.due}</span>
            <span className="font-semibold text-slate-600">{TASK_STATUS[task.status].label}</span>
          </button>
        ))}
      </div>
    </section>
  )
}

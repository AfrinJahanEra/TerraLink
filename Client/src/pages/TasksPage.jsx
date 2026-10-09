import {
  AlertTriangle,
  ArrowRight,
  Check,
  ClipboardCheck,
  LayoutGrid,
  List,
  Plus,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { TaskBoard, TaskListView } from '../components/tasks/TaskBoard'
import { TaskDetailDrawer } from '../components/tasks/TaskDetailDrawer'
import { TaskFilters } from '../components/tasks/TaskFilters'
import { TaskFormModal } from '../components/tasks/TaskFormModal'
import { Button } from '../components/ui/Button'
import { SITE_STATUS } from '../constants/status'
import { useApp } from '../hooks/useApp'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { cn } from '../utils/cn'
import { createActivity, formatTaskDate, isTaskOverdue } from '../utils/tasks'

const emptyFilters = { search: '', site: 'all', status: 'all', assignee: 'all', overdue: false }

function ObservationQueue({ sites, canCreate, onCreate }) {
  const observations = sites.filter((site) => site.status === 'needs_review')

  return (
    <section className="rounded-xl border border-slate-200 bg-white shadow-card">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4"><div><h2 className="text-sm font-semibold text-slate-900">Observation queue</h2><p className="mt-0.5 text-xs text-slate-400">Findings awaiting a documented review decision</p></div><span className="text-xs font-semibold text-slate-500">{observations.length} pending</span></div>
      {observations.length ? (
        <div className="divide-y divide-slate-100">
          {observations.map((site) => (
            <div key={site.id} className="flex flex-col gap-3 px-5 py-3.5 sm:flex-row sm:items-center">
              <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-600"><AlertTriangle size={17} /></span>
              <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="text-xs font-semibold text-slate-800">{site.name} · {site.location}</p><span className="rounded-full bg-amber-50 px-2 py-0.5 text-[9px] font-semibold text-amber-700">{SITE_STATUS[site.status].label}</span></div><p className="mt-1 truncate text-[11px] text-slate-500">{site.reviewNote}</p></div>
              <div className="flex items-center gap-2"><Link to={`/sites/${site.id}`} className="inline-flex h-9 items-center gap-1 rounded-lg px-2.5 text-[11px] font-semibold text-brand-700 hover:bg-brand-50">Review <ArrowRight size={13} className="text-slate-500" /></Link>{canCreate && <button type="button" onClick={() => onCreate(site.id)} className="h-9 rounded-lg border border-slate-200 px-2.5 text-[11px] font-semibold text-slate-700 hover:bg-slate-50">Create task</button>}</div>
            </div>
          ))}
        </div>
      ) : (
        <p className="px-5 py-8 text-center text-xs text-slate-500">No observations currently require review.</p>
      )}
    </section>
  )
}

export function TasksPage() {
  const { role, sites, tasks, teamMembers, createTask, updateTask, addTaskComment } = useApp()
  const [searchParams] = useSearchParams()
  const [view, setView] = useLocalStorage('terralink.tasks.view', 'board')
  const [filters, setFilters] = useState(emptyFilters)
  const [selectedTaskId, setSelectedTaskId] = useState(() => searchParams.get('task'))
  const [createOpen, setCreateOpen] = useState(false)
  const [initialSiteId, setInitialSiteId] = useState(null)
  const [modalVersion, setModalVersion] = useState(0)
  const [notice, setNotice] = useState('')
  const canCreate = role.id === 'manager' || role.id === 'operator'

  const roleTasks = useMemo(
    () => role.id === 'coordinator' ? tasks.filter((task) => task.assignee === role.user.name) : tasks,
    [role, tasks],
  )

  const filteredTasks = useMemo(() => {
    const search = filters.search.trim().toLowerCase()
    return roleTasks.filter((task) => {
      const matchesSearch = !search || `${task.id} ${task.title} ${task.site}`.toLowerCase().includes(search)
      const matchesSite = filters.site === 'all' || task.siteId === filters.site
      const matchesStatus = filters.status === 'all' || task.status === filters.status
      const matchesAssignee = filters.assignee === 'all' || task.assignee === filters.assignee
      return matchesSearch && matchesSite && matchesStatus && matchesAssignee && (!filters.overdue || isTaskOverdue(task))
    })
  }, [filters, roleTasks])

  const selectedTask = roleTasks.find((task) => task.id === selectedTaskId) ?? null
  const openCount = roleTasks.filter((task) => task.status !== 'reported_complete').length
  const overdueCount = roleTasks.filter(isTaskOverdue).length
  const completedCount = roleTasks.filter((task) => task.status === 'reported_complete').length

  function showNotice(message) {
    setNotice(message)
    window.setTimeout(() => setNotice(''), 2600)
  }

  function openTaskForm(siteId = null) {
    setInitialSiteId(siteId)
    setModalVersion((version) => version + 1)
    setCreateOpen(true)
  }

  function handleCreate(task) {
    const highestId = tasks.reduce((highest, item) => Math.max(highest, Number(item.id.replace('TL-', '')) || 0), 100)
    const id = `TL-${highestId + 1}`
    createTask({
      ...task,
      id,
      due: formatTaskDate(task.dueDate),
      status: 'review_pending',
      assignedBy: role.user.name,
      createdAt: new Date().toISOString(),
      comments: [],
      activityHistory: [createActivity('Task created and added to review queue', role.user.name)],
    })
    setCreateOpen(false)
    showNotice(`${id} created successfully.`)
  }

  function handleUpdate(changes) {
    const memberChanged = changes.assignee !== selectedTask.assignee
    const statusChanged = changes.status !== selectedTask.status
    const action = statusChanged ? `Status changed to ${changes.status.replaceAll('_', ' ')}` : memberChanged ? `Task reassigned to ${changes.assignee}` : 'Task record updated'
    updateTask(selectedTask.id, { ...changes, due: formatTaskDate(changes.dueDate) }, createActivity(action, role.user.name))
    showNotice(`${selectedTask.id} updated.`)
  }

  function handleComment(text) {
    const now = new Date()
    const displayDate = new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).format(now)
    addTaskComment(
      selectedTask.id,
      { id: `comment-${Date.now()}`, author: role.user.name, text, time: displayDate },
      createActivity('Inspection note added', role.user.name),
    )
    showNotice('Inspection note added.')
  }

  return (
    <div className="animate-fade-in space-y-5 pb-8">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div><p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-700">Operations workflow</p><h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">Review & tasks</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">Move observations through accountable review, assignment, field progress, and reported completion.</p></div>
        {canCreate && <Button type="button" onClick={() => openTaskForm()}><Plus size={16} />Create task</Button>}
      </header>

      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-y border-slate-200 py-3 text-xs text-slate-500">
        <span><strong className="font-semibold text-slate-800">{roleTasks.length}</strong> visible tasks</span>
        <span><strong className="font-semibold text-slate-800">{openCount}</strong> open</span>
        <span><strong className="font-semibold text-rose-700">{overdueCount}</strong> overdue</span>
        <span><strong className="font-semibold text-slate-800">{completedCount}</strong> completed</span>
        <span className="ml-auto text-[10px] text-slate-400">{role.id === 'coordinator' ? 'Showing your assignments only' : 'Showing programme-wide tasks'}</span>
      </div>

      <ObservationQueue sites={sites} canCreate={canCreate} onCreate={openTaskForm} />
      <TaskFilters filters={filters} sites={sites} members={teamMembers} onChange={setFilters} onReset={() => setFilters(emptyFilters)} />

      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-slate-500"><strong className="font-semibold text-slate-800">{filteredTasks.length}</strong> matching tasks</p>
        <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1 shadow-card">
          <button type="button" onClick={() => setView('board')} className={cn('flex h-8 items-center gap-1.5 rounded-md px-2.5 text-[11px] font-semibold transition', view === 'board' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:bg-slate-50')}><LayoutGrid size={14} className={view === 'board' ? 'text-white' : 'text-slate-500'} />Board</button>
          <button type="button" onClick={() => setView('list')} className={cn('flex h-8 items-center gap-1.5 rounded-md px-2.5 text-[11px] font-semibold transition', view === 'list' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:bg-slate-50')}><List size={14} className={view === 'list' ? 'text-white' : 'text-slate-500'} />List</button>
        </div>
      </div>

      {filteredTasks.length ? (
        view === 'board' ? <TaskBoard tasks={filteredTasks} onOpenTask={setSelectedTaskId} /> : <TaskListView tasks={filteredTasks} onOpenTask={setSelectedTaskId} />
      ) : (
        <section className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center"><ClipboardCheck size={28} className="mx-auto text-slate-400" /><h2 className="mt-3 text-sm font-semibold text-slate-800">No matching tasks</h2><p className="mt-1 text-xs text-slate-500">Clear or adjust the current filters to see more work.</p><button type="button" onClick={() => setFilters(emptyFilters)} className="mt-4 text-xs font-semibold text-brand-700">Reset filters</button></section>
      )}

      <TaskFormModal key={`${initialSiteId ?? 'all'}-${modalVersion}`} open={createOpen} sites={sites} members={teamMembers} initialSiteId={initialSiteId} onClose={() => setCreateOpen(false)} onCreate={handleCreate} />
      {selectedTask && <TaskDetailDrawer key={selectedTask.id} task={selectedTask} role={role} members={teamMembers} onClose={() => setSelectedTaskId(null)} onUpdate={handleUpdate} onAddComment={handleComment} />}
      {notice && <div role="status" className="fixed bottom-5 right-5 z-[1100] flex max-w-sm items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-3 text-xs font-semibold text-slate-700 shadow-pop"><Check size={15} className="text-slate-600" />{notice}</div>}
    </div>
  )
}

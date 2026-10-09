import {
  ArrowRight,
  CalendarDays,
  ClipboardCheck,
  LayoutGrid,
  List,
  Plus,
  ScanSearch,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { TaskBoard, TaskListView } from '../components/tasks/TaskBoard'
import { TaskDetailDrawer } from '../components/tasks/TaskDetailDrawer'
import { TaskFilters } from '../components/tasks/TaskFilters'
import { TaskFormModal } from '../components/tasks/TaskFormModal'
import { Button } from '../components/ui/Button'
import { PageHeader } from '../components/ui/PageHeader'
import { SummaryStrip } from '../components/ui/SummaryStrip'
import { Toast } from '../components/ui/Toast'
import { useApp } from '../hooks/useApp'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { useNotice } from '../hooks/useNotice'
import { cn } from '../utils/cn'
import { describeCalendarResult, describeEmailResult, describeWhatsAppResult } from '../utils/communications'
import { createActivity, formatTaskDate, isTaskOverdue } from '../utils/tasks'

const emptyFilters = { search: '', site: 'all', status: 'all', assignee: 'all', overdue: false }

export function TasksPage() {
  const {
    role, sites, tasks, teamMembers, notificationLogs, createTask, updateTask, addTaskComment,
    addTaskToCalendar, downloadTaskIcs, emailTaskReminder, whatsappTaskReminder,
  } = useApp()
  const [searchParams, setSearchParams] = useSearchParams()
  const [view, setView] = useLocalStorage('terralink.tasks.view', 'board')
  const [filters, setFilters] = useState(() => ({ ...emptyFilters, site: !searchParams.get('new') && searchParams.get('site') ? searchParams.get('site') : 'all' }))
  const [notice, showNotice] = useNotice(3500)
  const canCreate = role.id === 'manager' || role.id === 'operator'
  const selectedTaskId = searchParams.get('task')
  const createOpen = canCreate && searchParams.get('new') === 'task'
  const initialSiteId = searchParams.get('site')

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
  const selectedLogs = useMemo(
    () => selectedTask ? notificationLogs.filter((log) => log.taskId === selectedTask.id) : [],
    [notificationLogs, selectedTask],
  )
  const openCount = roleTasks.filter((task) => task.status !== 'reported_complete').length
  const overdueCount = roleTasks.filter(isTaskOverdue).length
  const completedCount = roleTasks.filter((task) => task.status === 'reported_complete').length
  const reviewCount = sites.filter((site) => site.status === 'needs_review').length

  function openTask(taskId) {
    setSearchParams({ task: taskId })
  }

  function closePanel() {
    setSearchParams({}, { replace: true })
  }

  function openTaskForm() {
    setSearchParams({ new: 'task' })
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
    setSearchParams({ task: id }, { replace: true })
    showNotice(`${id} created. Use the follow-up actions to add the deadline to a calendar or remind the assignee.`)
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
      <PageHeader
        eyebrow="Field operations"
        title="Tasks"
        description="Assign field work, track progress to reported completion, and follow up by calendar, email, or WhatsApp from each task."
        actions={(
          <>
            <Link to="/schedule" className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 shadow-card hover:bg-slate-50"><CalendarDays size={15} className="text-slate-500" />Schedule</Link>
            {canCreate && <Button type="button" onClick={openTaskForm}><Plus size={16} />Create task</Button>}
          </>
        )}
      />

      <SummaryStrip
        items={[
          { label: 'visible tasks', value: roleTasks.length },
          { label: 'open', value: openCount },
          { label: 'overdue', value: overdueCount, tone: overdueCount ? 'rose' : 'default' },
          { label: 'completed', value: completedCount },
        ]}
        note={role.id === 'coordinator' ? 'Showing your assignments only' : 'Showing programme-wide tasks'}
      />

      {role.id !== 'coordinator' && reviewCount > 0 && (
        <Link to="/reviews" className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-5 py-3.5 shadow-card transition hover:border-slate-300">
          <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-600"><ScanSearch size={17} /></span>
          <div className="min-w-0 flex-1"><p className="text-xs font-semibold text-slate-800">{reviewCount} {reviewCount === 1 ? 'observation is' : 'observations are'} awaiting a review decision</p><p className="mt-0.5 text-[11px] text-slate-500">Record decisions and create follow-up tasks from the review queue.</p></div>
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-700">Open review queue <ArrowRight size={13} className="text-slate-500" /></span>
        </Link>
      )}

      <TaskFilters filters={filters} sites={sites} members={teamMembers} onChange={setFilters} onReset={() => setFilters(emptyFilters)} />

      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-slate-500"><strong className="font-semibold text-slate-800">{filteredTasks.length}</strong> matching tasks</p>
        <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1 shadow-card">
          <button type="button" onClick={() => setView('board')} className={cn('flex h-8 items-center gap-1.5 rounded-md px-2.5 text-[11px] font-semibold transition', view === 'board' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:bg-slate-50')}><LayoutGrid size={14} className={view === 'board' ? 'text-white' : 'text-slate-500'} />Board</button>
          <button type="button" onClick={() => setView('list')} className={cn('flex h-8 items-center gap-1.5 rounded-md px-2.5 text-[11px] font-semibold transition', view === 'list' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:bg-slate-50')}><List size={14} className={view === 'list' ? 'text-white' : 'text-slate-500'} />List</button>
        </div>
      </div>

      {filteredTasks.length ? (
        view === 'board' ? <TaskBoard tasks={filteredTasks} onOpenTask={openTask} /> : <TaskListView tasks={filteredTasks} onOpenTask={openTask} />
      ) : (
        <section className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center"><ClipboardCheck size={28} className="mx-auto text-slate-400" /><h2 className="mt-3 text-sm font-semibold text-slate-800">No matching tasks</h2><p className="mt-1 text-xs text-slate-500">Clear or adjust the current filters to see more work.</p><button type="button" onClick={() => setFilters(emptyFilters)} className="mt-4 text-xs font-semibold text-brand-700">Reset filters</button></section>
      )}

      <TaskFormModal key={searchParams.toString()} open={createOpen} sites={sites} members={teamMembers} initialSiteId={initialSiteId} onClose={closePanel} onCreate={handleCreate} />
      {selectedTask && (
        <TaskDetailDrawer
          key={selectedTask.id}
          task={selectedTask}
          role={role}
          members={teamMembers}
          logs={selectedLogs}
          onClose={closePanel}
          onUpdate={handleUpdate}
          onAddComment={handleComment}
          onAddToCalendar={() => addTaskToCalendar(selectedTask).then((result) => showNotice(describeCalendarResult(result)))}
          onDownloadIcs={() => { downloadTaskIcs(selectedTask); showNotice('Deadline file downloaded for Outlook, Apple, or Google Calendar.') }}
          onEmailReminder={() => emailTaskReminder(selectedTask).then((log) => showNotice(describeEmailResult([log], 'reminder')))}
          onWhatsAppReminder={() => showNotice(describeWhatsAppResult(whatsappTaskReminder(selectedTask)))}
        />
      )}
      <Toast message={notice} />
    </div>
  )
}

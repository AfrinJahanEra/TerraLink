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
import { ExpenseFormModal } from '../components/budget/ExpenseFormModal'
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
import { formatBdt } from '../utils/currency'
import { createActivity, formatTaskDate, isTaskOverdue } from '../utils/tasks'

const emptyFilters = { search: '', site: 'all', status: 'all', assignee: 'all', overdue: false }

const TASK_DESCRIPTIONS = {
  manager: 'Turn verified reports and review decisions into assigned work. Each task keeps its deadline, approved costs and completion evidence until you close it.',
  coordinator: 'Your assigned work. Start a task, record its costs, and submit completion photos for the project manager to review.',
  operator: 'Every task in the programme. You can add notes, record expenses and send reminders; the project manager assigns work and closes it.',
}

const TASK_NOTES = {
  coordinator: 'Showing your assignments only',
  operator: 'Read-only view of every task',
}

export function TasksPage() {
  const {
    role, can, scope, sites, tasks, expenses, teamMembers, notificationLogs, createTask, updateTaskPlan, addTaskComment,
    setTaskStatus, submitCompletion, reviewCompletion, addExpense, reviewExpense,
    addTaskToCalendar, downloadTaskIcs, emailTaskReminder, whatsappTaskReminder,
  } = useApp()
  const [searchParams, setSearchParams] = useSearchParams()
  const [view, setView] = useLocalStorage('terralink.tasks.view', 'board')
  const [filters, setFilters] = useState(() => ({ ...emptyFilters, site: !searchParams.get('new') && searchParams.get('site') ? searchParams.get('site') : 'all' }))
  const [notice, showNotice] = useNotice(3500)
  const [expenseFormOpen, setExpenseFormOpen] = useState(false)
  const canCreate = can('tasks.create')
  const selectedTaskId = searchParams.get('task')
  const createOpen = canCreate && searchParams.get('new') === 'task'
  const initialSiteId = searchParams.get('site')
  const sourceReport = scope.communityReports.find((item) => item.id === searchParams.get('report') && item.status === 'verified') ?? null

  // A coordinator's scope already contains only their own tasks; managers and operators see them all.
  const roleTasks = scope.tasks

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
  const openCount = roleTasks.filter((task) => task.status === 'open').length
  const inProgressCount = roleTasks.filter((task) => task.status === 'in_progress' || task.status === 'blocked').length
  const overdueCount = roleTasks.filter(isTaskOverdue).length
  const awaitingCount = roleTasks.filter((task) => task.status === 'awaiting_verification').length
  const completedCount = roleTasks.filter((task) => task.status === 'completed').length
  const needsReviewFromYou = can('tasks.review') ? awaitingCount : 0
  const reviewCount = can('reviews.view') ? sites.filter((site) => site.status === 'needs_review').length : 0

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
      status: 'open',
      assignedBy: role.user.name,
      createdAt: new Date().toISOString(),
      comments: [],
      activityHistory: [createActivity(task.reportId ? `Task created from verified report ${task.reportId}` : 'Task created', role.user.name)],
    })
    setSearchParams({ task: id }, { replace: true })
    showNotice(`${id} created. Use the follow-up actions to add the deadline to a calendar or remind the assignee.`)
  }

  function handleUpdate(changes) {
    const memberChanged = changes.assignee !== selectedTask.assignee
    const action = memberChanged ? `Task reassigned to ${changes.assignee}` : 'Task plan updated'
    updateTaskPlan(selectedTask.id, { ...changes, due: formatTaskDate(changes.dueDate) }, createActivity(action, role.user.name))
    showNotice(`${selectedTask.id} updated.`)
  }

  function guarded(action, success) {
    return (...args) => {
      try {
        action(...args)
        if (success) showNotice(success)
      } catch (error) {
        showNotice(error instanceof Error ? error.message : 'That change was not allowed.')
      }
    }
  }

  async function handleExpense(expense) {
    const highestId = expenses.reduce((highest, item) => Math.max(highest, Number(item.id.replace('EXP-', '')) || 0), 0)
    const id = `EXP-${String(highestId + 1).padStart(3, '0')}`
    const entry = addExpense({ ...expense, id, createdBy: role.user.name, createdAt: new Date().toISOString() }, createActivity(`${formatBdt(expense.amount)} expense recorded`, role.user.name))
    setExpenseFormOpen(false)
    showNotice(entry.approvalStatus === 'approved' ? `${id} recorded and approved.` : `${id} recorded. It counts once the project manager approves it.`)
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
        description={TASK_DESCRIPTIONS[role.id]}
        actions={(
          <>
            <Link to="/schedule" className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 shadow-card hover:bg-slate-50"><CalendarDays size={15} className="text-slate-500" />Schedule</Link>
            {canCreate && <Button type="button" onClick={openTaskForm}><Plus size={16} />Create task</Button>}
          </>
        )}
      />

      <SummaryStrip
        items={[
          { label: 'open', value: openCount },
          { label: 'in progress', value: inProgressCount },
          { label: 'overdue', value: overdueCount, tone: overdueCount ? 'rose' : 'default' },
          { label: 'awaiting verification', value: awaitingCount, tone: awaitingCount ? 'amber' : 'default' },
          { label: 'completed', value: completedCount },
        ]}
        note={TASK_NOTES[role.id]}
      />

      {needsReviewFromYou > 0 && (
        <button type="button" onClick={() => setFilters({ ...emptyFilters, status: 'awaiting_verification' })} className="flex w-full items-center gap-3 rounded-xl border border-brand-200 bg-brand-50 px-5 py-3.5 text-left transition hover:border-brand-300">
          <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-white text-brand-700"><ClipboardCheck size={17} /></span>
          <div className="min-w-0 flex-1"><p className="text-xs font-semibold text-slate-800">{needsReviewFromYou} {needsReviewFromYou === 1 ? 'task is' : 'tasks are'} waiting for your verification</p><p className="mt-0.5 text-[11px] text-slate-500">Check the completion photos and accept the work or send it back.</p></div>
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-800">Show them <ArrowRight size={13} /></span>
        </button>
      )}

      {reviewCount > 0 && (
        <Link to="/reviews" className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-5 py-3.5 shadow-card transition hover:border-slate-300">
          <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-600"><ScanSearch size={17} /></span>
          <div className="min-w-0 flex-1"><p className="text-xs font-semibold text-slate-800">{reviewCount} {reviewCount === 1 ? 'observation is' : 'observations are'} awaiting a review decision</p><p className="mt-0.5 text-[11px] text-slate-500">Record decisions and create follow-up tasks from the review queue.</p></div>
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-700">Open review queue <ArrowRight size={13} className="text-slate-500" /></span>
        </Link>
      )}

      <TaskFilters filters={filters} sites={scope.sites} members={teamMembers} showAssignee={role.id !== 'coordinator'} onChange={setFilters} onReset={() => setFilters(emptyFilters)} />

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

      <TaskFormModal key={searchParams.toString()} open={createOpen} sites={sites} members={teamMembers} initialSiteId={initialSiteId} report={sourceReport} onClose={closePanel} onCreate={handleCreate} />
      {selectedTask && (
        <TaskDetailDrawer
          key={selectedTask.id}
          task={selectedTask}
          report={scope.communityReports.find((item) => item.id === selectedTask.reportId) ?? null}
          expenses={scope.expenses}
          role={role}
          members={teamMembers}
          logs={selectedLogs}
          onClose={closePanel}
          onUpdate={handleUpdate}
          onAddComment={handleComment}
          onSetStatus={guarded((status, reason) => setTaskStatus(selectedTask.id, status, reason), 'Task updated.')}
          onSubmitCompletion={guarded((submission) => submitCompletion(selectedTask.id, submission), 'Completion evidence submitted. The project manager can now review it.')}
          onReviewCompletion={guarded((review) => reviewCompletion(selectedTask.id, review), 'Review recorded.')}
          onAddExpense={() => setExpenseFormOpen(true)}
          onReviewExpense={guarded((expenseId, decision, note) => reviewExpense(expenseId, decision, note))}
          onAddToCalendar={() => addTaskToCalendar(selectedTask).then((result) => showNotice(describeCalendarResult(result)))}
          onDownloadIcs={() => { downloadTaskIcs(selectedTask); showNotice('Deadline file downloaded for Outlook, Apple, or Google Calendar.') }}
          onEmailReminder={() => emailTaskReminder(selectedTask).then((log) => showNotice(describeEmailResult([log], 'reminder')))}
          onWhatsAppReminder={() => showNotice(describeWhatsAppResult(whatsappTaskReminder(selectedTask)))}
        />
      )}
      {selectedTask && <ExpenseFormModal key={`expense-${selectedTask.id}`} open={expenseFormOpen} lockTask tasks={[selectedTask]} initialTaskId={selectedTask.id} onClose={() => setExpenseFormOpen(false)} onCreate={handleExpense} />}
      <Toast message={notice} />
    </div>
  )
}

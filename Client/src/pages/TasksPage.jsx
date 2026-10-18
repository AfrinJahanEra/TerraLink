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
import { TaskFilters, TaskQuickViews } from '../components/tasks/TaskFilters'
import { TaskFormModal } from '../components/tasks/TaskFormModal'
import { TaskPipeline } from '../components/tasks/TaskPipeline'
import { Toast } from '../components/ui/Toast'
import { BOARD_STATUSES } from '../constants/status'
import { useApp } from '../hooks/useApp'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { useNotice } from '../hooks/useNotice'
import { cn } from '../utils/cn'
import { describeCalendarResult, describeEmailResult, describeTaskFollowUp } from '../utils/communications'
import { formatBdt } from '../utils/currency'
import { assignableMembers, createActivity, formatTaskDate, sortTasks, TASK_QUICK_VIEWS, TASK_SORTS } from '../utils/tasks'

const emptyFilters = { search: '', site: 'all', status: 'all', assignee: 'all', quick: 'all' }

const TASK_NOTES = {
  coordinator: 'Showing your assignments only',
}

export function TasksPage() {
  const {
    role, can, scope, sites, tasks, expenses, teamMembers, notificationLogs, createTask, updateTaskPlan, addTaskComment,
    setTaskStatus, submitCompletion, reviewCompletion, addExpense, reviewExpense,
    addTaskToCalendar, emailTaskReminder,
  } = useApp()
  const [searchParams, setSearchParams] = useSearchParams()
  const [view, setView] = useLocalStorage('terralink.tasks.view', 'board')
  const [sort, setSort] = useLocalStorage('terralink.tasks.sort.v2', 'recent')
  const [filters, setFilters] = useState(() => ({ ...emptyFilters, site: !searchParams.get('new') && searchParams.get('site') ? searchParams.get('site') : 'all' }))
  const [notice, showNotice] = useNotice(3500)
  const [expenseFormOpen, setExpenseFormOpen] = useState(false)
  const canCreate = can('tasks.create')
  const selectedTaskId = searchParams.get('task')
  const createOpen = canCreate && searchParams.get('new') === 'task'
  const initialSiteId = searchParams.get('site')
  const sourceReport = scope.communityReports.find((item) => item.id === searchParams.get('report') && item.status === 'verified') ?? null

  // A coordinator's scope already contains only their own tasks; the manager sees them all.
  const roleTasks = scope.tasks

  // Search, site and assignee narrow the scope; quick views and the stage then slice it, so the counts on each control stay meaningful.
  const scopedTasks = useMemo(() => {
    const search = filters.search.trim().toLowerCase()
    return roleTasks.filter((task) => {
      const matchesSearch = !search || `${task.id} ${task.title} ${task.site}`.toLowerCase().includes(search)
      const matchesSite = filters.site === 'all' || task.siteId === filters.site
      const matchesAssignee = filters.assignee === 'all' || task.assignee === filters.assignee
      return matchesSearch && matchesSite && matchesAssignee
    })
  }, [filters.search, filters.site, filters.assignee, roleTasks])

  const quickCounts = useMemo(
    () => Object.fromEntries([['all', scopedTasks.length], ...TASK_QUICK_VIEWS.map((item) => [item.id, scopedTasks.filter(item.test).length])]),
    [scopedTasks],
  )

  const pipelineTasks = useMemo(() => {
    const quick = TASK_QUICK_VIEWS.find((item) => item.id === filters.quick)
    return quick ? scopedTasks.filter(quick.test) : scopedTasks
  }, [filters.quick, scopedTasks])

  const filteredTasks = useMemo(
    () => sortTasks(filters.status === 'all' ? pipelineTasks : pipelineTasks.filter((task) => task.status === filters.status), TASK_SORTS[sort] ? sort : 'recent'),
    [filters.status, pipelineTasks, sort],
  )

  const selectedTask = roleTasks.find((task) => task.id === selectedTaskId) ?? null
  const selectedLogs = useMemo(
    () => selectedTask ? notificationLogs.filter((log) => log.taskId === selectedTask.id) : [],
    [notificationLogs, selectedTask],
  )
  const assignees = useMemo(() => assignableMembers(teamMembers), [teamMembers])
  const filterMembers = useMemo(() => teamMembers.filter((member) => roleTasks.some((task) => task.assignee === member.name)), [roleTasks, teamMembers])
  const awaitingCount = roleTasks.filter((task) => task.status === 'awaiting_verification').length
  const needsReviewFromYou = can('tasks.review') ? awaitingCount : 0
  const reviewCount = can('sites.register') ? sites.filter((site) => site.status === 'needs_review').length : 0
  const filtersActive = filters.search || filters.site !== 'all' || filters.status !== 'all' || filters.assignee !== 'all' || filters.quick !== 'all'
  const focusStatus = BOARD_STATUSES.includes(filters.status) ? filters.status : null

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
    const followUp = createTask({
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
    showNotice(`${id} created and added to the TerraLink schedule.`)
    followUp.then((logs) => showNotice(describeTaskFollowUp(id, logs)))
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
    <div className="animate-fade-in space-y-3 pb-8">
      <TaskPipeline tasks={pipelineTasks} activeStatus={filters.status} reviewCount={needsReviewFromYou} onSelect={(status) => setFilters((current) => ({ ...current, status }))} />

      <div className="space-y-2.5">
        <TaskFilters filters={filters} sites={scope.sites} members={filterMembers} showAssignee={role.id !== 'coordinator'} sort={sort} onSortChange={setSort} onChange={setFilters} onReset={() => setFilters(emptyFilters)}>
          <div className="flex items-center gap-2">
            <div role="group" aria-label="Task view" className="inline-flex h-7 overflow-hidden rounded-md border border-slate-200 bg-white">
              <button type="button" aria-pressed={view === 'board'} onClick={() => setView('board')} className={cn('flex items-center gap-1 px-2 text-[11px] font-medium transition-colors', view === 'board' ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:text-slate-800')}><LayoutGrid size={12} />Board</button>
              <button type="button" aria-pressed={view === 'list'} onClick={() => setView('list')} className={cn('flex items-center gap-1 border-l border-slate-200 px-2 text-[11px] font-medium transition-colors', view === 'list' ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:text-slate-800')}><List size={12} />List</button>
            </div>
            <Link to="/schedule" className="inline-flex h-7 items-center gap-1 rounded-md border border-slate-200 bg-white px-2 text-[11px] font-medium text-slate-600 transition-colors hover:border-slate-300 hover:text-slate-900"><CalendarDays size={12} />Schedule</Link>
            {canCreate && <button type="button" onClick={openTaskForm} className="inline-flex h-7 items-center gap-1 rounded-md bg-slate-900 px-2.5 text-[11px] font-medium text-white transition-colors hover:bg-slate-800"><Plus size={12} />New task</button>}
          </div>
        </TaskFilters>
        <TaskQuickViews value={filters.quick} counts={quickCounts} onChange={(quick) => setFilters((current) => ({ ...current, quick }))}>
          {filtersActive && <span className="text-[10.5px] text-slate-500"><strong className="font-semibold text-slate-900">{filteredTasks.length}</strong> {filteredTasks.length === 1 ? 'task' : 'tasks'} shown</span>}
          {TASK_NOTES[role.id] && <span className="text-[10.5px] text-slate-400">{TASK_NOTES[role.id]}</span>}
          {reviewCount > 0 && (
            <Link to="/sites?status=needs_review" className="inline-flex items-center gap-1 text-[10.5px] font-medium text-slate-600 transition-colors hover:text-slate-900">
              <ScanSearch size={11} className="text-slate-400" />{reviewCount} {reviewCount === 1 ? 'observation' : 'observations'} to review<ArrowRight size={11} />
            </Link>
          )}
        </TaskQuickViews>
      </div>

      {filteredTasks.length ? (
        view === 'board'
          ? <TaskBoard tasks={filteredTasks} focusStatus={focusStatus} onClearFocus={() => setFilters((current) => ({ ...current, status: 'all' }))} onOpenTask={openTask} />
          : <TaskListView tasks={filteredTasks} onOpenTask={openTask} />
      ) : (
        <section className="rounded-lg border border-slate-200 bg-white px-6 py-12 text-center"><ClipboardCheck size={18} className="mx-auto text-slate-300" /><h2 className="mt-2 text-[12px] font-semibold text-slate-800">No matching tasks</h2><p className="mt-0.5 text-[11px] text-slate-500">Clear or adjust the current filters to see more work.</p><button type="button" onClick={() => setFilters(emptyFilters)} className="mt-3 inline-flex h-7 items-center rounded-md border border-slate-200 px-2.5 text-[11px] font-medium text-slate-700 transition-colors hover:border-slate-300 hover:text-slate-900">Reset filters</button></section>
      )}

      <TaskFormModal key={searchParams.toString()} open={createOpen} sites={sites} members={assignees} initialSiteId={initialSiteId} report={sourceReport} onClose={closePanel} onCreate={handleCreate} />
      {selectedTask && (
        <TaskDetailDrawer
          key={selectedTask.id}
          task={selectedTask}
          report={scope.communityReports.find((item) => item.id === selectedTask.reportId) ?? null}
          expenses={scope.expenses}
          role={role}
          members={assignees}
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
          onEmailReminder={() => emailTaskReminder(selectedTask).then((log) => showNotice(describeEmailResult([log], 'reminder')))}
        />
      )}
      {selectedTask && <ExpenseFormModal key={`expense-${selectedTask.id}`} open={expenseFormOpen} lockTask tasks={[selectedTask]} initialTaskId={selectedTask.id} onClose={() => setExpenseFormOpen(false)} onCreate={handleExpense} />}
      <Toast message={notice} />
    </div>
  )
}

import { useCallback, useMemo } from 'react'
import { isTaskClosed } from '../constants/status'
import { can as roleCan } from '../constants/access'
import { ROLES } from '../constants/roles'
import { initialCommunityReports } from '../data/communityReports'
import { dashboardSites, dashboardTasks } from '../data/dashboard'
import { initialExpenses, initialSiteBudgets, initialTeamMembers } from '../data/operations'
import { initialMeetings } from '../data/schedule'
import { clearPhotos } from '../services/photoStore'
import { addDays, todayInDhaka } from '../utils/reports'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { useSharedWorkspace } from '../hooks/useSharedWorkspace'
import {
  automateBudgetOverrun,
  automateTaskAssignment,
  automateTaskCompletion,
  createTaskMeeting,
  emailReportToRecipients,
  emailTaskReminder as sendTaskReminderEmail,
} from '../services/automation'
import { buildSiteBudgetRows, calculateBudgetSummary } from '../utils/budget'
import { formatBdt } from '../utils/currency'
import { deriveReports, deriveSites, deriveTasks } from '../utils/siteState'
import { createActivity, isFieldCoordinator } from '../utils/tasks'
import { AppContext } from './app-context'

const WORKSPACE_KEY = 'terralink.workspace.v3'
const initialWorkspace = {
  siteUpdates: {},
  decisions: {},
  tasks: dashboardTasks,
  teamMembers: initialTeamMembers,
  siteBudgets: initialSiteBudgets,
  expenses: initialExpenses,
  meetings: initialMeetings,
  communityReports: initialCommunityReports,
  comparisons: [],
  notificationLogs: [],
  // Water bodies added by the manager, on top of the five pilot sites.
  customSites: [],
}


function normalizeTask(task) {
  const original = dashboardTasks.find((item) => item.id === task.id) ?? {}
  return {
    description: 'Review the linked site record and record the required follow-up.',
    siteId: dashboardSites.find((site) => site.name === task.site)?.id,
    dueDate: addDays(todayInDhaka(), 7),
    priority: 'Medium',
    estimatedCost: 0,
    reportId: null,
    assignedBy: 'Nusrat Jahan',
    ...original,
    ...task,
    notifications: {
      email: Boolean(task.notifications?.email ?? original.notifications?.email),
      calendar: Boolean(task.notifications?.calendar ?? original.notifications?.calendar),
    },
    comments: task.comments ?? original.comments ?? [],
    activityHistory: task.activityHistory ?? original.activityHistory ?? [],
    submissions: task.submissions ?? original.submissions ?? [],
  }
}

/** Contact details changed since a workspace was saved; applied on load so old copies pick them up. */
const MEMBER_EMAIL_UPDATES = { 'member-rahim': { from: 'afrinera@iut-dhaka.edu', to: 'afrinjahanera04@gmail.com' } }

function updateMemberEmails(members) {
  return members.map((member) => (MEMBER_EMAIL_UPDATES[member.id]?.from === member.email ? { ...member, email: MEMBER_EMAIL_UPDATES[member.id].to } : member))
}

/** Fills a saved workspace (from this browser or the shared server copy) with defaults for anything missing. */
function parseWorkspace(parsed) {
  const savedTasks = Array.isArray(parsed.tasks) ? parsed.tasks.map(normalizeTask) : dashboardTasks
  const missingDemoTasks = dashboardTasks.filter((task) => !savedTasks.some((savedTask) => savedTask.id === task.id))
  return {
    siteUpdates: parsed.siteUpdates ?? {},
    decisions: parsed.decisions ?? {},
    tasks: [...savedTasks, ...missingDemoTasks],
    teamMembers: Array.isArray(parsed.teamMembers) ? updateMemberEmails(parsed.teamMembers) : initialTeamMembers,
    siteBudgets: { ...initialSiteBudgets, ...parsed.siteBudgets },
    expenses: Array.isArray(parsed.expenses) ? parsed.expenses : initialExpenses,
    meetings: Array.isArray(parsed.meetings) ? parsed.meetings : initialMeetings,
    communityReports: Array.isArray(parsed.communityReports) ? parsed.communityReports : initialCommunityReports,
    comparisons: Array.isArray(parsed.comparisons) ? parsed.comparisons : [],
    notificationLogs: Array.isArray(parsed.notificationLogs) ? parsed.notificationLogs : [],
    customSites: Array.isArray(parsed.customSites) ? parsed.customSites : [],
  }
}

/** Two users can add a record at the same moment; the one replayed second takes the next free number. */
function withFreeId(list, record) {
  if (!list.some((item) => item.id === record.id)) return record
  const [, prefix, digits] = String(record.id).match(/^(.*?)(\d+)$/) ?? [null, `${record.id}-`, '0']
  const highest = list.reduce((max, item) => String(item.id).startsWith(prefix) ? Math.max(max, Number(String(item.id).slice(prefix.length)) || 0) : max, 0)
  return { ...record, id: `${prefix}${String(highest + 1).padStart(digits.length, '0')}` }
}

function workspaceReducer(state, action) {
  switch (action.type) {
    case 'RECORD_DECISION':
      return {
        ...state,
        siteUpdates: {
          ...state.siteUpdates,
          [action.payload.siteId]: { status: action.payload.status },
        },
        decisions: {
          ...state.decisions,
          [action.payload.siteId]: action.payload,
        },
      }
    case 'ADD_SITE':
      return { ...state, customSites: [...state.customSites, action.payload] }
    case 'ADD_TASK_BUDGET':
      return {
        ...state,
        tasks: state.tasks.map((task) => task.id === action.payload.taskId ? {
          ...task,
          budgetTopUps: [...(task.budgetTopUps ?? []), action.payload.topUp],
          activityHistory: [action.payload.activity, ...task.activityHistory],
        } : task),
      }
    case 'ADD_TASK':
      return { ...state, tasks: [normalizeTask(withFreeId(state.tasks, action.payload)), ...state.tasks] }
    case 'UPDATE_TASK':
      return {
        ...state,
        tasks: state.tasks.map((task) => task.id === action.payload.taskId ? {
          ...task,
          ...action.payload.changes,
          activityHistory: action.payload.activity
            ? [action.payload.activity, ...task.activityHistory]
            : task.activityHistory,
        } : task),
      }
    case 'ADD_TASK_COMMENT':
      return {
        ...state,
        tasks: state.tasks.map((task) => task.id === action.payload.taskId ? {
          ...task,
          comments: [action.payload.comment, ...task.comments],
          activityHistory: [action.payload.activity, ...task.activityHistory],
        } : task),
      }
    case 'ADD_TEAM_MEMBER':
      return { ...state, teamMembers: [...state.teamMembers, action.payload] }
    case 'UPDATE_TEAM_MEMBER': {
      const currentMember = state.teamMembers.find((member) => member.id === action.payload.memberId)
      return {
        ...state,
        teamMembers: state.teamMembers.map((member) => member.id === action.payload.memberId ? { ...member, ...action.payload.changes } : member),
        tasks: state.tasks.map((task) => task.assignee === currentMember?.name ? {
          ...task,
          assignee: action.payload.changes.name ?? task.assignee,
          initials: action.payload.changes.initials ?? task.initials,
        } : task),
      }
    }
    case 'SET_SITE_BUDGET':
      return {
        ...state,
        siteBudgets: { ...state.siteBudgets, [action.payload.siteId]: action.payload.amount },
      }
    case 'ADD_EXPENSE':
      return {
        ...state,
        expenses: [withFreeId(state.expenses, action.payload.expense), ...state.expenses],
        tasks: state.tasks.map((task) => task.id === action.payload.expense.taskId && action.payload.activity ? {
          ...task,
          activityHistory: [action.payload.activity, ...task.activityHistory],
        } : task),
      }
    case 'REVIEW_EXPENSE':
      return {
        ...state,
        expenses: state.expenses.map((expense) => expense.id === action.payload.expenseId ? { ...expense, ...action.payload.changes } : expense),
        tasks: state.tasks.map((task) => task.id === action.payload.taskId && action.payload.activity ? {
          ...task,
          activityHistory: [action.payload.activity, ...task.activityHistory],
          budgetTopUps: action.payload.topUp ? [...(task.budgetTopUps ?? []), action.payload.topUp] : task.budgetTopUps,
        } : task),
      }
    case 'ADD_MEETING':
      return { ...state, meetings: [action.payload, ...state.meetings] }
    case 'UPDATE_MEETING':
      return {
        ...state,
        meetings: state.meetings.map((meeting) => meeting.id === action.payload.meetingId ? { ...meeting, ...action.payload.changes } : meeting),
      }
    case 'SAVE_COMPARISON':
      return { ...state, comparisons: [action.payload, ...state.comparisons] }
    case 'ADD_REPORT':
      return { ...state, communityReports: [withFreeId(state.communityReports, action.payload), ...state.communityReports] }
    case 'REVIEW_REPORT':
      return {
        ...state,
        communityReports: state.communityReports.map((report) => report.id === action.payload.reportId ? {
          ...report,
          status: action.payload.entry.status,
          history: [...report.history, action.payload.entry],
        } : report),
      }
    case 'ADD_NOTIFICATION_LOG':
      return { ...state, notificationLogs: [action.payload, ...state.notificationLogs].slice(0, 100) }
    case 'RESET_DEMO':
      return {
        ...initialWorkspace,
        tasks: [...dashboardTasks],
        teamMembers: [...initialTeamMembers],
        siteBudgets: { ...initialSiteBudgets },
        expenses: [...initialExpenses],
        meetings: [...initialMeetings],
        communityReports: [...initialCommunityReports],
        comparisons: [],
      }
    default:
      return state
  }
}

export function AppProvider({ children }) {
  const [roleId, setRoleId] = useLocalStorage('terralink.role', null)
  const [workspace, dispatch] = useSharedWorkspace({ key: WORKSPACE_KEY, reducer: workspaceReducer, parse: parseWorkspace, initial: initialWorkspace })
  const role = useMemo(() => {
    const baseRole = roleId ? ROLES[roleId] : null
    if (!baseRole) return null
    const profileIds = { manager: 'member-nusrat', coordinator: 'member-rahim' }
    const profile = workspace.teamMembers.find((member) => member.id === profileIds[roleId])
    return profile ? { ...baseRole, user: { name: profile.name, email: profile.email } } : baseRole
  }, [roleId, workspace.teamMembers])
  // Derived state lives in utils/siteState.js so the Discord bot computes exactly the same thing.
  const tasks = useMemo(() => deriveTasks(workspace), [workspace])
  const communityReports = useMemo(() => deriveReports(workspace, tasks), [tasks, workspace])
  const sites = useMemo(() => deriveSites(workspace, communityReports), [communityReports, workspace])
  const siteBudgetRows = useMemo(
    () => buildSiteBudgetRows(sites, tasks, workspace.siteBudgets, workspace.expenses),
    [sites, tasks, workspace.expenses, workspace.siteBudgets],
  )
  const memberId = useMemo(() => workspace.teamMembers.find((member) => member.name === role?.user.name)?.id, [role, workspace.teamMembers])
  // Everything a page shows should come from `scope`, so a role never receives data it is not meant to see.
  // The manager sees the whole programme; a coordinator sees only their own tasks and what hangs off them.
  const scope = useMemo(() => {
    if (!role?.staff) return null
    if (role.id !== 'coordinator') {
      return { tasks, sites, expenses: workspace.expenses, meetings: workspace.meetings, communityReports, siteIds: new Set(sites.map((site) => site.id)) }
    }
    const mine = tasks.filter((task) => task.assignee === role.user.name)
    const siteIds = new Set(mine.map((task) => task.siteId))
    const reportIds = new Set(mine.map((task) => task.reportId).filter(Boolean))
    return {
      tasks: mine,
      sites: sites.filter((site) => siteIds.has(site.id)),
      expenses: workspace.expenses.filter((expense) => mine.some((task) => task.id === expense.taskId)),
      meetings: workspace.meetings.filter((meeting) => meeting.attendeeIds.includes(memberId)),
      communityReports: communityReports.filter((report) => reportIds.has(report.id)),
      siteIds,
    }
  }, [communityReports, memberId, role, sites, tasks, workspace.expenses, workspace.meetings])

  const can = useCallback((permission) => roleCan(role?.id, permission), [role])
  const guard = useCallback((permission, message) => {
    if (!roleCan(role?.id, permission)) throw new Error(message)
  }, [role])

  const budgetSummary = useMemo(
    () => calculateBudgetSummary(siteBudgetRows, tasks),
    [siteBudgetRows, tasks],
  )

  const recordNotification = useCallback((notification) => {
    dispatch({ type: 'ADD_NOTIFICATION_LOG', payload: notification })
  }, [dispatch, ])

  const manager = useMemo(
    () => workspace.teamMembers.find((member) => member.id === 'member-nusrat') ?? workspace.teamMembers.find((member) => member.role === 'Project Manager'),
    [workspace.teamMembers],
  )

  const triggerTaskAssignment = useCallback((task) => {
    const assignee = workspace.teamMembers.find((member) => member.name === task.assignee)
    const site = sites.find((item) => item.id === task.siteId)
    const report = workspace.communityReports.find((item) => item.id === task.reportId)
    const [lat, lon] = report ? [report.latitude, report.longitude] : site?.coordinates ?? []
    const directionsUrl = lat ? `https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}` : ''
    return automateTaskAssignment({ task, assignee, site, record: recordNotification, directionsUrl })
  }, [recordNotification, sites, workspace.communityReports, workspace.teamMembers])

  const recordDecision = useCallback((decision) => {
    guard('sites.decide', 'Only the project manager can record a review decision.')
    dispatch({ type: 'RECORD_DECISION', payload: decision })
  }, [dispatch, guard])

  /** Adds a water body from a drawn outline. Returns the new site id. */
  const addSite = useCallback((site) => {
    guard('sites.add', 'Only the project manager can add a water body.')
    const base = site.body.name.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'site'
    let id = base
    for (let n = 2; sites.some((item) => item.id === id); n += 1) id = `${base}-${n}`
    const record = {
      ...site,
      body: { ...site.body, id },
      boundarySource: `Drawn in TerraLink by ${role.user.name}`,
      createdAt: new Date().toISOString(),
      createdBy: role.user.name,
    }
    dispatch({ type: 'ADD_SITE', payload: record })
    if (Number(site.plannedBudget) > 0) dispatch({ type: 'SET_SITE_BUDGET', payload: { siteId: id, amount: Number(site.plannedBudget) } })
    return id
  }, [dispatch, guard, role, sites])

  const submitReport = useCallback((report) => {
    if (role?.id !== 'user') throw new Error('Sign in as a user to submit a report.')
    const highest = workspace.communityReports.reduce((max, item) => Math.max(max, Number(item.id.replace('RPT-', '')) || 0), 0)
    const id = `RPT-${String(highest + 1).padStart(3, '0')}`
    const createdAt = new Date().toISOString()
    const created = {
      ...report,
      id,
      createdAt,
      status: 'pending',
      history: [{ id: `h-${id}-1`, status: 'pending', by: report.reporter.name, at: createdAt, note: 'Report submitted' }],
    }
    dispatch({ type: 'ADD_REPORT', payload: created })
    return created
  }, [dispatch, role, workspace.communityReports])

  const reviewReport = useCallback((reportId, status, note) => {
    guard('community.review', 'Only the project manager can verify or reject a report.')
    const entry = { id: `h-${reportId}-${Date.now()}`, status, by: role?.user.name ?? 'Reviewer', at: new Date().toISOString(), note }
    dispatch({ type: 'REVIEW_REPORT', payload: { reportId, entry } })
  }, [dispatch, guard, role])

  const saveComparison = useCallback((comparison) => {
    guard('measurement.save', 'Only the project manager can record a measurement.')
    const highest = workspace.comparisons.reduce((max, item) => Math.max(max, Number(item.id.replace('CMP-', '')) || 0), 0)
    const saved = { ...comparison, id: `CMP-${String(highest + 1).padStart(3, '0')}`, savedAt: new Date().toISOString(), savedBy: role.user.name }
    dispatch({ type: 'SAVE_COMPARISON', payload: saved })
    return saved
  }, [dispatch, guard, role, workspace.comparisons])

  /** Work is done in the field, so a task can only be given to a field coordinator. */
  const requireFieldCoordinator = useCallback((name) => {
    if (!isFieldCoordinator(workspace.teamMembers.find((member) => member.name === name))) throw new Error('Tasks can only be assigned to a field coordinator.')
  }, [workspace.teamMembers])

  const createTask = useCallback((task) => {
    guard('tasks.create', 'Only the project manager can create and assign tasks.')
    requireFieldCoordinator(task.assignee)
    const normalizedTask = normalizeTask({ ...task, assignedAt: task.assignedAt ?? task.createdAt ?? new Date().toISOString() })
    dispatch({ type: 'ADD_TASK', payload: normalizedTask })
    // Resolves with what the email and calendar follow-ups did, so the page can tell the person.
    return triggerTaskAssignment(normalizedTask)
  }, [dispatch, guard, requireFieldCoordinator, triggerTaskAssignment])

  const updateTask = useCallback((taskId, nextChanges, activity) => {
    const currentTask = tasks.find((task) => task.id === taskId)
    // A reassigned task counts as newly assigned, so it moves to the top of its column.
    const changes = nextChanges.assignee && nextChanges.assignee !== currentTask?.assignee ? { ...nextChanges, assignedAt: new Date().toISOString() } : nextChanges
    dispatch({ type: 'UPDATE_TASK', payload: { taskId, changes, activity } })
    if (!currentTask) return
    const nextTask = normalizeTask({ ...currentTask, ...changes })
    if (changes.assignee && changes.assignee !== currentTask.assignee) triggerTaskAssignment(nextTask)
    if (currentTask.status !== 'awaiting_verification' && nextTask.status === 'awaiting_verification' && manager) {
      void automateTaskCompletion({ task: nextTask, manager, record: recordNotification })
    }
  }, [dispatch, manager, recordNotification, tasks, triggerTaskAssignment])

  /** Assignment, deadline, estimate and notification choices. Only the project manager can change them. */
  const updateTaskPlan = useCallback((taskId, changes, activity) => {
    guard('tasks.assign', 'Only the project manager can assign tasks or change their plan.')
    const currentTask = tasks.find((task) => task.id === taskId)
    if (changes.assignee && changes.assignee !== currentTask?.assignee) requireFieldCoordinator(changes.assignee)
    updateTask(taskId, changes, activity)
  }, [guard, requireFieldCoordinator, tasks, updateTask])

  const addTaskComment = useCallback((taskId, comment, activity) => {
    guard('tasks.comment', 'You cannot comment on tasks.')
    const task = tasks.find((item) => item.id === taskId)
    if (role?.id === 'coordinator' && task?.assignee !== role.user.name) throw new Error('You can only comment on your own tasks.')
    dispatch({ type: 'ADD_TASK_COMMENT', payload: { taskId, comment, activity } })
  }, [dispatch, guard, role, tasks])

  const addTeamMember = useCallback((member) => {
    guard('team.manage', 'Only the project manager can change team records.')
    dispatch({ type: 'ADD_TEAM_MEMBER', payload: member })
  }, [dispatch, guard])

  const updateTeamMember = useCallback((memberId, changes) => {
    guard('team.manage', 'Only the project manager can change team records.')
    dispatch({ type: 'UPDATE_TEAM_MEMBER', payload: { memberId, changes } })
  }, [dispatch, guard])

  const setSiteBudget = useCallback((siteId, amount) => {
    guard('budget.edit', 'Only the project manager can edit budget allocations.')
    const row = siteBudgetRows.find((item) => item.id === siteId)
    const previousPlanned = Number(workspace.siteBudgets[siteId] || 0)
    dispatch({ type: 'SET_SITE_BUDGET', payload: { siteId, amount } })
    if (row && manager && row.actual <= previousPlanned && row.actual > Number(amount)) {
      const site = sites.find((item) => item.id === siteId)
      void automateBudgetOverrun({ site, planned: Number(amount), actual: row.actual, manager, record: recordNotification })
    }
  }, [dispatch, guard, manager, recordNotification, siteBudgetRows, sites, workspace.siteBudgets])

  /** Warns the manager the first time approved spending passes a site's planned allocation. */
  const warnIfOverBudget = useCallback((siteId, addedApproved) => {
    const row = siteBudgetRows.find((item) => item.id === siteId)
    if (!row || !manager || !addedApproved) return
    const nextActual = row.actual + addedApproved
    if (row.actual <= row.planned && nextActual > row.planned) {
      const site = sites.find((item) => item.id === siteId)
      void automateBudgetOverrun({ site, planned: row.planned, actual: nextActual, manager, record: recordNotification })
    }
  }, [manager, recordNotification, siteBudgetRows, sites])

  const addExpense = useCallback((expense, activity) => {
    const task = tasks.find((item) => item.id === expense.taskId)
    const isManager = role?.id === 'manager'
    const ownTask = role?.id === 'coordinator' && task?.assignee === role.user.name
    if (!isManager && !ownTask) throw new Error('You cannot record expenses for this task.')
    if (task && isTaskClosed(task)) throw new Error('This task is closed, so no more expenses can be added.')
    // Within the money given for the task an expense is accepted at once. Above it, the field coordinator asks for
    // extra budget and the expense waits for the manager. The manager's own entries are always accepted.
    const amount = Number(expense.amount || 0)
    const available = task ? task.budget - task.actualCost : Infinity
    const withinBudget = amount <= available
    const { topUp, ...rest } = expense
    if (!isManager && !withinBudget) {
      const needed = amount - Math.max(available, 0)
      if (!topUp || Number(topUp.amount) < needed) throw new Error(`This expense is ${formatBdt(needed)} over the remaining budget. Request at least ${formatBdt(needed)} extra.`)
      if (!topUp.reason?.trim()) throw new Error('Say why the extra budget is needed.')
    }
    const approved = isManager || withinBudget
    const now = new Date().toISOString()
    const entry = {
      ...rest,
      approvalStatus: approved ? 'approved' : 'pending',
      autoApproved: !isManager && approved,
      reviewedBy: isManager ? role.user.name : '',
      reviewedAt: approved ? now : '',
      reviewNote: !isManager && approved ? 'Within the task budget, accepted automatically.' : '',
      ...(approved ? {} : { topUp: { amount: Number(topUp.amount), reason: topUp.reason.trim() } }),
    }
    dispatch({ type: 'ADD_EXPENSE', payload: { expense: entry, activity } })
    if (approved) warnIfOverBudget(entry.siteId, Number(entry.amount || 0))
    return entry
  }, [dispatch, role, tasks, warnIfOverBudget])

  /** The project manager gives a task more money directly; it needs no approval and no receipt. */
  const addTaskBudget = useCallback((taskId, amount, reason = '') => {
    guard('tasks.assign', 'Only the project manager can add budget to a task.')
    const value = Number(amount)
    if (!(value > 0)) throw new Error('Enter an amount above zero.')
    const at = new Date().toISOString()
    dispatch({
      type: 'ADD_TASK_BUDGET',
      payload: {
        taskId,
        topUp: { amount: value, reason: reason.trim() || 'Budget added by the project manager', approvedBy: role.user.name, at, expenseId: '' },
        activity: createActivity(`Budget increased by ${formatBdt(value)}${reason.trim() ? `: ${reason.trim()}` : ''}`, role.user.name),
      },
    })
  }, [dispatch, guard, role])

  const reviewExpense = useCallback((expenseId, decision, note = '') => {
    if (role?.id !== 'manager') throw new Error('Only the project manager can approve or reject expenses.')
    const expense = workspace.expenses.find((item) => item.id === expenseId)
    if (!expense) return
    const approved = decision === 'approved'
    const at = new Date().toISOString()
    // Approving an expense that came with an extra-budget request also raises the task's budget by that amount.
    const topUp = approved && expense.topUp ? { amount: expense.topUp.amount, reason: expense.topUp.reason, expenseId, approvedBy: role.user.name, at } : null
    dispatch({
      type: 'REVIEW_EXPENSE',
      payload: {
        expenseId,
        taskId: expense.taskId,
        topUp,
        changes: { approvalStatus: decision, reviewedBy: role.user.name, reviewedAt: at, reviewNote: note },
        activity: createActivity(topUp
          ? `Extra budget of ${formatBdt(topUp.amount)} approved with expense ${expenseId}${note ? `: ${note}` : ''}`
          : `Expense ${expenseId} ${approved ? 'approved' : 'rejected'}${expense.topUp && !approved ? ` with its extra-budget request` : ''}${note ? `: ${note}` : ''}`, role.user.name),
      },
    })
    if (approved && expense.approvalStatus !== 'approved') warnIfOverBudget(expense.siteId, Number(expense.amount || 0))
  }, [dispatch, role, warnIfOverBudget, workspace.expenses])

  /** Moves a task between workflow stages. Reasons are required to block or cancel. */
  const setTaskStatus = useCallback((taskId, status, reason = '') => {
    const task = tasks.find((item) => item.id === taskId)
    if (!task) return
    // The assignee does the work (start, block, resume); the manager only reopens or cancels. Nobody approves their own work.
    const ownTask = role?.id === 'coordinator' && task.assignee === role.user.name
    const fieldMove = ['in_progress', 'blocked'].includes(status)
    if (fieldMove ? !ownTask : !(roleCan(role?.id, 'tasks.cancel') && ['open', 'cancelled'].includes(status))) throw new Error('You cannot change the status of this task.')
    if (fieldMove && !['open', 'in_progress', 'blocked'].includes(task.status)) throw new Error('This task is no longer being worked on.')
    if ((status === 'blocked' || status === 'cancelled') && reason.trim().length < 5) throw new Error('Give a short reason.')
    const labels = { in_progress: task.status === 'blocked' ? 'Work resumed' : 'Work started', blocked: 'Marked blocked', cancelled: 'Task cancelled', open: 'Task reopened' }
    updateTask(taskId, { status, blockedReason: status === 'blocked' ? reason.trim() : '', cancelReason: status === 'cancelled' ? reason.trim() : '' }, createActivity(`${labels[status] ?? 'Status changed'}${reason ? `: ${reason.trim()}` : ''}`, role.user.name))
  }, [role, tasks, updateTask])

  /** Only the assigned field coordinator hands in photos and a summary. It does not close the task. */
  const submitCompletion = useCallback((taskId, submission) => {
    const task = tasks.find((item) => item.id === taskId)
    if (!task) return
    const ownTask = role?.id === 'coordinator' && task.assignee === role.user.name
    if (!ownTask) throw new Error('Only the person assigned to this task can submit its completion evidence.')
    if (task.status !== 'in_progress') throw new Error('Start the task before submitting completion evidence.')
    const entry = { id: `sub-${taskId}-${Date.now()}`, ...submission, submittedBy: role.user.name, submittedAt: new Date().toISOString() }
    updateTask(taskId, { status: 'awaiting_verification', blockedReason: '', submissions: [...(task.submissions ?? []), entry] }, createActivity(`Completion evidence submitted (${submission.photos.length} photo${submission.photos.length === 1 ? '' : 's'})`, role.user.name))
  }, [role, tasks, updateTask])

  /** Only the project manager can close a task, and the outcome is recorded with a reason. */
  const reviewCompletion = useCallback((taskId, { decision, outcome, note, aiCheck }) => {
    if (role?.id !== 'manager') throw new Error('Only the project manager can review completion.')
    const task = tasks.find((item) => item.id === taskId)
    if (!task) return
    if (task.status !== 'awaiting_verification') throw new Error('This task has no completion evidence waiting for review.')
    if (task.submissions?.at(-1)?.submittedBy === role.user.name) throw new Error('You cannot review work you submitted yourself.')
    if (decision === 'approved') {
      const resolution = { outcome, note: note.trim(), by: role.user.name, at: new Date().toISOString(), ...(aiCheck ? { aiCheck } : {}) }
      updateTask(taskId, { status: 'completed', resolution, completedAt: resolution.at }, createActivity(`Completion approved, outcome: ${outcome.replaceAll('_', ' ')}${note.trim() ? `. ${note.trim()}` : ''}`, role.user.name))
    } else {
      updateTask(taskId, { status: 'in_progress', lastReturn: { note: note.trim(), by: role.user.name, at: new Date().toISOString() } }, createActivity(`Returned for more work: ${note.trim()}`, role.user.name))
    }
  }, [role, tasks, updateTask])

  const emailTaskReminder = useCallback((task) => {
    guard('tasks.remind', 'Only the project manager can send reminders.')
    return sendTaskReminderEmail({
      task,
      assignee: workspace.teamMembers.find((member) => member.name === task.assignee),
      site: sites.find((item) => item.id === task.siteId),
      record: recordNotification,
    })
  }, [guard, recordNotification, sites, workspace.teamMembers])

  /**
   * Online meeting with any email addresses, optionally about a task or a site: saved in the manager's Google Calendar
   * with a Google Meet link, Google's own invitation to each guest, and a branded email with the link.
   * Call it straight from a click so Google can show its sign-in the first time.
   */
  const scheduleMeeting = useCallback(async ({ task = null, siteId = '', title, date, startTime, durationMinutes, agenda, guests }) => {
    guard('schedule.manage', 'Only the project manager can schedule meetings.')
    const highest = workspace.meetings.reduce((max, item) => Math.max(max, Number(String(item.id).replace('MTG-', '')) || 0), 0)
    const meeting = { id: `MTG-${String(highest + 1).padStart(3, '0')}`, title, date, startTime, durationMinutes, agenda }
    const site = sites.find((item) => item.id === (task?.siteId ?? siteId))
    const result = await createTaskMeeting({ meeting, task, site, guests, organizerName: role.user.name, record: recordNotification })
    const memberIds = workspace.teamMembers.filter((member) => guests.some((guest) => guest.email.toLowerCase() === member.email?.toLowerCase())).map((member) => member.id)
    const organizerId = workspace.teamMembers.find((member) => member.name === role.user.name)?.id
    dispatch({
      type: 'ADD_MEETING',
      payload: {
        ...meeting,
        type: 'team_sync',
        location: 'Google Meet',
        siteId: site?.id ?? '',
        taskId: task?.id ?? '',
        attendeeIds: [...new Set([organizerId, ...memberIds].filter(Boolean))],
        guests: guests.map((guest) => guest.email),
        organizer: role.user.name,
        status: 'scheduled',
        calendarStatus: 'synced',
        calendarUrl: result.calendarUrl,
        meetUrl: result.meetUrl,
        createdAt: new Date().toISOString(),
      },
    })
    return result
  }, [dispatch, guard, recordNotification, role, sites, workspace.meetings, workspace.teamMembers])

  const shareReport = useCallback(({ recipients, title, subject, summary, note, html, attachment }) => {
    guard('reports.share', 'Only the project manager can send reports.')
    if (!recipients.length) return Promise.reject(new Error('Choose someone to send the report to.'))
    return emailReportToRecipients({ recipients, reportTitle: title, subject, summary, note, html, attachment, record: recordNotification })
  }, [guard, recordNotification])

  const resetDemo = useCallback(() => {
    guard('workspace.reset', 'Only the project manager can reset the workspace.')
    dispatch({ type: 'RESET_DEMO' })
    void clearPhotos()
  }, [dispatch, guard])
  const signOut = useCallback(() => setRoleId(null), [setRoleId])

  const value = useMemo(
    () => ({
      role,
      selectRole: setRoleId,
      signOut,
      sites,
      tasks,
      scope,
      can,
      decisions: workspace.decisions,
      teamMembers: workspace.teamMembers,
      siteBudgets: workspace.siteBudgets,
      expenses: workspace.expenses,
      meetings: workspace.meetings,
      communityReports,
      submitReport,
      reviewReport,
      comparisons: workspace.comparisons,
      saveComparison,
      notificationLogs: workspace.notificationLogs,
      addNotificationLog: recordNotification,
      budgetSummary,
      recordDecision,
      addSite,
      addTaskBudget,
      scheduleMeeting,
      createTask,
      updateTaskPlan,
      addTaskComment,
      addTeamMember,
      updateTeamMember,
      setSiteBudget,
      addExpense,
      reviewExpense,
      setTaskStatus,
      submitCompletion,
      reviewCompletion,
      emailTaskReminder,
      shareReport,
      resetDemo,
    }),
    [can, scope, addSite, addTaskBudget, scheduleMeeting, updateTaskPlan, addExpense, reviewExpense, setTaskStatus, submitCompletion, reviewCompletion, addTaskComment, addTeamMember, budgetSummary, createTask, emailTaskReminder, recordDecision, recordNotification, resetDemo, role, submitReport, reviewReport, saveComparison, setRoleId, setSiteBudget, shareReport, signOut, sites, updateTeamMember, communityReports, tasks, workspace.comparisons, workspace.decisions, workspace.expenses, workspace.meetings, workspace.notificationLogs, workspace.siteBudgets, workspace.teamMembers],
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

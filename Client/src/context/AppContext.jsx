import { useCallback, useMemo } from 'react'
import { isTaskClosed } from '../constants/status'
import { can as roleCan } from '../constants/access'
import { OPEN_REPORT_STATUSES } from '../constants/reports'
import { ROLES } from '../constants/roles'
import { initialCommunityReports } from '../data/communityReports'
import { dashboardSites, dashboardTasks } from '../data/dashboard'
import { initialExpenses, initialSiteBudgets, initialTeamMembers } from '../data/operations'
import { initialMeetings, MEETING_TYPES } from '../data/schedule'
import { clearPhotos } from '../services/photoStore'
import { describeComparison } from '../utils/observations'
import { addDays, todayInDhaka } from '../utils/reports'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { useSharedWorkspace } from '../hooks/useSharedWorkspace'
import {
  addEventToCalendar,
  automateBudgetOverrun,
  automateTaskAssignment,
  automateTaskCompletion,
  emailMeetingInvites as sendMeetingInvites,
  emailReportToRecipients,
  emailTaskReminder as sendTaskReminderEmail,
  recordCalendarDownload,
} from '../services/automation'
import { downloadEventIcs, meetingToCalendarEvent, taskToCalendarEvent } from '../services/calendar'
import { buildSiteBudgetRows, calculateBudgetSummary } from '../utils/budget'
import { formatLongDate, formatTimeRange } from '../utils/schedule'
import { createActivity, dueLabel, isFieldCoordinator } from '../utils/tasks'
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

/** Fills a saved workspace (from this browser or the shared server copy) with defaults for anything missing. */
function parseWorkspace(parsed) {
  const savedTasks = Array.isArray(parsed.tasks) ? parsed.tasks.map(normalizeTask) : dashboardTasks
  const missingDemoTasks = dashboardTasks.filter((task) => !savedTasks.some((savedTask) => savedTask.id === task.id))
  return {
    siteUpdates: parsed.siteUpdates ?? {},
    decisions: parsed.decisions ?? {},
    tasks: [...savedTasks, ...missingDemoTasks],
    teamMembers: Array.isArray(parsed.teamMembers) ? parsed.teamMembers : initialTeamMembers,
    siteBudgets: { ...initialSiteBudgets, ...parsed.siteBudgets },
    expenses: Array.isArray(parsed.expenses) ? parsed.expenses : initialExpenses,
    meetings: Array.isArray(parsed.meetings) ? parsed.meetings : initialMeetings,
    communityReports: Array.isArray(parsed.communityReports) ? parsed.communityReports : initialCommunityReports,
    comparisons: Array.isArray(parsed.comparisons) ? parsed.comparisons : [],
    notificationLogs: Array.isArray(parsed.notificationLogs) ? parsed.notificationLogs : [],
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
  // A task's actual cost is the sum of its approved expenses; pending ones are tracked separately until a manager approves them.
  const tasks = useMemo(() => workspace.tasks.map((task) => {
    const own = workspace.expenses.filter((expense) => expense.taskId === task.id)
    const sum = (status) => own.filter((expense) => expense.approvalStatus === status).reduce((total, expense) => total + Number(expense.amount || 0), 0)
    return { ...task, due: dueLabel(task.dueDate), actualCost: sum('approved'), pendingCost: sum('pending') }
  }), [workspace.expenses, workspace.tasks])
  // A report counts as resolved once a task opened from it is completed with the outcome Resolved.
  const communityReports = useMemo(() => workspace.communityReports.map((report) => {
    const linked = tasks.filter((task) => task.reportId === report.id)
    return {
      ...report,
      tasks: linked.map((task) => ({ id: task.id, title: task.title, status: task.status, resolution: task.resolution ?? null })),
      resolved: linked.some((task) => task.status === 'completed' && task.resolution?.outcome === 'resolved'),
    }
  }), [tasks, workspace.communityReports])
  const sites = useMemo(
    () => dashboardSites.map((site) => {
      const openReports = communityReports.filter((report) => report.siteId === site.id && !report.resolved && OPEN_REPORT_STATUSES.includes(report.status)).length
      const measured = workspace.comparisons.find((item) => item.siteId === site.id) ?? null
      const merged = { ...site, ...workspace.siteUpdates[site.id], openReports, measured }
      // A manager decision always wins. Then a measurement replaces the sample classification, and open community reports flag the site.
      if (!workspace.decisions[site.id] && measured) {
        if (measured.result.verdict === 'decrease') merged.status = 'needs_review'
        else if (measured.result.reliable && measured.result.verdict !== 'not_reliable') merged.status = 'no_change'
        merged.reviewNote = describeComparison(measured)
      }
      return !workspace.decisions[site.id] && openReports ? { ...merged, status: 'reported_issue' } : merged
    }),
    [communityReports, workspace.comparisons, workspace.decisions, workspace.siteUpdates],
  )
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
    return automateTaskAssignment({ task, assignee, site, record: recordNotification })
  }, [recordNotification, sites, workspace.teamMembers])

  const recordDecision = useCallback((decision) => {
    guard('sites.decide', 'Only the project manager can record a review decision.')
    dispatch({ type: 'RECORD_DECISION', payload: decision })
  }, [dispatch, guard])

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
    // The project manager's own entries are approved on entry; everyone else's wait for review.
    const approved = isManager
    const entry = {
      ...expense,
      approvalStatus: approved ? 'approved' : 'pending',
      reviewedBy: approved ? role.user.name : '',
      reviewedAt: approved ? new Date().toISOString() : '',
    }
    dispatch({ type: 'ADD_EXPENSE', payload: { expense: entry, activity } })
    if (approved) warnIfOverBudget(entry.siteId, Number(entry.amount || 0))
    return entry
  }, [dispatch, role, tasks, warnIfOverBudget])

  const reviewExpense = useCallback((expenseId, decision, note = '') => {
    if (role?.id !== 'manager') throw new Error('Only the project manager can approve or reject expenses.')
    const expense = workspace.expenses.find((item) => item.id === expenseId)
    if (!expense) return
    const approved = decision === 'approved'
    dispatch({
      type: 'REVIEW_EXPENSE',
      payload: {
        expenseId,
        taskId: expense.taskId,
        changes: { approvalStatus: decision, reviewedBy: role.user.name, reviewedAt: new Date().toISOString(), reviewNote: note },
        activity: createActivity(`Expense ${expenseId} ${approved ? 'approved' : 'rejected'}${note ? `: ${note}` : ''}`, role.user.name),
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
  const reviewCompletion = useCallback((taskId, { decision, outcome, note }) => {
    if (role?.id !== 'manager') throw new Error('Only the project manager can review completion.')
    const task = tasks.find((item) => item.id === taskId)
    if (!task) return
    if (task.status !== 'awaiting_verification') throw new Error('This task has no completion evidence waiting for review.')
    if (task.submissions?.at(-1)?.submittedBy === role.user.name) throw new Error('You cannot review work you submitted yourself.')
    if (decision === 'approved') {
      const resolution = { outcome, note: note.trim(), by: role.user.name, at: new Date().toISOString() }
      updateTask(taskId, { status: 'completed', resolution, completedAt: resolution.at }, createActivity(`Completion approved, outcome: ${outcome.replaceAll('_', ' ')}${note.trim() ? `. ${note.trim()}` : ''}`, role.user.name))
    } else {
      updateTask(taskId, { status: 'in_progress', lastReturn: { note: note.trim(), by: role.user.name, at: new Date().toISOString() } }, createActivity(`Returned for more work: ${note.trim()}`, role.user.name))
    }
  }, [role, tasks, updateTask])

  const createMeeting = useCallback((meeting) => {
    guard('schedule.manage', 'Only the project manager can schedule meetings.')
    dispatch({ type: 'ADD_MEETING', payload: meeting })
  }, [dispatch, guard])

  const updateMeeting = useCallback((meetingId, changes) => {
    guard('schedule.manage', 'Only the project manager can change meetings.')
    dispatch({ type: 'UPDATE_MEETING', payload: { meetingId, changes } })
  }, [dispatch, guard])

  const meetingAttendees = useCallback(
    (meeting) => workspace.teamMembers.filter((member) => meeting.attendeeIds?.includes(member.id)),
    [workspace.teamMembers],
  )

  const buildMeetingEvent = useCallback((meeting) => {
    const type = MEETING_TYPES[meeting.type]
    return meetingToCalendarEvent(meeting, {
      attendees: meetingAttendees(meeting),
      site: sites.find((site) => site.id === meeting.siteId),
      typeLabel: type?.label,
      reminderMinutes: type?.reminderMinutes,
    })
  }, [meetingAttendees, sites])

  /** Must be called directly from a click handler so the calendar tab is not blocked. */
  const addMeetingToCalendar = useCallback((meeting) => {
    const fields = { message: `Calendar event: ${meeting.title}`, meetingId: meeting.id, taskId: meeting.taskId ?? '', source: 'Schedule' }
    return addEventToCalendar({ event: buildMeetingEvent(meeting), fields, record: recordNotification }).then((result) => {
      if (result.mode !== 'failed') {
        dispatch({ type: 'UPDATE_MEETING', payload: { meetingId: meeting.id, changes: { calendarStatus: result.mode === 'api' ? 'synced' : 'link', calendarUrl: result.url } } })
      }
      return result
    })
  }, [dispatch, buildMeetingEvent, recordNotification])

  const downloadMeetingIcs = useCallback((meeting) => {
    const event = buildMeetingEvent(meeting)
    downloadEventIcs(event)
    recordCalendarDownload({ event, fields: { message: `Calendar file: ${meeting.title}`, meetingId: meeting.id, taskId: meeting.taskId ?? '', source: 'Schedule' }, record: recordNotification })
    if (!meeting.calendarStatus || meeting.calendarStatus === 'none') {
      dispatch({ type: 'UPDATE_MEETING', payload: { meetingId: meeting.id, changes: { calendarStatus: 'ics' } } })
    }
  }, [dispatch, buildMeetingEvent, recordNotification])

  const emailMeetingInvites = useCallback((meeting) => {
    const site = sites.find((item) => item.id === meeting.siteId)
    const summary = [
      `${MEETING_TYPES[meeting.type]?.label ?? 'Meeting'}: ${meeting.title}`,
      `When: ${formatLongDate(meeting.date)}, ${formatTimeRange(meeting)} (Asia/Dhaka)`,
      `Where: ${meeting.location}`,
      site && `Site: ${site.name}, ${site.location}`,
      meeting.taskId && `Linked task: ${meeting.taskId}`,
      meeting.agenda && `Agenda: ${meeting.agenda}`,
      `Organiser: ${meeting.organizer}`,
    ].filter(Boolean).join('\n')
    return sendMeetingInvites({ meeting, attendees: meetingAttendees(meeting), summary, record: recordNotification })
  }, [meetingAttendees, recordNotification, sites])

  /** Must be called directly from a click handler so the calendar tab is not blocked. */
  const addTaskToCalendar = useCallback((task) => addEventToCalendar({
    event: taskToCalendarEvent(task),
    fields: { message: `Deadline event: ${task.id} · ${task.dueDate}`, taskId: task.id, source: 'Tasks' },
    record: recordNotification,
  }), [recordNotification])

  const downloadTaskIcs = useCallback((task) => {
    const event = taskToCalendarEvent(task)
    downloadEventIcs(event)
    return recordCalendarDownload({ event, fields: { message: `Deadline file: ${task.id}`, taskId: task.id, source: 'Tasks' }, record: recordNotification })
  }, [recordNotification])

  const emailTaskReminder = useCallback((task) => {
    guard('tasks.remind', 'Only the project manager can send reminders.')
    return sendTaskReminderEmail({
      task,
      assignee: workspace.teamMembers.find((member) => member.name === task.assignee),
      record: recordNotification,
    })
  }, [guard, recordNotification, workspace.teamMembers])

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
      createMeeting,
      updateMeeting,
      addMeetingToCalendar,
      downloadMeetingIcs,
      emailMeetingInvites,
      addTaskToCalendar,
      downloadTaskIcs,
      emailTaskReminder,
      shareReport,
      resetDemo,
    }),
    [can, scope, updateTaskPlan, addExpense, reviewExpense, setTaskStatus, submitCompletion, reviewCompletion, addMeetingToCalendar, addTaskComment, addTaskToCalendar, addTeamMember, budgetSummary, createMeeting, createTask, downloadMeetingIcs, downloadTaskIcs, emailMeetingInvites, emailTaskReminder, recordDecision, recordNotification, resetDemo, role, submitReport, reviewReport, saveComparison, setRoleId, setSiteBudget, shareReport, signOut, sites, updateMeeting, updateTeamMember, communityReports, tasks, workspace.comparisons, workspace.decisions, workspace.expenses, workspace.meetings, workspace.notificationLogs, workspace.siteBudgets, workspace.teamMembers],
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

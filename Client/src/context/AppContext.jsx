import { useCallback, useEffect, useMemo, useReducer } from 'react'
import { ROLES } from '../constants/roles'
import { dashboardSites, dashboardTasks } from '../data/dashboard'
import { defaultIntegrationSettings } from '../data/integrations'
import { initialExpenses, initialSiteBudgets, initialTeamMembers } from '../data/operations'
import { initialMeetings, MEETING_TYPES } from '../data/schedule'
import { useLocalStorage } from '../hooks/useLocalStorage'
import {
  addEventToCalendar,
  automateBudgetOverrun,
  automateOverdueTask,
  automateTaskAssignment,
  automateTaskCompletion,
  emailMeetingInvites as sendMeetingInvites,
  emailReportToRecipients,
  emailTaskReminder as sendTaskReminderEmail,
  recordCalendarDownload,
  runIntegrationTest,
  whatsappMeetingReminder as openMeetingWhatsApp,
  whatsappTaskReminder as openTaskWhatsApp,
} from '../services/automation'
import { downloadEventIcs, meetingToCalendarEvent, taskToCalendarEvent } from '../services/calendar'
import { buildSiteBudgetRows, calculateBudgetSummary } from '../utils/budget'
import { formatLongDate, formatTimeRange } from '../utils/schedule'
import { isTaskOverdue } from '../utils/tasks'
import { AppContext } from './app-context'

const WORKSPACE_KEY = 'terralink.workspace.v1'
const initialAutomationKeys = dashboardTasks.filter(isTaskOverdue).map((task) => `overdue:${task.id}`)
const initialWorkspace = {
  siteUpdates: {},
  decisions: {},
  tasks: dashboardTasks,
  teamMembers: initialTeamMembers,
  siteBudgets: initialSiteBudgets,
  expenses: initialExpenses,
  meetings: initialMeetings,
  integrationSettings: defaultIntegrationSettings,
  notificationLogs: [],
  automationKeys: initialAutomationKeys,
}

function normalizeTask(task) {
  const original = dashboardTasks.find((item) => item.id === task.id) ?? {}
  return {
    description: 'Review the linked site record and record the required follow-up.',
    siteId: dashboardSites.find((site) => site.name === task.site)?.id,
    dueDate: '2026-10-14',
    priority: 'Medium',
    estimatedCost: 0,
    actualCost: 0,
    assignedBy: 'Nusrat Jahan',
    ...original,
    ...task,
    notifications: { email: false, calendar: false, whatsapp: false, ...original.notifications, ...task.notifications },
    comments: task.comments ?? original.comments ?? [],
    activityHistory: task.activityHistory ?? original.activityHistory ?? [],
  }
}

function readWorkspace() {
  try {
    const saved = window.localStorage.getItem(WORKSPACE_KEY)
    if (!saved) return initialWorkspace
    const parsed = JSON.parse(saved)
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
      integrationSettings: {
        ...defaultIntegrationSettings,
        ...parsed.integrationSettings,
        rules: { ...defaultIntegrationSettings.rules, ...parsed.integrationSettings?.rules },
      },
      notificationLogs: Array.isArray(parsed.notificationLogs) ? parsed.notificationLogs : [],
      automationKeys: Array.isArray(parsed.automationKeys)
        ? parsed.automationKeys
        : savedTasks.filter(isTaskOverdue).map((task) => `overdue:${task.id}`),
    }
  } catch {
    return initialWorkspace
  }
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
      return { ...state, tasks: [normalizeTask(action.payload), ...state.tasks] }
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
        expenses: [action.payload.expense, ...state.expenses],
        tasks: state.tasks.map((task) => task.id === action.payload.expense.taskId ? {
          ...task,
          actualCost: Number(task.actualCost || 0) + Number(action.payload.expense.amount),
          activityHistory: action.payload.activity ? [action.payload.activity, ...task.activityHistory] : task.activityHistory,
        } : task),
      }
    case 'ADD_MEETING':
      return { ...state, meetings: [action.payload, ...state.meetings] }
    case 'UPDATE_MEETING':
      return {
        ...state,
        meetings: state.meetings.map((meeting) => meeting.id === action.payload.meetingId ? { ...meeting, ...action.payload.changes } : meeting),
      }
    case 'SET_INTEGRATION_RULE':
      return {
        ...state,
        integrationSettings: {
          ...state.integrationSettings,
          rules: { ...state.integrationSettings.rules, [action.payload.ruleId]: action.payload.enabled },
        },
      }
    case 'SET_NOTIFICATION_LANGUAGE':
      return {
        ...state,
        integrationSettings: { ...state.integrationSettings, language: action.payload },
      }
    case 'ADD_NOTIFICATION_LOG':
      return { ...state, notificationLogs: [action.payload, ...state.notificationLogs].slice(0, 100) }
    case 'UPDATE_NOTIFICATION_STATUS':
      return {
        ...state,
        notificationLogs: state.notificationLogs.map((log) => log.id === action.payload.logId ? { ...log, status: action.payload.status } : log),
      }
    case 'CLEAR_NOTIFICATION_LOGS':
      return { ...state, notificationLogs: [] }
    case 'MARK_AUTOMATION':
      return state.automationKeys.includes(action.payload)
        ? state
        : { ...state, automationKeys: [...state.automationKeys, action.payload] }
    case 'RESET_DEMO':
      return {
        ...initialWorkspace,
        tasks: [...dashboardTasks],
        teamMembers: [...initialTeamMembers],
        siteBudgets: { ...initialSiteBudgets },
        expenses: [...initialExpenses],
        meetings: [...initialMeetings],
      }
    default:
      return state
  }
}

export function AppProvider({ children }) {
  const [roleId, setRoleId] = useLocalStorage('terralink.role', null)
  const [workspace, dispatch] = useReducer(workspaceReducer, undefined, readWorkspace)
  const role = useMemo(() => {
    const baseRole = roleId ? ROLES[roleId] : null
    if (!baseRole) return null
    const profileIds = { manager: 'member-nusrat', coordinator: 'member-rahim', operator: 'member-sadia' }
    const profile = workspace.teamMembers.find((member) => member.id === profileIds[roleId])
    return profile ? { ...baseRole, user: { name: profile.name, email: profile.email } } : baseRole
  }, [roleId, workspace.teamMembers])
  const sites = useMemo(
    () => dashboardSites.map((site) => ({ ...site, ...workspace.siteUpdates[site.id] })),
    [workspace.siteUpdates],
  )
  const siteBudgetRows = useMemo(
    () => buildSiteBudgetRows(sites, workspace.tasks, workspace.siteBudgets, workspace.expenses),
    [sites, workspace.expenses, workspace.siteBudgets, workspace.tasks],
  )
  const budgetSummary = useMemo(
    () => calculateBudgetSummary(siteBudgetRows, workspace.tasks),
    [siteBudgetRows, workspace.tasks],
  )

  useEffect(() => {
    try {
      window.localStorage.setItem(WORKSPACE_KEY, JSON.stringify(workspace))
    } catch {
      // Persistence is optional when browser storage is unavailable.
    }
  }, [workspace])

  const recordNotification = useCallback((notification) => {
    dispatch({ type: 'ADD_NOTIFICATION_LOG', payload: notification })
  }, [])

  const manager = useMemo(
    () => workspace.teamMembers.find((member) => member.id === 'member-nusrat') ?? workspace.teamMembers.find((member) => member.role === 'Project Manager'),
    [workspace.teamMembers],
  )

  const triggerTaskAssignment = useCallback((task) => {
    const assignee = workspace.teamMembers.find((member) => member.name === task.assignee)
    const site = sites.find((item) => item.id === task.siteId)
    void automateTaskAssignment({ task, assignee, site, settings: workspace.integrationSettings, record: recordNotification })
  }, [recordNotification, sites, workspace.integrationSettings, workspace.teamMembers])

  const recordDecision = useCallback((decision) => {
    dispatch({ type: 'RECORD_DECISION', payload: decision })
  }, [])

  const createTask = useCallback((task) => {
    const normalizedTask = normalizeTask(task)
    dispatch({ type: 'ADD_TASK', payload: normalizedTask })
    triggerTaskAssignment(normalizedTask)
  }, [triggerTaskAssignment])

  const updateTask = useCallback((taskId, changes, activity) => {
    const currentTask = workspace.tasks.find((task) => task.id === taskId)
    dispatch({ type: 'UPDATE_TASK', payload: { taskId, changes, activity } })
    if (!currentTask) return
    const nextTask = normalizeTask({ ...currentTask, ...changes })
    if (changes.assignee && changes.assignee !== currentTask.assignee) triggerTaskAssignment(nextTask)
    if (currentTask.status !== 'reported_complete' && nextTask.status === 'reported_complete' && manager) {
      void automateTaskCompletion({ task: nextTask, manager, settings: workspace.integrationSettings, record: recordNotification })
    }
  }, [manager, recordNotification, triggerTaskAssignment, workspace.integrationSettings, workspace.tasks])

  const addTaskComment = useCallback((taskId, comment, activity) => {
    dispatch({ type: 'ADD_TASK_COMMENT', payload: { taskId, comment, activity } })
  }, [])

  const addTeamMember = useCallback((member) => {
    dispatch({ type: 'ADD_TEAM_MEMBER', payload: member })
  }, [])

  const updateTeamMember = useCallback((memberId, changes) => {
    dispatch({ type: 'UPDATE_TEAM_MEMBER', payload: { memberId, changes } })
  }, [])

  const setSiteBudget = useCallback((siteId, amount) => {
    const row = siteBudgetRows.find((item) => item.id === siteId)
    const previousPlanned = Number(workspace.siteBudgets[siteId] || 0)
    dispatch({ type: 'SET_SITE_BUDGET', payload: { siteId, amount } })
    if (row && manager && row.actual <= previousPlanned && row.actual > Number(amount)) {
      const site = sites.find((item) => item.id === siteId)
      void automateBudgetOverrun({ site, planned: Number(amount), actual: row.actual, manager, settings: workspace.integrationSettings, record: recordNotification })
    }
  }, [manager, recordNotification, siteBudgetRows, sites, workspace.integrationSettings, workspace.siteBudgets])

  const addExpense = useCallback((expense, activity) => {
    const row = siteBudgetRows.find((item) => item.id === expense.siteId)
    const nextActual = Number(row?.actual || 0) + Number(expense.amount || 0)
    dispatch({ type: 'ADD_EXPENSE', payload: { expense, activity } })
    if (row && manager && row.actual <= row.planned && nextActual > row.planned) {
      const site = sites.find((item) => item.id === expense.siteId)
      void automateBudgetOverrun({ site, planned: row.planned, actual: nextActual, manager, settings: workspace.integrationSettings, record: recordNotification })
    }
  }, [manager, recordNotification, siteBudgetRows, sites, workspace.integrationSettings])

  const setIntegrationRule = useCallback((ruleId, enabled) => {
    const integrationSettings = {
      ...workspace.integrationSettings,
      rules: { ...workspace.integrationSettings.rules, [ruleId]: enabled },
    }
    try {
      window.localStorage.setItem(WORKSPACE_KEY, JSON.stringify({ ...workspace, integrationSettings }))
    } catch {
      // The reducer still updates the current session when storage is unavailable.
    }
    dispatch({ type: 'SET_INTEGRATION_RULE', payload: { ruleId, enabled } })
  }, [workspace])

  const setNotificationLanguage = useCallback((language) => {
    const integrationSettings = { ...workspace.integrationSettings, language }
    try {
      window.localStorage.setItem(WORKSPACE_KEY, JSON.stringify({ ...workspace, integrationSettings }))
    } catch {
      // The reducer still updates the current session when storage is unavailable.
    }
    dispatch({ type: 'SET_NOTIFICATION_LANGUAGE', payload: language })
  }, [workspace])

  const updateNotificationStatus = useCallback((logId, status) => {
    dispatch({ type: 'UPDATE_NOTIFICATION_STATUS', payload: { logId, status } })
  }, [])

  const clearNotificationLogs = useCallback(() => dispatch({ type: 'CLEAR_NOTIFICATION_LOGS' }), [])

  const sendIntegrationTest = useCallback((service) => {
    if (!manager) return Promise.reject(new Error('A project manager contact is required.'))
    return runIntegrationTest({ service, manager, settings: workspace.integrationSettings, record: recordNotification })
  }, [manager, recordNotification, workspace.integrationSettings])

  const createMeeting = useCallback((meeting) => {
    dispatch({ type: 'ADD_MEETING', payload: meeting })
  }, [])

  const updateMeeting = useCallback((meetingId, changes) => {
    dispatch({ type: 'UPDATE_MEETING', payload: { meetingId, changes } })
  }, [])

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
  }, [buildMeetingEvent, recordNotification])

  const downloadMeetingIcs = useCallback((meeting) => {
    const event = buildMeetingEvent(meeting)
    downloadEventIcs(event)
    recordCalendarDownload({ event, fields: { message: `Calendar file: ${meeting.title}`, meetingId: meeting.id, taskId: meeting.taskId ?? '', source: 'Schedule' }, record: recordNotification })
    if (!meeting.calendarStatus || meeting.calendarStatus === 'none') {
      dispatch({ type: 'UPDATE_MEETING', payload: { meetingId: meeting.id, changes: { calendarStatus: 'ics' } } })
    }
  }, [buildMeetingEvent, recordNotification])

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

  const whatsappMeetingReminder = useCallback((meeting, memberId) => {
    const member = workspace.teamMembers.find((item) => item.id === memberId)
    return openMeetingWhatsApp({
      meeting,
      member,
      dateLabel: formatLongDate(meeting.date),
      timeRange: formatTimeRange(meeting),
      language: workspace.integrationSettings.language,
      record: recordNotification,
    })
  }, [recordNotification, workspace.integrationSettings.language, workspace.teamMembers])

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

  const emailTaskReminder = useCallback((task) => sendTaskReminderEmail({
    task,
    assignee: workspace.teamMembers.find((member) => member.name === task.assignee),
    record: recordNotification,
  }), [recordNotification, workspace.teamMembers])

  const whatsappTaskReminder = useCallback((task) => openTaskWhatsApp({
    task,
    assignee: workspace.teamMembers.find((member) => member.name === task.assignee),
    language: workspace.integrationSettings.language,
    record: recordNotification,
  }), [recordNotification, workspace.integrationSettings.language, workspace.teamMembers])

  const shareReport = useCallback(({ recipientIds, title, summary, note }) => {
    const recipients = workspace.teamMembers.filter((member) => recipientIds.includes(member.id))
    if (!recipients.length) return Promise.reject(new Error('Select at least one recipient.'))
    return emailReportToRecipients({ recipients, reportTitle: title, summary, note, record: recordNotification })
  }, [recordNotification, workspace.teamMembers])

  useEffect(() => {
    if (!role || !workspace.integrationSettings.rules.overdueWhatsapp) return
    workspace.tasks.forEach((task) => {
      const key = `overdue:${task.id}`
      if (!isTaskOverdue(task) || !task.notifications?.whatsapp || workspace.automationKeys.includes(key)) return
      const assignee = workspace.teamMembers.find((member) => member.name === task.assignee)
      dispatch({ type: 'MARK_AUTOMATION', payload: key })
      automateOverdueTask({ task, assignee, settings: workspace.integrationSettings, record: recordNotification })
    })
  }, [recordNotification, role, workspace.automationKeys, workspace.integrationSettings, workspace.tasks, workspace.teamMembers])

  const resetDemo = useCallback(() => dispatch({ type: 'RESET_DEMO' }), [])
  const signOut = useCallback(() => setRoleId(null), [setRoleId])

  const value = useMemo(
    () => ({
      role,
      selectRole: setRoleId,
      signOut,
      sites,
      tasks: workspace.tasks,
      decisions: workspace.decisions,
      teamMembers: workspace.teamMembers,
      siteBudgets: workspace.siteBudgets,
      expenses: workspace.expenses,
      meetings: workspace.meetings,
      integrationSettings: workspace.integrationSettings,
      notificationLogs: workspace.notificationLogs,
      addNotificationLog: recordNotification,
      budgetSummary,
      recordDecision,
      createTask,
      updateTask,
      addTaskComment,
      addTeamMember,
      updateTeamMember,
      setSiteBudget,
      addExpense,
      setIntegrationRule,
      setNotificationLanguage,
      updateNotificationStatus,
      clearNotificationLogs,
      sendIntegrationTest,
      createMeeting,
      updateMeeting,
      addMeetingToCalendar,
      downloadMeetingIcs,
      emailMeetingInvites,
      whatsappMeetingReminder,
      addTaskToCalendar,
      downloadTaskIcs,
      emailTaskReminder,
      whatsappTaskReminder,
      shareReport,
      resetDemo,
    }),
    [addExpense, addMeetingToCalendar, addTaskComment, addTaskToCalendar, addTeamMember, budgetSummary, clearNotificationLogs, createMeeting, createTask, downloadMeetingIcs, downloadTaskIcs, emailMeetingInvites, emailTaskReminder, recordDecision, recordNotification, resetDemo, role, sendIntegrationTest, setIntegrationRule, setNotificationLanguage, setRoleId, setSiteBudget, shareReport, signOut, sites, updateMeeting, updateNotificationStatus, updateTask, updateTeamMember, whatsappMeetingReminder, whatsappTaskReminder, workspace.decisions, workspace.expenses, workspace.integrationSettings, workspace.meetings, workspace.notificationLogs, workspace.siteBudgets, workspace.tasks, workspace.teamMembers],
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

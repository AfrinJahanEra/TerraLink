import {
  createCalendarEventLink,
  createDeadlineEvent,
  createGoogleCalendarLink,
  getGoogleCalendarConfiguration,
  insertCalendarEvent,
} from './calendar'
import { emailTemplates, getEmailConfiguration } from './email'
import { createWhatsAppLink, getMeetingLink, getTaskLink, openWhatsApp } from './whatsapp'

function logId() {
  return `notification-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

export function createLog(fields) {
  return {
    id: logId(),
    createdAt: new Date().toISOString(),
    recipient: '',
    channel: '',
    message: '',
    status: 'Sent',
    detail: '',
    actionUrl: '',
    taskId: '',
    meetingId: '',
    source: 'System',
    ...fields,
  }
}

function errorMessage(error) {
  return error instanceof Error ? error.message : 'The integration request failed.'
}

async function attempt(record, fields, action, failureFields = {}) {
  try {
    const result = await action()
    const log = createLog({ ...fields, status: 'Sent', ...result?.logFields })
    record(log)
    return log
  } catch (error) {
    const log = createLog({ ...fields, ...failureFields, status: 'Failed', detail: errorMessage(error) })
    record(log)
    return log
  }
}

function prepareWhatsApp(record, { phone, recipientName, type, details, language, fields, detail, open = false }) {
  try {
    const prepared = createWhatsAppLink({ phone, type, details, language })
    if (open) openWhatsApp(prepared.url)
    const log = createLog({
      ...fields,
      recipient: `${recipientName} · ${phone}`,
      channel: 'WhatsApp',
      message: prepared.message,
      status: open ? 'Opened' : 'Sent',
      detail,
      actionUrl: prepared.url,
    })
    record(log)
    return log
  } catch (error) {
    const log = createLog({ ...fields, recipient: recipientName, channel: 'WhatsApp', status: 'Failed', detail: errorMessage(error) })
    record(log)
    return log
  }
}

/* Rule-based automations ------------------------------------------------- */

export async function automateTaskAssignment({ task, assignee, site, settings, record }) {
  const actions = []
  const actionUrl = getTaskLink(task)
  const base = { taskId: task.id, source: 'Tasks' }

  if (settings.rules.taskAssignedEmail && task.notifications?.email) {
    actions.push(attempt(record, {
      ...base,
      recipient: `${assignee?.name ?? task.assignee} · ${assignee?.email ?? 'No email'}`,
      channel: 'Email',
      message: `Task assignment: ${task.id} · ${task.title}`,
      actionUrl,
    }, () => emailTemplates.taskAssignment({
      toName: assignee?.name ?? task.assignee,
      toEmail: assignee?.email,
      task,
      site,
      actionUrl,
    })))
  }

  if (settings.rules.taskAssignedCalendar && task.notifications?.calendar) {
    const fallbackUrl = createGoogleCalendarLink(task)
    actions.push(attempt(record, {
      ...base,
      recipient: 'Connected Google account',
      channel: 'Calendar',
      message: `Deadline event: ${task.id} · ${task.dueDate}`,
      actionUrl: fallbackUrl,
    }, async () => {
      if (!getGoogleCalendarConfiguration().connected) {
        throw new Error('Google Calendar is not connected. Use “Add deadline to calendar” on the task to open a prefilled event.')
      }
      const event = await createDeadlineEvent(task)
      return { logFields: { actionUrl: event.htmlLink ?? fallbackUrl, detail: 'Event created with a one-day popup reminder.' } }
    }, { actionUrl: fallbackUrl }))
  }

  if (settings.rules.taskAssignedWhatsapp && task.notifications?.whatsapp) {
    prepareWhatsApp(record, {
      phone: assignee?.whatsapp,
      recipientName: assignee?.name ?? task.assignee,
      type: 'task_assign',
      details: { task },
      language: settings.language,
      fields: { ...base, message: `Task assignment: ${task.id}` },
      detail: 'Click-to-chat message prepared; open it from Communications.',
    })
  }

  await Promise.allSettled(actions)
}

export async function automateBudgetOverrun({ site, planned, actual, manager, settings, record }) {
  if (!settings.rules.overBudgetEmail) return
  await attempt(record, {
    recipient: `${manager.name} · ${manager.email}`,
    channel: 'Email',
    message: `Budget overrun: ${site.name} reached ৳${Number(actual).toLocaleString('en-US')}`,
    actionUrl: `${window.location.origin}/budget`,
    source: 'Finance',
  }, () => emailTemplates.overBudget({
    toName: manager.name,
    toEmail: manager.email,
    site,
    planned,
    actual,
    actionUrl: `${window.location.origin}/budget`,
  }))
}

export async function automateTaskCompletion({ task, manager, settings, record }) {
  const actionUrl = getTaskLink(task)
  const actions = []
  const base = { taskId: task.id, source: 'Tasks' }

  if (settings.rules.taskCompleteEmail && task.notifications?.email) {
    actions.push(attempt(record, {
      ...base,
      recipient: `${manager.name} · ${manager.email}`,
      channel: 'Email',
      message: `Reported complete: ${task.id} · ${task.title}`,
      actionUrl,
    }, () => emailTemplates.taskComplete({
      toName: manager.name,
      toEmail: manager.email,
      task,
      actionUrl,
    })))
  }

  if (settings.rules.taskCompleteWhatsapp && task.notifications?.whatsapp) {
    prepareWhatsApp(record, {
      phone: manager.whatsapp,
      recipientName: manager.name,
      type: 'task_complete',
      details: { task },
      language: settings.language,
      fields: { ...base, message: `Reported complete: ${task.id}` },
      detail: 'Click-to-chat completion message prepared.',
    })
  }

  await Promise.allSettled(actions)
}

export function automateOverdueTask({ task, assignee, settings, record }) {
  if (!settings.rules.overdueWhatsapp || !task.notifications?.whatsapp) return
  prepareWhatsApp(record, {
    phone: assignee?.whatsapp,
    recipientName: assignee?.name ?? task.assignee,
    type: 'overdue',
    details: { task },
    language: settings.language,
    fields: { taskId: task.id, source: 'Tasks', message: `Overdue reminder: ${task.id}` },
    detail: 'Overdue click-to-chat reminder prepared.',
  })
}

/* Contextual actions started by a person from a workflow ------------------ */

/**
 * Opens the prefilled Google Calendar page synchronously (so the browser keeps
 * the user gesture) unless OAuth is connected, in which case the event is created directly.
 */
export function addEventToCalendar({ event, fields, record }) {
  const fallbackUrl = createCalendarEventLink(event)

  if (!getGoogleCalendarConfiguration().connected) {
    window.open(fallbackUrl, '_blank', 'noopener,noreferrer')
    const log = createLog({
      ...fields,
      recipient: 'Google Calendar',
      channel: 'Calendar',
      status: 'Opened',
      detail: 'Google Calendar opened with the event prefilled; save it there to confirm.',
      actionUrl: fallbackUrl,
    })
    record(log)
    return Promise.resolve({ mode: 'link', log, url: fallbackUrl })
  }

  return attempt(record, {
    ...fields,
    recipient: 'Connected Google account',
    channel: 'Calendar',
    actionUrl: fallbackUrl,
  }, async () => {
    const created = await insertCalendarEvent(event)
    return { logFields: { actionUrl: created.htmlLink ?? fallbackUrl, detail: 'Event created in Google Calendar with a reminder.' } }
  }, { actionUrl: fallbackUrl }).then((log) => ({ mode: log.status === 'Failed' ? 'failed' : 'api', log, url: log.actionUrl }))
}

export function recordCalendarDownload({ event, fields, record }) {
  const log = createLog({ ...fields, recipient: 'Local calendar file', channel: 'Calendar', status: 'Sent', detail: `${event.uid}.ics downloaded for Outlook, Apple, or Google Calendar.` })
  record(log)
  return log
}

async function emailMany(record, { recipients, fields, send }) {
  const config = getEmailConfiguration()
  if (!config.configured) {
    const log = createLog({
      ...fields,
      recipient: recipients.map((member) => member.name).join(', '),
      channel: 'Email',
      status: 'Failed',
      detail: `EmailJS is not configured. Missing ${config.missing.join(', ')}.`,
    })
    record(log)
    return [log]
  }
  return Promise.all(recipients.map((member) => attempt(record, {
    ...fields,
    recipient: `${member.name} · ${member.email}`,
    channel: 'Email',
  }, () => send(member))))
}

export function emailMeetingInvites({ meeting, attendees, summary, record }) {
  const actionUrl = getMeetingLink(meeting)
  return emailMany(record, {
    recipients: attendees,
    fields: { message: `Meeting invitation: ${meeting.title}`, meetingId: meeting.id, taskId: meeting.taskId ?? '', source: 'Schedule', actionUrl },
    send: (member) => emailTemplates.meetingInvite({ toName: member.name, toEmail: member.email, meeting, message: summary, actionUrl }),
  })
}

export function whatsappMeetingReminder({ meeting, member, dateLabel, timeRange, language, record }) {
  return prepareWhatsApp(record, {
    phone: member?.whatsapp,
    recipientName: member?.name ?? 'Attendee',
    type: 'meeting',
    details: { meeting, dateLabel, timeRange },
    language,
    fields: { meetingId: meeting.id, taskId: meeting.taskId ?? '', source: 'Schedule' },
    detail: 'Meeting reminder opened in WhatsApp for confirmation.',
    open: true,
  })
}

export function emailTaskReminder({ task, assignee, record }) {
  const actionUrl = getTaskLink(task)
  return attempt(record, {
    recipient: `${assignee?.name ?? task.assignee} · ${assignee?.email ?? 'No email'}`,
    channel: 'Email',
    message: `Deadline reminder: ${task.id} · ${task.dueDate}`,
    taskId: task.id,
    source: 'Tasks',
    actionUrl,
  }, () => emailTemplates.taskReminder({ toName: assignee?.name ?? task.assignee, toEmail: assignee?.email, task, actionUrl }))
}

export function whatsappTaskReminder({ task, assignee, language, record }) {
  return prepareWhatsApp(record, {
    phone: assignee?.whatsapp,
    recipientName: assignee?.name ?? task.assignee,
    type: 'task_reminder',
    details: { task },
    language,
    fields: { taskId: task.id, source: 'Tasks' },
    detail: 'Task reminder opened in WhatsApp for confirmation.',
    open: true,
  })
}

export function emailReportToRecipients({ recipients, reportTitle, summary, note, record }) {
  const actionUrl = `${window.location.origin}/reports`
  const message = note ? `${note}\n\n${summary}` : summary
  return emailMany(record, {
    recipients,
    fields: { message: `Report shared: ${reportTitle}`, source: 'Reports', actionUrl },
    send: (member) => emailTemplates.reportSummary({
      toName: member.name,
      toEmail: member.email,
      subject: `TerraLink report: ${reportTitle}`,
      message,
      actionUrl,
    }),
  })
}

export async function runIntegrationTest({ service, manager, settings, record }) {
  const testTask = {
    id: 'TEST-001',
    title: 'Integration connection test',
    description: 'This test verifies the TerraLink notification connection.',
    site: 'TerraLink workspace',
    assignee: manager.name,
    dueDate: new Date(Date.now() + 86_400_000).toISOString().slice(0, 10),
  }
  const settingsUrl = `${window.location.origin}/settings`

  if (service === 'email') {
    return attempt(record, {
      recipient: `${manager.name} · ${manager.email}`,
      channel: 'Email',
      message: 'Connection test from TerraLink',
      actionUrl: settingsUrl,
      source: 'Settings',
    }, () => emailTemplates.reportSummary({
      toName: manager.name,
      toEmail: manager.email,
      subject: 'TerraLink EmailJS connection test',
      message: 'EmailJS is connected. TerraLink can deliver task, meeting, budget, completion, and report emails.',
      actionUrl: settingsUrl,
    }))
  }

  if (service === 'calendar') {
    const fallbackUrl = createGoogleCalendarLink(testTask)
    return attempt(record, {
      recipient: 'Connected Google account',
      channel: 'Calendar',
      message: 'Google Calendar connection test',
      actionUrl: fallbackUrl,
      source: 'Settings',
    }, async () => {
      if (!getGoogleCalendarConfiguration().connected) throw new Error('Connect Google Calendar before sending a test event.')
      const event = await createDeadlineEvent(testTask)
      return { logFields: { actionUrl: event.htmlLink ?? fallbackUrl, detail: 'Test event created with a one-day reminder.' } }
    }, { actionUrl: fallbackUrl })
  }

  if (service === 'whatsapp') {
    return prepareWhatsApp(record, {
      phone: manager.whatsapp,
      recipientName: manager.name,
      type: 'test',
      language: settings.language,
      fields: { source: 'Settings' },
      detail: 'Click-to-chat test opened in a new tab.',
      open: true,
    })
  }

  throw new Error(`Unknown integration service: ${service}.`)
}

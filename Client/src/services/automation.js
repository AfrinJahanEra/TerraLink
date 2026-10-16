import {
  connectGoogleCalendar,
  createCalendarEventLink,
  createDeadlineEvent,
  createGoogleCalendarLink,
  getGoogleCalendarConfiguration,
  insertCalendarEvent,
} from './calendar'
import { emailTemplates, getEmailConfiguration } from './email'
import { getMeetingLink, getReportsLink, getTaskLink } from './links'

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
  if (error instanceof Error) return error.message
  // EmailJS rejects with { status, text } rather than an Error.
  if (error?.text) return `${error.text}${error.status ? ` (status ${error.status})` : ''}`
  return 'The request failed.'
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

/** Opens the Google sign-in prompt the first time, then reuses the session token. Must start from a click. */
async function ensureGoogleCalendar() {
  const google = getGoogleCalendarConfiguration()
  if (!google.configured) throw new Error('Google Calendar is not set up for this workspace.')
  if (!google.connected) await connectGoogleCalendar()
}

/* Automations: what happens on its own when work is created or finished ---- */

export async function automateTaskAssignment({ task, assignee, site, record }) {
  const actions = []
  const actionUrl = getTaskLink(task)
  const base = { taskId: task.id, source: 'Tasks' }

  if (task.notifications?.email) {
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

  if (task.notifications?.calendar) {
    const fallbackUrl = createGoogleCalendarLink(task)
    actions.push(attempt(record, {
      ...base,
      recipient: 'Google Calendar',
      channel: 'Calendar',
      message: `Deadline event: ${task.id} · ${task.dueDate}`,
      actionUrl: fallbackUrl,
    }, async () => {
      if (!getGoogleCalendarConfiguration().configured) {
        throw new Error('Google Calendar is not set up. Use “Add deadline to Google Calendar” on the task to open a prefilled event.')
      }
      await ensureGoogleCalendar()
      const event = await createDeadlineEvent(task)
      return { logFields: { actionUrl: event.htmlLink ?? fallbackUrl, detail: 'Event created with a one-day popup reminder.' } }
    }, { actionUrl: fallbackUrl }))
  }

  return Promise.all(actions)
}

export async function automateBudgetOverrun({ site, planned, actual, manager, record }) {
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

export async function automateTaskCompletion({ task, manager, record }) {
  if (!task.notifications?.email) return
  const actionUrl = getTaskLink(task)
  await attempt(record, {
    taskId: task.id,
    source: 'Tasks',
    recipient: `${manager.name} · ${manager.email}`,
    channel: 'Email',
    message: `Reported complete: ${task.id} · ${task.title}`,
    actionUrl,
  }, () => emailTemplates.taskComplete({
    toName: manager.name,
    toEmail: manager.email,
    task,
    actionUrl,
  }))
}

/* Contextual actions started by a person from a workflow ------------------ */

/**
 * Adds an event to Google Calendar. With Google set up it signs in on first use and creates the event directly;
 * without it, it opens the prefilled Google Calendar page. Call it straight from a click so the browser allows the popup.
 */
export function addEventToCalendar({ event, fields, record }) {
  const fallbackUrl = createCalendarEventLink(event)

  if (!getGoogleCalendarConfiguration().configured) {
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
    recipient: 'Google Calendar',
    channel: 'Calendar',
    actionUrl: fallbackUrl,
  }, async () => {
    await ensureGoogleCalendar()
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
      detail: `Email is not set up. Missing ${config.missing.join(', ')}.`,
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

/**
 * Emails the report to each recipient: a subject, an HTML body with a summary table, a plain-text fallback,
 * and the PDF attached. `html(recipient)` builds the body so every email can greet the person by name.
 */
export function emailReportToRecipients({ recipients, reportTitle, subject, summary, html, attachment, note, record }) {
  const actionUrl = getReportsLink()
  const message = note ? `${note}\n\n${summary}` : summary
  return emailMany(record, {
    recipients,
    fields: { message: `Report sent: ${reportTitle}`, source: 'Reports', actionUrl },
    send: (member) => emailTemplates.reportSummary({
      toName: member.name,
      toEmail: member.email,
      subject,
      message,
      actionUrl,
      extraParams: {
        message_html: html(member),
        report_filename: attachment.filename,
        report_pdf: attachment.dataUri,
      },
    }),
  })
}

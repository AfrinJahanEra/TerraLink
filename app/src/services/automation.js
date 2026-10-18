import { connectGoogleCalendar, getGoogleCalendarConfiguration, insertCalendarEvent } from './calendar'
import { emailTemplates, resolveEmailSetup, sendEmailNotification } from './email'
import { meetingEmail, taskAssignmentEmail, taskReminderEmail } from './taskEmails'
import { getReportsLink, getTaskLink } from './links'

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

/**
 * Task assigned: one professional email to the field coordinator with a calendar invitation for the deadline,
 * so it appears in their calendar without anyone clicking "add to calendar".
 */
export async function automateTaskAssignment({ task, assignee, site, record, directionsUrl }) {
  const actionUrl = getTaskLink(task)
  const log = await attempt(record, {
    taskId: task.id,
    source: 'Tasks',
    recipient: `${assignee?.name ?? task.assignee} · ${assignee?.email ?? 'No email'}`,
    channel: 'Email',
    message: `Task assignment with calendar invite: ${task.id} · ${task.title}`,
    actionUrl,
  }, async () => {
    if (!assignee?.email) throw new Error(`${task.assignee} has no email address on the Team page.`)
    const setup = await resolveEmailSetup()
    const email = taskAssignmentEmail({ task, site, assignee, organizer: { name: 'TerraLink', email: setup.from }, actionUrl, directionsUrl })
    await sendEmailNotification({
      type: 'task_assign', toName: assignee.name, toEmail: assignee.email, subject: email.subject, message: email.text, task, site, actionUrl,
      extraParams: { message_html: email.html, message_text: email.text, ical_event: email.ics },
    })
    return { logFields: { detail: email.ics ? 'Sent with a calendar invitation for the deadline.' : 'Sent without a calendar invitation (EmailJS cannot attach one).' } }
  })
  return [log]
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

async function emailMany(record, { recipients, fields, send }) {
  const config = await resolveEmailSetup()
  if (!config.configured) {
    const log = createLog({
      ...fields,
      recipient: recipients.map((member) => member.name).join(', '),
      channel: 'Email',
      status: 'Failed',
      detail: `Email is not set up. Add ${config.missing.join(', ')} to app/.env and restart the app.`,
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

export function emailTaskReminder({ task, assignee, site, record }) {
  const actionUrl = getTaskLink(task)
  return attempt(record, {
    recipient: `${assignee?.name ?? task.assignee} · ${assignee?.email ?? 'No email'}`,
    channel: 'Email',
    message: `Deadline reminder: ${task.id} · ${task.dueDate}`,
    taskId: task.id,
    source: 'Tasks',
    actionUrl,
  }, () => {
    if (!assignee?.email) throw new Error(`${task.assignee} has no email address on the Team page.`)
    const email = taskReminderEmail({ task, site, assignee, actionUrl })
    return sendEmailNotification({
      type: 'task_reminder', toName: assignee.name, toEmail: assignee.email, subject: email.subject, message: email.text, task, site, actionUrl,
      extraParams: { message_html: email.html, message_text: email.text },
    })
  })
}

/**
 * Online meeting about a task: creates the event with a Google Meet link in the signed-in manager's Google Calendar,
 * lets Google invite every guest (it lands in their calendar), and sends each guest a branded email with the link.
 * Start it straight from a click: the first time, Google asks the manager to sign in.
 */
export async function createTaskMeeting({ meeting, task, site, guests, organizerName, record }) {
  await ensureGoogleCalendar()
  const taskUrl = task ? getTaskLink(task) : ''
  const description = [
    task && `Task: ${task.id} · ${task.title}`,
    site && `Water body: ${site.name}, ${site.location}`,
    `Organiser: ${organizerName}`,
    meeting.agenda && `\nAgenda:\n${meeting.agenda}`,
    '\nPlease join on time.',
    taskUrl && `\nTerraLink task: ${taskUrl}`,
  ].filter(Boolean).join('\n')
  const created = await insertCalendarEvent({
    uid: meeting.id.toLowerCase(),
    title: meeting.title,
    description,
    location: 'Google Meet',
    date: meeting.date,
    startTime: meeting.startTime,
    durationMinutes: meeting.durationMinutes,
    attendees: guests.map((guest) => guest.email),
    reminderMinutes: 30,
    recordId: meeting.id,
  }, { meet: true, notify: true })
  const meetUrl = created.hangoutLink ?? created.conferenceData?.entryPoints?.find((entry) => entry.entryPointType === 'video')?.uri
  if (!meetUrl) throw new Error('Google Calendar created the event but did not return a Meet link.')
  const base = { meetingId: meeting.id, taskId: task?.id ?? '', source: 'Tasks', actionUrl: meetUrl }
  record(createLog({ ...base, recipient: 'Google Calendar', channel: 'Calendar', message: `Google Meet created: ${meeting.title}`, detail: `Invitations sent by Google to ${guests.length} ${guests.length === 1 ? 'guest' : 'guests'}.`, actionUrl: created.htmlLink ?? meetUrl }))
  const logs = await Promise.all(guests.map((guest) => attempt(record, {
    ...base,
    recipient: guest.name ? `${guest.name} · ${guest.email}` : guest.email,
    channel: 'Email',
    message: `Meeting link: ${meeting.title}`,
  }, () => {
    const email = meetingEmail({ meeting, recipient: guest, organizerName, meetUrl, calendarUrl: created.htmlLink, task, site, taskUrl })
    return sendEmailNotification({
      type: 'meeting_invite', toName: guest.name, toEmail: guest.email, subject: email.subject, message: email.text, task, site, actionUrl: meetUrl,
      extraParams: { message_html: email.html, message_text: email.text },
    })
  })))
  return { meetUrl, calendarUrl: created.htmlLink ?? '', logs }
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

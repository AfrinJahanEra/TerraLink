import { buildInviteIcs, createCalendarEventLink, taskToCalendarEvent } from './calendar'
import { renderEmail } from './emailLayout'

const TIME_ZONE = 'Asia/Dhaka'

export function formatLongDate(dateText) {
  return new Intl.DateTimeFormat('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: TIME_ZONE }).format(new Date(`${dateText}T12:00:00+06:00`))
}

function formatTime(dateText, time, plusMinutes = 0) {
  const date = new Date(new Date(`${dateText}T${time}:00+06:00`).getTime() + plusMinutes * 60_000)
  return new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: TIME_ZONE }).format(date).toLowerCase()
}

export const formatTimeRange = (date, startTime, minutes) => `${formatTime(date, startTime)} – ${formatTime(date, startTime, minutes)} (GMT+6, Dhaka)`

const bdt = (value) => `৳${Number(value || 0).toLocaleString('en-US')}`

/** Task assigned: a branded email plus a calendar invitation for the deadline, so it lands in the person's calendar. */
export function taskAssignmentEmail({ task, site, assignee, organizer, actionUrl, directionsUrl }) {
  const event = { ...taskToCalendarEvent(task), title: `${task.id} due: ${task.title}`, location: site ? `${site.name}, ${site.location}` : task.site }
  const { html, text } = renderEmail({
    preheader: `${task.title} at ${task.site}, due ${formatLongDate(task.dueDate)}.`,
    eyebrow: `New task · ${task.priority} priority`,
    title: task.title,
    greeting: `Dear ${assignee.name},`,
    intro: `You have been assigned a new field task at ${task.site}. The deadline has been added to your calendar with a reminder the day before. Please review the details below and start the task in TerraLink when you begin.`,
    rows: [
      ['Task', task.id],
      ['Water body', site ? `${site.name}, ${site.location}` : task.site],
      ['Deadline', formatLongDate(task.dueDate)],
      ['Priority', task.priority],
      ['Budget given', task.estimatedCost ? bdt(task.budget ?? task.estimatedCost) : ''],
      ['Assigned by', task.assignedBy],
    ],
    noteTitle: 'What to do',
    note: task.description,
    button: { label: 'Open task in TerraLink', url: actionUrl, color: '#1e4f53' },
    links: [
      directionsUrl && { label: 'Get directions', url: directionsUrl },
      { label: 'Add to Google Calendar', url: createCalendarEventLink(event) },
    ].filter(Boolean),
    footer: 'When the work is done, submit after-photos from the same spot. They are checked by TerraLink’s AI before the manager approves the task.',
  })
  return {
    subject: `New task: ${task.title} · due ${formatLongDate(task.dueDate)}`,
    html,
    text,
    ics: organizer?.email ? buildInviteIcs(event, { organizer, attendees: [assignee], url: actionUrl }) : '',
  }
}

/** Deadline reminder for an open task. */
export function taskReminderEmail({ task, site, assignee, actionUrl }) {
  const { html, text } = renderEmail({
    preheader: `${task.id} is due ${formatLongDate(task.dueDate)}.`,
    eyebrow: 'Deadline reminder',
    title: `${task.title} is due ${formatLongDate(task.dueDate)}`,
    greeting: `Dear ${assignee.name},`,
    intro: 'This is a friendly reminder about the task below. Please add a progress note, or submit your after-photos if the work is finished.',
    rows: [
      ['Task', task.id],
      ['Water body', site ? `${site.name}, ${site.location}` : task.site],
      ['Deadline', formatLongDate(task.dueDate)],
      ['Priority', task.priority],
    ],
    button: { label: 'Open task in TerraLink', url: actionUrl, color: '#1e4f53' },
  })
  return { subject: `Reminder: ${task.id} is due ${formatLongDate(task.dueDate)}`, html, text }
}

/** Meeting invitation with the Google Meet link, the agenda and a one-click join button. */
export function meetingEmail({ meeting, recipient, organizerName, meetUrl, calendarUrl, task, site, taskUrl }) {
  const { html, text } = renderEmail({
    preheader: `${formatLongDate(meeting.date)}, ${formatTimeRange(meeting.date, meeting.startTime, meeting.durationMinutes)}. Join with Google Meet.`,
    eyebrow: 'Meeting invitation',
    title: meeting.title,
    greeting: recipient.name ? `Dear ${recipient.name},` : 'Hello,',
    intro: `${organizerName} has invited you to an online meeting about ${task ? `task ${task.id} at ${task.site}` : 'TerraLink work'}. The meeting has been added to your Google Calendar. Please join on time using the link below.`,
    rows: [
      ['Date', formatLongDate(meeting.date)],
      ['Time', formatTimeRange(meeting.date, meeting.startTime, meeting.durationMinutes)],
      ['Duration', `${meeting.durationMinutes} minutes`],
      ['Organiser', organizerName],
      ['Task', task ? `${task.id} · ${task.title}` : ''],
      ['Water body', site ? `${site.name}, ${site.location}` : ''],
      ['Meeting link', meetUrl],
    ],
    noteTitle: 'Agenda',
    note: meeting.agenda,
    button: { label: 'Join with Google Meet', url: meetUrl, color: '#1a73e8', caption: meetUrl },
    links: [
      calendarUrl && { label: 'View in Google Calendar', url: calendarUrl },
      taskUrl && { label: 'Open task in TerraLink', url: taskUrl },
    ].filter(Boolean),
    footer: 'Please be ready with your updates and questions. If you cannot attend, reply to this email.',
  })
  return { subject: `Invitation: ${meeting.title} · ${formatLongDate(meeting.date)}, ${formatTime(meeting.date, meeting.startTime)}`, html, text }
}

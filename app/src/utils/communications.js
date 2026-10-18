export const LOG_STATUS_STYLES = {
  Sent: 'bg-slate-100 text-slate-600',
  Opened: 'bg-slate-100 text-slate-600',
  Failed: 'bg-slate-100 text-rose-700',
}

export function formatLogTimestamp(value) {
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
  }).format(new Date(value))
}

export function describeEmailResult(logs, noun = 'email') {
  const list = Array.isArray(logs) ? logs : [logs]
  const sent = list.filter((log) => log.status === 'Sent').length
  if (list.length && sent === list.length) return `${sent} ${noun}${sent === 1 ? '' : 's'} sent.`
  if (!sent) return `${noun.charAt(0).toUpperCase()}${noun.slice(1)} not sent: ${list[0]?.detail || 'delivery failed.'}`
  return `${sent} of ${list.length} ${noun}s sent; ${list.length - sent} failed.`
}

/** What happened after a task was created: the schedule always has it; email and Google Calendar run if ticked. */
export function describeTaskFollowUp(id, logs = []) {
  const email = logs.find((log) => log.channel === 'Email')
  const calendar = logs.find((log) => log.channel === 'Calendar')
  const parts = [`${id} created and added to the TerraLink schedule.`]
  if (email) parts.push(email.status === 'Sent' ? `Email with a calendar invitation sent to ${email.recipient.split(' · ')[0]}.` : `Email not sent: ${email.detail}`)
  if (calendar) parts.push(calendar.status === 'Failed' ? `Google Calendar: ${calendar.detail}` : 'Added to Google Calendar.')
  return parts.join(' ')
}


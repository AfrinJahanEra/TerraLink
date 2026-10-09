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
  return `${sent} of ${list.length} ${noun}s sent; ${list.length - sent} failed. See Communications for details.`
}

export function describeCalendarResult(result) {
  if (result.mode === 'api') return 'Event added to Google Calendar.'
  if (result.mode === 'link') return 'Google Calendar opened with the event prefilled. Save it there to confirm.'
  return `Calendar event failed: ${result.log?.detail || 'the request was not completed.'}`
}

export function describeWhatsAppResult(log) {
  return log.status === 'Failed' ? `WhatsApp reminder not prepared: ${log.detail}` : 'WhatsApp opened with the reminder message.'
}

export function getLogRecord(log) {
  if (log.meetingId) return { label: log.meetingId, to: `/schedule?meeting=${encodeURIComponent(log.meetingId)}` }
  if (log.taskId && !log.taskId.startsWith('TEST')) return { label: log.taskId, to: `/tasks?task=${encodeURIComponent(log.taskId)}` }
  return null
}

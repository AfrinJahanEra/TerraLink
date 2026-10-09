import { SITE_STATUS } from '../constants/status'
import { MEETING_TYPES } from '../data/schedule'
import { getLogRecord } from './communications'
import { formatBdt } from './currency'

const MONTHS = { Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5, Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11 }

export const AUDIT_MODULES = ['Tasks', 'Monitoring', 'Finance', 'Schedule', 'Communications']

/** Activity entries store either an ISO `at` timestamp or a display date such as "08 Oct 2026". */
function parseActivityTime(entry) {
  if (entry.at) return { at: entry.at, dateOnly: false }
  const match = /^(\d{1,2}) ([A-Z][a-z]{2}) (\d{4})$/.exec(String(entry.time ?? '').trim())
  if (!match || MONTHS[match[2]] === undefined) return { at: '', dateOnly: true }
  return { at: new Date(Number(match[3]), MONTHS[match[2]], Number(match[1]), 12).toISOString(), dateOnly: true }
}

export function buildAuditEvents({ tasks, decisions, expenses, meetings, notificationLogs, sites }) {
  const siteNames = new Map(sites.map((site) => [site.id, site.name]))
  const events = []

  tasks.forEach((task) => {
    task.activityHistory?.forEach((entry) => {
      const { at, dateOnly } = parseActivityTime(entry)
      events.push({ id: `task-${task.id}-${entry.id}`, at, dateOnly, module: 'Tasks', record: task.id, to: `/tasks?task=${task.id}`, event: entry.action, actor: entry.actor })
    })
  })

  Object.values(decisions ?? {}).forEach((decision) => {
    events.push({
      id: `decision-${decision.siteId}-${decision.decidedAt}`,
      at: decision.decidedAt,
      dateOnly: false,
      module: 'Monitoring',
      record: siteNames.get(decision.siteId) ?? decision.siteId,
      to: `/sites/${decision.siteId}`,
      event: `Review decision: ${SITE_STATUS[decision.status]?.label ?? decision.status}`,
      actor: decision.decidedBy,
    })
  })

  expenses.forEach((expense) => {
    events.push({
      id: `expense-${expense.id}`,
      at: expense.createdAt,
      dateOnly: false,
      module: 'Finance',
      record: expense.id,
      to: '/expenses',
      event: `Expense recorded: ${expense.description} (${formatBdt(expense.amount)})`,
      actor: expense.createdBy,
    })
  })

  meetings.forEach((meeting) => {
    events.push({
      id: `meeting-${meeting.id}`,
      at: meeting.createdAt,
      dateOnly: false,
      module: 'Schedule',
      record: meeting.id,
      to: `/schedule?meeting=${meeting.id}`,
      event: `${MEETING_TYPES[meeting.type]?.label ?? 'Meeting'} scheduled: ${meeting.title}`,
      actor: meeting.organizer,
    })
  })

  notificationLogs.forEach((log) => {
    const record = getLogRecord(log)
    events.push({
      id: `log-${log.id}`,
      at: log.createdAt,
      dateOnly: false,
      module: 'Communications',
      record: record?.label ?? log.source ?? 'System',
      to: record?.to ?? '/communications',
      event: `${log.channel} ${String(log.status).toLowerCase()}: ${log.message || log.recipient}`,
      actor: log.source ? `${log.source} module` : 'System',
    })
  })

  return events.filter((event) => event.at).sort((a, b) => b.at.localeCompare(a.at))
}

export function formatAuditTime(event) {
  const options = event.dateOnly
    ? { day: '2-digit', month: 'short', year: 'numeric' }
    : { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }
  return new Intl.DateTimeFormat('en-GB', options).format(new Date(event.at))
}

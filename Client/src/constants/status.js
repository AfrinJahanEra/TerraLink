/** Outcome of a satellite review / manager decision for a site. */
export const SITE_STATUS = {
  needs_review: { label: 'Needs review', tone: 'amber', color: '#d97706' },
  reported_issue: { label: 'Reported issue', tone: 'amber', color: '#b45309' },
  confirmed: { label: 'Confirmed for follow-up', tone: 'rose', color: '#be123c' },
  inconclusive: { label: 'Inconclusive', tone: 'neutral', color: '#64748b' },
  no_change: { label: 'No change', tone: 'brand', color: '#2a9698' },
  insufficient_data: { label: 'Insufficient data', tone: 'neutral', color: '#94a3b8' },
}

/** The public map groups the six review states into three: stable, needs attention, not enough data. */
export const SITE_GROUP = {
  stable: { label: 'Stable', tone: 'brand', color: '#7ccfcd' },
  attention: { label: 'Needs attention', tone: 'amber', color: '#d97706' },
  neutral: { label: 'Not enough data', tone: 'neutral', color: '#94a3b8' },
}

export function siteGroup(status) {
  if (status === 'no_change') return 'stable'
  if (status === 'needs_review' || status === 'reported_issue' || status === 'confirmed') return 'attention'
  return 'neutral'
}

/** Task workflow. Overdue is a derived flag, not a status, so a task can be In progress and overdue at once. */
export const TASK_STATUS = {
  open: { label: 'Open', tone: 'neutral' },
  in_progress: { label: 'In progress', tone: 'brand' },
  blocked: { label: 'Blocked', tone: 'amber' },
  awaiting_verification: { label: 'Awaiting verification', tone: 'brandSoft' },
  completed: { label: 'Completed', tone: 'brandDeep' },
  cancelled: { label: 'Cancelled', tone: 'slate' },
}

export const TASK_STATUS_ORDER = Object.keys(TASK_STATUS)

/** Stages shown as board columns; cancelled tasks stay in the list view only. */
export const BOARD_STATUSES = ['open', 'in_progress', 'blocked', 'awaiting_verification', 'completed']

const CLOSED = ['completed', 'cancelled']
export const isTaskClosed = (task) => CLOSED.includes(task.status)

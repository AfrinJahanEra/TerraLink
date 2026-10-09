/** Outcome of a satellite change analysis / manager decision for a site. */
export const SITE_STATUS = {
  needs_review: { label: 'Needs review', tone: 'amber' },
  confirmed: { label: 'Confirmed for follow-up', tone: 'rose' },
  inconclusive: { label: 'Inconclusive', tone: 'slate' },
  no_change: { label: 'No change', tone: 'emerald' },
  insufficient_data: { label: 'Insufficient data', tone: 'violet' },
}

/** Task workflow, in order. */
export const TASK_STATUS = {
  review_pending: { label: 'Review pending', tone: 'amber' },
  approved: { label: 'Approved', tone: 'sky' },
  in_progress: { label: 'In progress', tone: 'brand' },
  reported_complete: { label: 'Reported complete', tone: 'emerald' },
}

export const TASK_STATUS_ORDER = Object.keys(TASK_STATUS)

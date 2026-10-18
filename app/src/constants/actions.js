export const EXPENSE_CATEGORIES = {
  labor: 'Labour',
  transport: 'Transport',
  equipment: 'Equipment',
  waste_disposal: 'Waste disposal',
  other: 'Other',
}

/** Only approved expenses count toward a task's actual cost. */
export const EXPENSE_APPROVAL = {
  pending: { label: 'Pending approval', tone: 'amber' },
  approved: { label: 'Approved', tone: 'emerald' },
  rejected: { label: 'Rejected', tone: 'rose' },
}

export const TASK_RESOLUTION = {
  resolved: { label: 'Resolved', tone: 'emerald' },
  partial: { label: 'Partly resolved', tone: 'amber' },
  not_resolved: { label: 'Not resolved', tone: 'rose' },
}

export const TASK_PRIORITIES = ['Low', 'Medium', 'High', 'Urgent']

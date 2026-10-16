import { isTaskClosed } from '../constants/status'
import { addDays, todayInDhaka } from './reports'

/** Team role that does field work. Tasks can only be assigned to people holding it. */
export const FIELD_ROLE = 'Field Coordinator'

export const isFieldCoordinator = (member) => member?.role === FIELD_ROLE

export const assignableMembers = (members) => members.filter(isFieldCoordinator)

export function isTaskOverdue(task) {
  if (!task.dueDate || isTaskClosed(task)) return false
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return new Date(`${task.dueDate}T00:00:00`) < today
}

/** Whole days from today to the deadline; negative once it has passed. Uses the same local day as `isTaskOverdue`. */
export function daysUntilDue(dueDate) {
  if (!dueDate) return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Math.round((new Date(`${dueDate}T00:00:00`) - today) / 86400000)
}

/** Deadline phrased relative to today for open work; falls back to the date when it is more than a week away. */
export function relativeDue(task) {
  const days = daysUntilDue(task.dueDate)
  if (days === null) return task.due
  if (days === 0) return 'Due today'
  if (days === 1) return 'Due tomorrow'
  if (days > 1) return days <= 7 ? `Due in ${days} days` : `Due ${task.due}`
  return `${-days} ${days === -1 ? 'day' : 'days'} overdue`
}

const PRIORITY_RANK = { Urgent: 0, High: 1, Medium: 2, Low: 3 }

export const TASK_SORTS = { due: 'Due date', priority: 'Priority', cost: 'Estimate', recent: 'Newest' }

export function sortTasks(tasks, sort) {
  const byDue = (a, b) => (a.dueDate ?? '').localeCompare(b.dueDate ?? '')
  const list = [...tasks]
  if (sort === 'priority') return list.sort((a, b) => (PRIORITY_RANK[a.priority] ?? 9) - (PRIORITY_RANK[b.priority] ?? 9) || byDue(a, b))
  if (sort === 'cost') return list.sort((a, b) => (Number(b.estimatedCost) || 0) - (Number(a.estimatedCost) || 0))
  if (sort === 'recent') return list.sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''))
  return list.sort(byDue)
}

/** One-click views over open work; they combine with the site, assignee and stage filters. */
export const TASK_QUICK_VIEWS = [
  { id: 'overdue', label: 'Overdue', test: isTaskOverdue },
  { id: 'week', label: 'Due in 7 days', test: (task) => { const days = daysUntilDue(task.dueDate); return !isTaskClosed(task) && days !== null && days >= 0 && days <= 7 } },
  { id: 'high', label: 'High priority', test: (task) => !isTaskClosed(task) && (task.priority === 'High' || task.priority === 'Urgent') },
]

/** Short deadline label that stays correct as days pass. */
export function dueLabel(dueDate) {
  const today = todayInDhaka()
  if (dueDate === today) return 'Today'
  if (dueDate === addDays(today, 1)) return 'Tomorrow'
  return formatTaskDate(dueDate)
}

export function formatTaskDate(dateValue) {
  return new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short' })
    .format(new Date(`${dateValue}T12:00:00`))
}

export function createActivity(action, actor) {
  return {
    id: `history-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    action,
    actor,
    at: new Date().toISOString(),
    time: new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date()),
  }
}

import { isTaskClosed } from '../constants/status'
import { addDays, todayInDhaka } from './reports'

export function isTaskOverdue(task) {
  if (!task.dueDate || isTaskClosed(task)) return false
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return new Date(`${task.dueDate}T00:00:00`) < today
}

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

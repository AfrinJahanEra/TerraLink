export function isTaskOverdue(task) {
  if (!task.dueDate || task.status === 'reported_complete') return false
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return new Date(`${task.dueDate}T00:00:00`) < today
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
    time: new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date()),
  }
}

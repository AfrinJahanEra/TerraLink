import { isTaskClosed } from '../constants/status'
import { MEETING_TYPES } from '../data/schedule'
import { isTaskOverdue } from './tasks'

function pad(value) {
  return String(value).padStart(2, '0')
}

export function toDateKey(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export function todayKey() {
  return toDateKey(new Date())
}

export function parseDateKey(key) {
  return new Date(`${key}T12:00:00`)
}

export function addDaysToKey(key, days) {
  const date = parseDateKey(key)
  date.setDate(date.getDate() + days)
  return toDateKey(date)
}

export function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

export function shiftMonth(date, delta) {
  return new Date(date.getFullYear(), date.getMonth() + delta, 1)
}

/** Six-week grid starting on Sunday, the first day of the Bangladesh work week. */
export function getMonthGrid(monthDate) {
  const first = startOfMonth(monthDate)
  return Array.from({ length: 42 }, (_, index) => toDateKey(new Date(first.getFullYear(), first.getMonth(), index + 1 - first.getDay())))
}

export function formatMonthLabel(date) {
  return new Intl.DateTimeFormat('en-GB', { month: 'long', year: 'numeric' }).format(date)
}

export function formatDateLabel(key) {
  return new Intl.DateTimeFormat('en-GB', { weekday: 'short', day: '2-digit', month: 'short' }).format(parseDateKey(key))
}

export function formatLongDate(key) {
  return new Intl.DateTimeFormat('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(parseDateKey(key))
}

export function endTime(startTime, minutes) {
  const [hours, mins] = String(startTime || '00:00').split(':').map(Number)
  const total = (hours * 60 + mins + Number(minutes || 0)) % 1440
  return `${pad(Math.floor(total / 60))}:${pad(total % 60)}`
}

export function formatTimeRange(meeting) {
  return `${meeting.startTime} – ${endTime(meeting.startTime, meeting.durationMinutes)}`
}

export function formatDuration(minutes) {
  const hours = Math.floor(Number(minutes) / 60)
  const rest = Number(minutes) % 60
  if (!hours) return `${rest} min`
  return rest ? `${hours} h ${rest} min` : `${hours} h`
}

export function buildScheduleItems({ meetings, tasks = [] }) {
  const meetingItems = meetings.map((meeting) => ({
    id: meeting.id,
    kind: 'meeting',
    date: meeting.date,
    time: meeting.startTime,
    title: meeting.title,
    label: MEETING_TYPES[meeting.type]?.label ?? 'Meeting',
    status: meeting.status,
    record: meeting,
  }))
  const deadlineItems = tasks
    .filter((task) => task.dueDate && !isTaskClosed(task))
    .map((task) => ({
      id: `deadline-${task.id}`,
      kind: 'deadline',
      date: task.dueDate,
      time: '',
      title: task.title,
      label: `${task.id} deadline`,
      status: isTaskOverdue(task) ? 'overdue' : 'open',
      record: task,
    }))
  return [...meetingItems, ...deadlineItems].sort((a, b) => a.date.localeCompare(b.date) || (a.time || '99').localeCompare(b.time || '99'))
}

export function itemDotClass(item) {
  if (item.kind === 'deadline') return item.status === 'overdue' ? 'bg-amber-500' : 'bg-slate-400'
  if (item.status === 'completed') return 'bg-brand-800'
  if (item.status === 'cancelled') return 'bg-slate-300'
  return 'bg-brand-500'
}

export function groupItemsByDate(items) {
  return items.reduce((groups, item) => {
    const list = groups.get(item.date) ?? []
    list.push(item)
    groups.set(item.date, list)
    return groups
  }, new Map())
}


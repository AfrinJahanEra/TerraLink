/** Deep links that notification emails and calendar events point back to. */
export function getTaskLink(task) {
  return `${window.location.origin}/tasks?task=${encodeURIComponent(task.id)}`
}

export function getMeetingLink(meeting) {
  return `${window.location.origin}/schedule?meeting=${encodeURIComponent(meeting.id)}`
}

export function getReportsLink() {
  return `${window.location.origin}/reports`
}

export function formatShortDate(value) {
  if (!value) return ''
  const date = new Date(value.length === 10 ? `${value}T12:00:00` : value)
  return new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'Asia/Dhaka' }).format(date)
}

export function formatDateTime(value) {
  return new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Dhaka' }).format(new Date(value))
}

export function addDays(isoDate, days) {
  const date = new Date(`${isoDate}T00:00:00Z`)
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}

/** Sample records were written for 9 Oct 2026. Shifting them keeps deadlines and meetings meaningful on whatever day the demo runs. */
export function relativeToToday(isoDate) {
  const days = Math.round((Date.parse(`${isoDate}T00:00:00Z`) - Date.parse('2026-10-09T00:00:00Z')) / 86400000)
  return addDays(todayInDhaka(), days)
}

export function todayInDhaka() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Dhaka' }).format(new Date())
}

export function formatCoordinates(report) {
  return `${report.latitude.toFixed(5)}, ${report.longitude.toFixed(5)}`
}

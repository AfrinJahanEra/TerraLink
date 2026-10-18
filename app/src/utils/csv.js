function escapeCell(value) {
  const text = String(value ?? '')
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text
}

/**
 * A date that Excel shows as written, e.g. 18 Oct 2026. A bare 2026-10-18 is turned into a date value,
 * which shows as ######## in a narrow column; written as ="18 Oct 2026" it stays readable text.
 */
export function csvDate(value) {
  if (!value) return ''
  const date = new Date(String(value).length === 10 ? `${value}T12:00:00` : value)
  if (Number.isNaN(date.getTime())) return String(value)
  return `="${new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).format(date)}"`
}

export function downloadCsv(filename, rows) {
  const csv = rows.map((row) => row.map(escapeCell).join(',')).join('\r\n')
  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 0)
}

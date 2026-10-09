const GOOGLE_SCRIPT_ID = 'google-identity-services'
const TOKEN_KEY = 'terralink.google.calendar.token'
const CALENDAR_SCOPE = 'https://www.googleapis.com/auth/calendar.events'

let scriptPromise

function getClientId() {
  return import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim()
}

function loadGoogleIdentityServices() {
  if (window.google?.accounts?.oauth2) return Promise.resolve(window.google)
  if (scriptPromise) return scriptPromise

  scriptPromise = new Promise((resolve, reject) => {
    const existing = document.getElementById(GOOGLE_SCRIPT_ID)
    const script = existing ?? document.createElement('script')
    script.id = GOOGLE_SCRIPT_ID
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    script.onload = () => resolve(window.google)
    script.onerror = () => reject(new Error('Google Identity Services could not be loaded.'))
    if (!existing) document.head.appendChild(script)
  })

  return scriptPromise
}

function readToken() {
  try {
    const token = JSON.parse(window.sessionStorage.getItem(TOKEN_KEY))
    if (!token?.accessToken || Number(token.expiresAt) <= Date.now()) return null
    return token
  } catch {
    return null
  }
}

function saveToken(response) {
  const token = {
    accessToken: response.access_token,
    expiresAt: Date.now() + Number(response.expires_in ?? 3600) * 1000 - 60_000,
  }
  window.sessionStorage.setItem(TOKEN_KEY, JSON.stringify(token))
  return token
}

export function getGoogleCalendarConfiguration() {
  const clientId = getClientId()
  return {
    configured: Boolean(clientId),
    connected: Boolean(readToken()),
    clientId,
    missing: clientId ? [] : ['VITE_GOOGLE_CLIENT_ID'],
  }
}

export async function connectGoogleCalendar() {
  const clientId = getClientId()
  if (!clientId) throw new Error('Google Calendar is not configured. Missing VITE_GOOGLE_CLIENT_ID.')
  const google = await loadGoogleIdentityServices()

  return new Promise((resolve, reject) => {
    const client = google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: CALENDAR_SCOPE,
      callback: (response) => {
        if (response.error) {
          reject(new Error(response.error_description || response.error))
          return
        }
        resolve(saveToken(response))
      },
      error_callback: (error) => reject(new Error(error.message || error.type || 'Google authorization failed.')),
    })
    client.requestAccessToken({ prompt: readToken() ? '' : 'consent' })
  })
}

export function disconnectGoogleCalendar() {
  const token = readToken()
  window.sessionStorage.removeItem(TOKEN_KEY)
  if (token?.accessToken && window.google?.accounts?.oauth2) {
    window.google.accounts.oauth2.revoke(token.accessToken, () => {})
  }
}

function addDays(dateText, days) {
  const date = new Date(`${dateText}T00:00:00`)
  date.setDate(date.getDate() + days)
  return date.toISOString().slice(0, 10)
}

function compactDate(dateText) {
  return dateText.replaceAll('-', '')
}

function taskUrl(task) {
  return `${window.location.origin}/tasks?task=${encodeURIComponent(task.id)}`
}

export function createGoogleCalendarLink(task) {
  const endDate = addDays(task.dueDate, 1)
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: `[${task.id}] ${task.title}`,
    dates: `${compactDate(task.dueDate)}/${compactDate(endDate)}`,
    details: `${task.description}\n\nAssignee: ${task.assignee}\nTask: ${taskUrl(task)}`,
    location: task.site,
  })
  return `https://calendar.google.com/calendar/render?${params.toString()}`
}

export async function createDeadlineEvent(task) {
  const token = readToken()
  if (!token) throw new Error('Connect Google Calendar before creating direct events.')

  const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token.accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      summary: `[${task.id}] ${task.title}`,
      description: `${task.description}\n\nAssignee: ${task.assignee}\nTerraLink task: ${taskUrl(task)}`,
      location: task.site,
      start: { date: task.dueDate },
      end: { date: addDays(task.dueDate, 1) },
      reminders: {
        useDefault: false,
        overrides: [{ method: 'popup', minutes: 1440 }],
      },
      extendedProperties: { private: { terralinkTaskId: task.id } },
    }),
  })

  if (!response.ok) {
    if (response.status === 401) window.sessionStorage.removeItem(TOKEN_KEY)
    const body = await response.json().catch(() => null)
    throw new Error(body?.error?.message || `Google Calendar returned status ${response.status}.`)
  }

  return response.json()
}

function escapeIcs(value) {
  return String(value ?? '')
    .replaceAll('\\', '\\\\')
    .replaceAll('\n', '\\n')
    .replaceAll(',', '\\,')
    .replaceAll(';', '\\;')
}

export function buildDeadlineIcs(task) {
  const stamp = new Date().toISOString().replaceAll(/[-:]/g, '').replace(/\.\d{3}/, '')
  const start = compactDate(task.dueDate)
  const end = compactDate(addDays(task.dueDate, 1))
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//TerraLink//Deadline//EN',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:${escapeIcs(task.id)}@terralink.local`,
    `DTSTAMP:${stamp}`,
    `DTSTART;VALUE=DATE:${start}`,
    `DTEND;VALUE=DATE:${end}`,
    `SUMMARY:${escapeIcs(`[${task.id}] ${task.title}`)}`,
    `DESCRIPTION:${escapeIcs(`${task.description}\nAssignee: ${task.assignee}\n${taskUrl(task)}`)}`,
    `LOCATION:${escapeIcs(task.site)}`,
    'BEGIN:VALARM',
    'TRIGGER:-P1D',
    'ACTION:DISPLAY',
    'DESCRIPTION:TerraLink task deadline tomorrow',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n')
}

export function downloadDeadlineIcs(task) {
  const blob = new Blob([buildDeadlineIcs(task)], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `${task.id.toLowerCase()}-deadline.ics`
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 0)
}

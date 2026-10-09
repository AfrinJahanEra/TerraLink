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

/** Bangladesh does not observe daylight saving time, so a fixed offset is exact. */
const DHAKA_OFFSET = '+06:00'
const DHAKA_TIME_ZONE = 'Asia/Dhaka'

function addDays(dateText, days) {
  const date = new Date(`${dateText}T12:00:00`)
  date.setDate(date.getDate() + days)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function compactDate(dateText) {
  return dateText.replaceAll('-', '')
}

function utcStamp(date) {
  return date.toISOString().replaceAll(/[-:]/g, '').replace(/\.\d{3}/, '')
}

function eventWindow(event) {
  if (event.allDay) return { allDay: true, start: event.date, end: addDays(event.date, 1) }
  const start = new Date(`${event.date}T${event.startTime}:00${DHAKA_OFFSET}`)
  const end = new Date(start.getTime() + Number(event.durationMinutes || 60) * 60_000)
  return { allDay: false, start, end }
}

function recordUrl(path) {
  return `${window.location.origin}${path}`
}

export function taskToCalendarEvent(task) {
  return {
    uid: `${task.id.toLowerCase()}-deadline`,
    title: `[${task.id}] Deadline: ${task.title}`,
    description: `${task.description}\n\nAssignee: ${task.assignee}\nTerraLink task: ${recordUrl(`/tasks?task=${encodeURIComponent(task.id)}`)}`,
    location: task.site,
    date: task.dueDate,
    allDay: true,
    reminderMinutes: 1440,
    recordId: task.id,
  }
}

export function meetingToCalendarEvent(meeting, { attendees = [], site, typeLabel = 'Meeting', reminderMinutes = 60 } = {}) {
  const lines = [
    `${typeLabel} organised by ${meeting.organizer}`,
    meeting.agenda && `\nAgenda: ${meeting.agenda}`,
    attendees.length && `\nAttendees: ${attendees.map((member) => member.name).join(', ')}`,
    site && `Site: ${site.name}, ${site.location}`,
    meeting.taskId && `Linked task: ${meeting.taskId}`,
    `\nTerraLink record: ${recordUrl(`/schedule?meeting=${encodeURIComponent(meeting.id)}`)}`,
  ].filter(Boolean)
  return {
    uid: meeting.id.toLowerCase(),
    title: meeting.title,
    description: lines.join('\n'),
    location: meeting.location,
    date: meeting.date,
    startTime: meeting.startTime,
    durationMinutes: meeting.durationMinutes,
    attendees: attendees.map((member) => member.email).filter(Boolean),
    reminderMinutes,
    recordId: meeting.id,
  }
}

export function createCalendarEventLink(event) {
  const range = eventWindow(event)
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    dates: range.allDay
      ? `${compactDate(range.start)}/${compactDate(range.end)}`
      : `${utcStamp(range.start)}/${utcStamp(range.end)}`,
    details: event.description ?? '',
    location: event.location ?? '',
  })
  if (!range.allDay) params.set('ctz', DHAKA_TIME_ZONE)
  if (event.attendees?.length) params.set('add', event.attendees.join(','))
  return `https://calendar.google.com/calendar/render?${params.toString()}`
}

export async function insertCalendarEvent(event) {
  const token = readToken()
  if (!token) throw new Error('Connect Google Calendar before creating direct events.')
  const range = eventWindow(event)

  const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token.accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      summary: event.title,
      description: event.description,
      location: event.location,
      start: range.allDay ? { date: range.start } : { dateTime: range.start.toISOString(), timeZone: DHAKA_TIME_ZONE },
      end: range.allDay ? { date: range.end } : { dateTime: range.end.toISOString(), timeZone: DHAKA_TIME_ZONE },
      attendees: event.attendees?.map((email) => ({ email })),
      reminders: {
        useDefault: false,
        overrides: [{ method: 'popup', minutes: event.reminderMinutes ?? 60 }],
      },
      extendedProperties: { private: { terralinkRecordId: event.recordId ?? event.uid } },
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

export function buildEventIcs(event) {
  const range = eventWindow(event)
  const reminder = Number(event.reminderMinutes ?? 60)
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//TerraLink//Workspace//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${escapeIcs(event.uid)}@terralink.local`,
    `DTSTAMP:${utcStamp(new Date())}`,
    range.allDay ? `DTSTART;VALUE=DATE:${compactDate(range.start)}` : `DTSTART:${utcStamp(range.start)}`,
    range.allDay ? `DTEND;VALUE=DATE:${compactDate(range.end)}` : `DTEND:${utcStamp(range.end)}`,
    `SUMMARY:${escapeIcs(event.title)}`,
    `DESCRIPTION:${escapeIcs(event.description)}`,
    `LOCATION:${escapeIcs(event.location)}`,
    ...(event.attendees ?? []).map((email) => `ATTENDEE;ROLE=REQ-PARTICIPANT:mailto:${email}`),
    'BEGIN:VALARM',
    reminder % 1440 === 0 ? `TRIGGER:-P${reminder / 1440}D` : `TRIGGER:-PT${reminder}M`,
    'ACTION:DISPLAY',
    `DESCRIPTION:${escapeIcs(`Reminder: ${event.title}`)}`,
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n')
}

export function downloadEventIcs(event) {
  const blob = new Blob([buildEventIcs(event)], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `${event.uid}.ics`
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 0)
}

export function createGoogleCalendarLink(task) {
  return createCalendarEventLink(taskToCalendarEvent(task))
}

export function createDeadlineEvent(task) {
  return insertCalendarEvent(taskToCalendarEvent(task))
}

export function downloadDeadlineIcs(task) {
  downloadEventIcs(taskToCalendarEvent(task))
}

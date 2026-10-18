import { getAppUrl } from './links'

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

/** Loads Google's sign-in script ahead of a click, so the sign-in popup can open the moment the click happens. */
export function prepareGoogleSignIn() {
  return getClientId() ? loadGoogleIdentityServices().catch(() => undefined) : Promise.resolve()
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
  return `${getAppUrl()}${path}`
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

/**
 * Creates the event in the signed-in user's Google Calendar. With `meet` it also creates a Google Meet link;
 * with `notify` Google emails every attendee its own invitation and puts the event in their calendar.
 */
export async function insertCalendarEvent(event, { meet = false, notify = false } = {}) {
  const token = readToken()
  if (!token) throw new Error('Connect Google Calendar before creating direct events.')
  const range = eventWindow(event)
  const query = new URLSearchParams({ ...(meet ? { conferenceDataVersion: '1' } : {}), sendUpdates: notify ? 'all' : 'none' })

  const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events?${query}`, {
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
      ...(meet ? { conferenceData: { createRequest: { requestId: `${event.uid}-${Date.now()}`, conferenceSolutionKey: { type: 'hangoutsMeet' } } } } : {}),
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

/**
 * An iCalendar invitation (METHOD:REQUEST) from `organizer` to `attendees` ({ name, email }).
 * Sent with an email, Gmail and Outlook show it as an event card with Yes / Maybe / No and add it to the calendar.
 */
export function buildInviteIcs(event, { organizer, attendees = [], url = '' }) {
  const range = eventWindow(event)
  const reminder = Number(event.reminderMinutes ?? 60)
  // Parameters come before the address: ATTENDEE;CN="Name";RSVP=TRUE:mailto:someone@example.com
  const cn = (name) => `CN="${String(name || 'TerraLink').replaceAll('"', '')}"`
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//TerraLink//Workspace//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:REQUEST',
    'BEGIN:VEVENT',
    `UID:${escapeIcs(event.uid)}@terralink.app`,
    `DTSTAMP:${utcStamp(new Date())}`,
    range.allDay ? `DTSTART;VALUE=DATE:${compactDate(range.start)}` : `DTSTART:${utcStamp(range.start)}`,
    range.allDay ? `DTEND;VALUE=DATE:${compactDate(range.end)}` : `DTEND:${utcStamp(range.end)}`,
    `SUMMARY:${escapeIcs(event.title)}`,
    `DESCRIPTION:${escapeIcs(event.description)}`,
    `LOCATION:${escapeIcs(event.location)}`,
    url && `URL:${url}`,
    `ORGANIZER;${cn(organizer.name)}:mailto:${organizer.email}`,
    ...attendees.filter((item) => item.email).map((item) => `ATTENDEE;${cn(item.name || item.email)};ROLE=REQ-PARTICIPANT;PARTSTAT=NEEDS-ACTION;RSVP=TRUE:mailto:${item.email}`),
    'SEQUENCE:0',
    'STATUS:CONFIRMED',
    'BEGIN:VALARM',
    reminder % 1440 === 0 ? `TRIGGER:-P${reminder / 1440}D` : `TRIGGER:-PT${reminder}M`,
    'ACTION:DISPLAY',
    `DESCRIPTION:${escapeIcs(`Reminder: ${event.title}`)}`,
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].filter(Boolean).join('\r\n')
}


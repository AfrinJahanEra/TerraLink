import { relativeToToday } from '../utils/reports'

export const MEETING_TYPES = {
  field_visit: { label: 'Field visit', defaultDuration: 180, defaultLocation: 'Site location', reminderMinutes: 1440 },
  review_meeting: { label: 'Review meeting', defaultDuration: 60, defaultLocation: 'Project office, Dhaka', reminderMinutes: 60 },
  report_briefing: { label: 'Report briefing', defaultDuration: 45, defaultLocation: 'Google Meet', reminderMinutes: 60 },
  budget_review: { label: 'Budget review', defaultDuration: 60, defaultLocation: 'Finance room, project office', reminderMinutes: 60 },
  team_sync: { label: 'Team sync', defaultDuration: 30, defaultLocation: 'Google Meet', reminderMinutes: 30 },
}

export const MEETING_STATUS = {
  scheduled: { label: 'Scheduled', tone: 'sky' },
  completed: { label: 'Completed', tone: 'emerald' },
  cancelled: { label: 'Cancelled', tone: 'slate' },
}

export const CALENDAR_STATUS = {
  synced: 'Synced to Google Calendar',
  link: 'Opened in Google Calendar',
  ics: 'Calendar file downloaded',
  none: 'Not added to a calendar',
}

export const DURATION_OPTIONS = [30, 45, 60, 90, 120, 180, 240]

const seedMeetings = [
  {
    id: 'MTG-001', title: 'Ramna Lake cleanup follow-up visit', type: 'field_visit', date: '2026-10-12', startTime: '09:30', durationMinutes: 120, location: 'Ramna Lake, north bank', siteId: 'ramna-lake', taskId: '', attendeeIds: ['member-nusrat', 'member-rahim'], agenda: 'Walk the cleaned stretch with the field team, check for new dumping and photograph the bank.', organizer: 'Nusrat Jahan', status: 'scheduled', calendarStatus: 'none', calendarUrl: '', createdAt: '2026-10-17T09:00:00.000Z',
  },
  {
    id: 'MTG-002', title: 'Weekly field team review', type: 'review_meeting', date: '2026-10-14', startTime: '11:00', durationMinutes: 60, location: 'Project office, Dhaka', siteId: '', taskId: '', attendeeIds: ['member-nusrat', 'member-rahim', 'member-maliha', 'member-imran'], agenda: 'Progress on open tasks, blocked work, and next week’s site visits.', organizer: 'Nusrat Jahan', status: 'scheduled', calendarStatus: 'none', calendarUrl: '', createdAt: '2026-10-17T09:00:00.000Z',
  },
  {
    id: 'MTG-003', title: 'October budget review', type: 'budget_review', date: '2026-10-19', startTime: '15:00', durationMinutes: 60, location: 'Finance room, project office', siteId: '', taskId: '', attendeeIds: ['member-nusrat', 'member-farzana', 'member-sadia'], agenda: 'Review spending against each lake’s allocation and approve pending expenses.', organizer: 'Nusrat Jahan', status: 'scheduled', calendarStatus: 'none', calendarUrl: '', createdAt: '2026-10-17T09:00:00.000Z',
  },
]

export const initialMeetings = seedMeetings.map((meeting) => ({ ...meeting, date: relativeToToday(meeting.date) }))

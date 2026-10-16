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
    id: 'MTG-005', title: 'Budget variance review', type: 'budget_review', date: '2026-10-20', startTime: '10:00', durationMinutes: 60, location: 'Finance room, project office', siteId: '', taskId: '', attendeeIds: ['member-nusrat', 'member-farzana', 'member-sadia'], agenda: 'Review site-level variance, pending commitments, and approval of further field costs.', organizer: 'Nusrat Jahan', status: 'scheduled', calendarStatus: 'none', calendarUrl: '', createdAt: '2026-10-08T10:00:00.000Z',
  },
  {
    id: 'MTG-004', title: 'September monitoring report briefing', type: 'report_briefing', date: '2026-10-15', startTime: '15:00', durationMinutes: 45, location: 'Google Meet', siteId: '', taskId: '', attendeeIds: ['member-nusrat', 'member-sadia', 'member-farzana'], agenda: 'Walk through the September report, open decisions, and the cost summary before submission.', organizer: 'Nusrat Jahan', status: 'scheduled', calendarStatus: 'none', calendarUrl: '', createdAt: '2026-10-07T12:30:00.000Z',
  },
  {
    id: 'MTG-003', title: 'Weekly review meeting', type: 'review_meeting', date: '2026-10-12', startTime: '11:00', durationMinutes: 60, location: 'Project office, Dhaka', siteId: '', taskId: '', attendeeIds: ['member-nusrat', 'member-rahim', 'member-sadia', 'member-tanvir'], agenda: 'Confirm Gulshan–Baridhara Lake and Hatirjheel Lake review decisions and assign follow-up checks.', organizer: 'Nusrat Jahan', status: 'scheduled', calendarStatus: 'none', calendarUrl: '', createdAt: '2026-10-06T09:15:00.000Z',
  },
  {
    id: 'MTG-002', title: 'Gulshan–Baridhara Lake field verification visit', type: 'field_visit', date: '2026-10-10', startTime: '09:30', durationMinutes: 180, location: 'Gulshan–Baridhara Lake, Gulshan', siteId: 'gulshan-baridhara-lake', taskId: 'TL-104', attendeeIds: ['member-rahim', 'member-tanvir'], agenda: 'Collect geotagged photographs along the eastern edge and record local observations.', organizer: 'Nusrat Jahan', status: 'scheduled', calendarStatus: 'none', calendarUrl: '', createdAt: '2026-10-08T09:10:00.000Z',
  },
  {
    id: 'MTG-001', title: 'Hatirjheel Lake boundary consultation', type: 'field_visit', date: '2026-10-07', startTime: '10:00', durationMinutes: 120, location: 'Hatirjheel Lake, Tejgaon–Rampura', siteId: 'hatirjheel', taskId: 'TL-099', attendeeIds: ['member-sadia', 'member-rahim'], agenda: 'Review boundary reference points with community representatives.', organizer: 'Nusrat Jahan', status: 'completed', calendarStatus: 'none', calendarUrl: '', createdAt: '2026-10-02T11:45:00.000Z',
  },
]

export const initialMeetings = seedMeetings.map((meeting) => ({ ...meeting, date: relativeToToday(meeting.date) }))

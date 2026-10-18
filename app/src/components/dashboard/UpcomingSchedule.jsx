import { CalendarDays, ExternalLink } from 'lucide-react'
import { useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useMeeting } from '../../hooks/useMeeting'
import { addDaysToKey, buildScheduleItems, todayKey } from '../../utils/schedule'
import { AgendaList } from '../schedule/AgendaList'

const LOOKAHEAD_DAYS = 14
const GOOGLE_CALENDAR = 'https://calendar.google.com/calendar/r'

export function UpcomingSchedule({ meetings, tasks = [], maxItems = 6, subtitle = `Meetings, field visits, and deadlines in the next ${LOOKAHEAD_DAYS} days` }) {
  const navigate = useNavigate()
  const { openMeeting, canMeet } = useMeeting()

  const { items, overdueCount, hiddenCount } = useMemo(() => {
    const today = todayKey()
    const horizon = addDaysToKey(today, LOOKAHEAD_DAYS)
    const all = buildScheduleItems({ meetings: meetings.filter((meeting) => meeting.status === 'scheduled'), tasks })
    const upcoming = all.filter((item) => item.date >= today && item.date <= horizon)
    return {
      items: upcoming.slice(0, maxItems),
      hiddenCount: Math.max(upcoming.length - maxItems, 0),
      overdueCount: all.filter((item) => item.kind === 'deadline' && item.status === 'overdue').length,
    }
  }, [maxItems, meetings, tasks])

  function openItem(item) {
    // Meetings live in Google Calendar: open the Meet call, or the calendar event for older records.
    if (item.kind === 'meeting') window.open(item.record.meetUrl || item.record.calendarUrl || GOOGLE_CALENDAR, '_blank', 'noopener,noreferrer')
    else navigate(`/tasks?task=${item.record.id}`)
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white shadow-card">
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-600"><CalendarDays size={17} /></span>
          <div><h2 className="text-sm font-semibold text-slate-900">Upcoming schedule</h2><p className="mt-0.5 text-xs text-slate-400">{subtitle}</p></div>
        </div>
        <a href={GOOGLE_CALENDAR} target="_blank" rel="noreferrer" className="inline-flex shrink-0 items-center gap-1 text-[11px] font-semibold text-brand-700 hover:text-brand-900">Google Calendar <ExternalLink size={12} className="text-slate-500" /></a>
      </div>
      <AgendaList items={items} onOpenItem={openItem} compact emptyText="Nothing is scheduled for the next two weeks." />
      {(overdueCount > 0 || hiddenCount > 0 || canMeet) && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-slate-100 px-5 py-3 text-[11px]">
          {overdueCount > 0 && <Link to="/tasks" className="font-semibold text-amber-700 hover:text-amber-800">{overdueCount} overdue {overdueCount === 1 ? 'deadline' : 'deadlines'}</Link>}
          {hiddenCount > 0 && <a href={GOOGLE_CALENDAR} target="_blank" rel="noreferrer" className="text-slate-500 hover:text-slate-800">{hiddenCount} more in Google Calendar</a>}
          {canMeet && <button type="button" onClick={() => openMeeting()} className="ml-auto font-semibold text-brand-700 hover:text-brand-900">Create a meeting</button>}
        </div>
      )}
    </section>
  )
}

import { ArrowRight, CalendarDays } from 'lucide-react'
import { useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { addDaysToKey, buildScheduleItems, todayKey } from '../../utils/schedule'
import { AgendaList } from '../schedule/AgendaList'

const LOOKAHEAD_DAYS = 14

export function UpcomingSchedule({ meetings, tasks = [], canSchedule = false, maxItems = 6, subtitle = `Meetings, field visits, and deadlines in the next ${LOOKAHEAD_DAYS} days` }) {
  const navigate = useNavigate()

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
    navigate(item.kind === 'meeting' ? `/schedule?meeting=${item.id}` : `/tasks?task=${item.record.id}`)
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white shadow-card">
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-600"><CalendarDays size={17} /></span>
          <div><h2 className="text-sm font-semibold text-slate-900">Upcoming schedule</h2><p className="mt-0.5 text-xs text-slate-400">{subtitle}</p></div>
        </div>
        <Link to="/schedule" className="inline-flex shrink-0 items-center gap-1 text-[11px] font-semibold text-brand-700 hover:text-brand-900">Open schedule <ArrowRight size={13} className="text-slate-500" /></Link>
      </div>
      <AgendaList items={items} onOpenItem={openItem} compact emptyText="Nothing is scheduled for the next two weeks." />
      {(overdueCount > 0 || hiddenCount > 0 || canSchedule) && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-slate-100 px-5 py-3 text-[11px]">
          {overdueCount > 0 && <Link to="/tasks" className="font-semibold text-amber-700 hover:text-amber-800">{overdueCount} overdue {overdueCount === 1 ? 'deadline' : 'deadlines'}</Link>}
          {hiddenCount > 0 && <Link to="/schedule" className="text-slate-500 hover:text-slate-800">{hiddenCount} more in the schedule</Link>}
          {canSchedule && <Link to="/schedule?new=review_meeting" className="ml-auto font-semibold text-brand-700 hover:text-brand-900">Schedule a meeting</Link>}
        </div>
      )}
    </section>
  )
}

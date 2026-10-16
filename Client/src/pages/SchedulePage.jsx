import { isTaskClosed } from '../constants/status'
import { CalendarDays, CalendarPlus, ChevronLeft, ChevronRight, List, Plus } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { AgendaList } from '../components/schedule/AgendaList'
import { MeetingDrawer } from '../components/schedule/MeetingDrawer'
import { MeetingFormModal } from '../components/schedule/MeetingFormModal'
import { MonthCalendar } from '../components/schedule/MonthCalendar'
import { Button } from '../components/ui/Button'
import { PageHeader } from '../components/ui/PageHeader'
import { SummaryStrip } from '../components/ui/SummaryStrip'
import { Toast } from '../components/ui/Toast'
import { MEETING_STATUS, MEETING_TYPES } from '../data/schedule'
import { useApp } from '../hooks/useApp'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { useNotice } from '../hooks/useNotice'
import { cn } from '../utils/cn'
import { describeCalendarResult, describeEmailResult } from '../utils/communications'
import {
  addDaysToKey,
  buildScheduleItems,
  formatLongDate,
  formatMonthLabel,
  parseDateKey,
  shiftMonth,
  startOfMonth,
  toDateKey,
  todayKey,
} from '../utils/schedule'
import { isTaskOverdue } from '../utils/tasks'

const legend = [
  ['bg-brand-500', 'Meeting'],
  ['bg-brand-800', 'Completed'],
  ['bg-slate-400', 'Task deadline'],
  ['bg-amber-500', 'Overdue'],
]

export function SchedulePage() {
  const {
    role, can, scope, sites, teamMembers, notificationLogs,
    createMeeting, updateMeeting, addMeetingToCalendar, downloadMeetingIcs, emailMeetingInvites,
  } = useApp()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const today = todayKey()
  const [view, setView] = useLocalStorage('terralink.schedule.view', 'month')
  const [month, setMonth] = useState(() => startOfMonth(parseDateKey(today)))
  const [selectedDate, setSelectedDate] = useState(today)
  const [typeFilter, setTypeFilter] = useState('all')
  const [showDeadlines, setShowDeadlines] = useState(true)
  const [notice, showNotice] = useNotice(4000)
  const canManage = can('schedule.manage')
  const memberId = teamMembers.find((member) => member.name === role.user.name)?.id

  // Scoped already: a coordinator receives only meetings they attend and their own deadlines.
  const visibleMeetings = scope.meetings
  const visibleTasks = scope.tasks
  const items = useMemo(() => {
    const filteredMeetings = typeFilter === 'all' ? visibleMeetings : visibleMeetings.filter((meeting) => meeting.type === typeFilter)
    return buildScheduleItems({ meetings: filteredMeetings, tasks: showDeadlines ? visibleTasks : [] })
  }, [showDeadlines, typeFilter, visibleMeetings, visibleTasks])

  const monthKey = toDateKey(month).slice(0, 7)
  const monthItems = items.filter((item) => item.date.startsWith(monthKey))
  const dayItems = items.filter((item) => item.date === selectedDate)
  const weekEnd = addDaysToKey(today, 7)
  const upcoming = visibleMeetings.filter((meeting) => meeting.status === 'scheduled' && meeting.date >= today)
  const notOnCalendar = upcoming.filter((meeting) => !meeting.calendarStatus || meeting.calendarStatus === 'none')
  const fieldVisits = upcoming.filter((meeting) => meeting.type === 'field_visit' && meeting.date <= addDaysToKey(today, 14))
  const openDeadlines = visibleTasks.filter((task) => !isTaskClosed(task) && task.dueDate)
  const dueThisWeek = openDeadlines.filter((task) => task.dueDate >= today && task.dueDate <= weekEnd)
  const overdue = openDeadlines.filter(isTaskOverdue)

  const meetingParam = searchParams.get('meeting')
  const newParam = searchParams.get('new')
  const selectedMeeting = visibleMeetings.find((meeting) => meeting.id === meetingParam) ?? null
  const formOpen = canManage && Boolean(newParam)
  const formInitial = {
    type: newParam,
    siteId: searchParams.get('site') ?? '',
    taskId: searchParams.get('task') ?? '',
    title: searchParams.get('title') ?? '',
    agenda: searchParams.get('agenda') ?? '',
    date: searchParams.get('date') || undefined,
  }

  function clearParams() {
    setSearchParams({}, { replace: true })
  }

  function openForm(params = {}) {
    setSearchParams({ new: 'review_meeting', ...params })
  }

  function selectDate(key) {
    setSelectedDate(key)
    const date = parseDateKey(key)
    if (date.getMonth() !== month.getMonth() || date.getFullYear() !== month.getFullYear()) setMonth(startOfMonth(date))
  }

  function goToday() {
    setMonth(startOfMonth(parseDateKey(today)))
    setSelectedDate(today)
  }

  function openItem(item) {
    if (item.kind === 'deadline') {
      navigate(`/tasks?task=${encodeURIComponent(item.record.id)}`)
      return
    }
    setSearchParams({ meeting: item.id })
  }

  function handleCreate(draft, options) {
    const highest = scope.meetings.reduce((max, item) => Math.max(max, Number(item.id.replace('MTG-', '')) || 0), 0)
    const meeting = {
      ...draft,
      id: `MTG-${String(highest + 1).padStart(3, '0')}`,
      organizer: role.user.name,
      status: 'scheduled',
      calendarStatus: 'none',
      calendarUrl: '',
      createdAt: new Date().toISOString(),
    }
    createMeeting(meeting)
    setSelectedDate(meeting.date)
    setMonth(startOfMonth(parseDateKey(meeting.date)))
    setSearchParams({ meeting: meeting.id }, { replace: true })
    showNotice(`${meeting.id} scheduled for ${formatLongDate(meeting.date)}.`)

    // The calendar tab must open inside this submit handler to keep the user gesture.
    const calendar = options.addToCalendar ? addMeetingToCalendar(meeting) : Promise.resolve(null)
    const invites = options.emailInvites ? emailMeetingInvites(meeting) : Promise.resolve(null)
    Promise.all([calendar, invites]).then(([calendarResult, inviteLogs]) => {
      const messages = [calendarResult && describeCalendarResult(calendarResult), inviteLogs && describeEmailResult(inviteLogs, 'invitation')].filter(Boolean)
      if (messages.length) showNotice(messages.join(' '))
    })
  }

  function handleStatus(status) {
    updateMeeting(selectedMeeting.id, { status })
    showNotice(`${selectedMeeting.id} marked as ${MEETING_STATUS[status].label.toLowerCase()}.`)
  }

  const viewToggle = (
    <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1 shadow-card">
      <button type="button" onClick={() => setView('month')} className={cn('flex h-8 items-center gap-1.5 rounded-md px-2.5 text-[11px] font-semibold transition', view === 'month' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:bg-slate-50')}><CalendarDays size={14} />Month</button>
      <button type="button" onClick={() => setView('agenda')} className={cn('flex h-8 items-center gap-1.5 rounded-md px-2.5 text-[11px] font-semibold transition', view === 'agenda' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:bg-slate-50')}><List size={14} />Agenda</button>
    </div>
  )

  return (
    <div className="animate-fade-in space-y-5 pb-8">
      <PageHeader
        eyebrow="Field operations"
        title="Schedule & meetings"
        description="Plan field visits, review meetings, and report briefings alongside task deadlines. Each meeting can be added to Google Calendar and shared with attendees."
        actions={canManage && <Button type="button" onClick={() => openForm()}><Plus size={16} />Schedule meeting</Button>}
      />

      <SummaryStrip
        items={[
          { label: 'upcoming meetings', value: upcoming.length },
          { label: 'field visits in 14 days', value: fieldVisits.length },
          { label: 'deadlines this week', value: dueThisWeek.length, tone: dueThisWeek.length ? 'amber' : undefined },
          { label: 'overdue deadlines', value: overdue.length, tone: overdue.length ? 'rose' : undefined },
        ]}
        note={role.id === 'coordinator' ? 'Showing meetings you attend and your own deadlines' : undefined}
      />

      <div className="flex flex-wrap items-center gap-3">
        <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)} aria-label="Meeting type" className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-700 outline-none focus:border-brand-400">
          <option value="all">All meeting types</option>
          {Object.entries(MEETING_TYPES).map(([id, item]) => <option key={id} value={id}>{item.label}</option>)}
        </select>
        <label className="flex cursor-pointer items-center gap-2 text-xs text-slate-600"><input type="checkbox" checked={showDeadlines} onChange={() => setShowDeadlines((value) => !value)} className="accent-slate-700" />Show task deadlines</label>
        <div className="hidden flex-wrap items-center gap-3 text-[10px] text-slate-500 md:flex">
          {legend.map(([dot, label]) => <span key={label} className="flex items-center gap-1.5"><span className={cn('size-2 rounded-full', dot)} />{label}</span>)}
        </div>
        <div className="ml-auto">{viewToggle}</div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        {view === 'month' ? (
          <MonthCalendar
            month={month}
            items={items}
            selectedDate={selectedDate}
            onSelectDate={selectDate}
            onOpenItem={openItem}
            onPrev={() => setMonth((current) => shiftMonth(current, -1))}
            onNext={() => setMonth((current) => shiftMonth(current, 1))}
            onToday={goToday}
          />
        ) : (
          <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-card">
            <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-3.5">
              <div><h2 className="text-sm font-semibold text-slate-900">{formatMonthLabel(month)}</h2><p className="mt-0.5 text-[11px] text-slate-400">{monthItems.length} scheduled items</p></div>
              <div className="flex items-center gap-1">
                <button type="button" onClick={goToday} className="h-8 rounded-lg border border-slate-200 px-3 text-[11px] font-semibold text-slate-600 hover:bg-slate-50">Today</button>
                <button type="button" onClick={() => setMonth((current) => shiftMonth(current, -1))} aria-label="Previous month" className="grid size-8 place-items-center rounded-lg text-slate-500 hover:bg-slate-100"><ChevronLeft size={16} /></button>
                <button type="button" onClick={() => setMonth((current) => shiftMonth(current, 1))} aria-label="Next month" className="grid size-8 place-items-center rounded-lg text-slate-500 hover:bg-slate-100"><ChevronRight size={16} /></button>
              </div>
            </div>
            <AgendaList items={monthItems} onOpenItem={openItem} emptyText="Nothing is scheduled this month." />
          </section>
        )}

        <div className="space-y-5">
          <section className="rounded-xl border border-slate-200 bg-white shadow-card">
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-3.5">
              <div><h2 className="text-sm font-semibold text-slate-900">{selectedDate === today ? 'Today' : 'Selected day'}</h2><p className="mt-0.5 text-[11px] text-slate-400">{formatLongDate(selectedDate)}</p></div>
              {canManage && selectedDate >= today && <button type="button" onClick={() => openForm({ date: selectedDate })} aria-label="Schedule on this day" title="Schedule on this day" className="grid size-8 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800"><CalendarPlus size={16} /></button>}
            </div>
            <AgendaList items={dayItems} onOpenItem={openItem} compact emptyText="Nothing scheduled on this day." />
          </section>

          {canManage && (
            <section className="rounded-xl border border-slate-200 bg-white shadow-card">
              <div className="border-b border-slate-100 px-5 py-3.5"><h2 className="text-sm font-semibold text-slate-900">Not yet on a calendar</h2><p className="mt-0.5 text-[11px] text-slate-400">Upcoming meetings without a calendar entry</p></div>
              {notOnCalendar.length ? (
                <ul className="divide-y divide-slate-100">
                  {notOnCalendar.slice(0, 5).map((meeting) => (
                    <li key={meeting.id} className="flex items-center gap-3 px-5 py-2.5">
                      <div className="min-w-0 flex-1"><p className="truncate text-xs font-medium text-slate-800">{meeting.title}</p><p className="mt-0.5 text-[10px] text-slate-400">{meeting.date} · {meeting.startTime}</p></div>
                      <button type="button" onClick={() => addMeetingToCalendar(meeting).then((result) => showNotice(describeCalendarResult(result)))} className="h-8 shrink-0 rounded-lg border border-slate-200 px-2.5 text-[11px] font-semibold text-slate-700 hover:bg-slate-50">Add</button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="px-5 py-6 text-center text-[11px] text-slate-400">All upcoming meetings are on a calendar.</p>
              )}
            </section>
          )}
        </div>
      </div>

      <MeetingFormModal
        key={searchParams.toString()}
        open={formOpen}
        initial={formInitial}
        sites={sites}
        tasks={scope.tasks}
        members={teamMembers}
        organizerId={memberId}
        onClose={clearParams}
        onCreate={handleCreate}
      />
      {selectedMeeting && (
        <MeetingDrawer
          key={selectedMeeting.id}
          meeting={selectedMeeting}
          role={role}
          members={teamMembers}
          sites={sites}
          tasks={scope.tasks}
          logs={notificationLogs.filter((log) => log.meetingId === selectedMeeting.id)}
          onClose={clearParams}
          onAddToCalendar={() => addMeetingToCalendar(selectedMeeting).then((result) => showNotice(describeCalendarResult(result)))}
          onDownloadIcs={() => { downloadMeetingIcs(selectedMeeting); showNotice('Calendar file downloaded for Outlook, Apple, or Google Calendar.') }}
          onEmailInvites={() => emailMeetingInvites(selectedMeeting).then((logs) => showNotice(describeEmailResult(logs, 'invitation')))}
          onUpdateStatus={handleStatus}
        />
      )}
      <Toast message={notice} />
    </div>
  )
}

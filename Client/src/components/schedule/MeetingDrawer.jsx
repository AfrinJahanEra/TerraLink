import {
  CalendarCheck,
  CalendarDays,
  CalendarX,
  Clock3,
  Download,
  ExternalLink,
  Mail,
  MapPin,
  MessageCircle,
  Radio,
  UserRound,
  X,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { CALENDAR_STATUS, MEETING_STATUS, MEETING_TYPES } from '../../data/schedule'
import { formatDuration, formatLongDate, formatTimeRange } from '../../utils/schedule'
import { CommunicationHistory } from '../communications/CommunicationHistory'
import { Badge } from '../ui/Badge'

function ActionButton({ icon: Icon, children, onClick, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-left text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:pointer-events-none disabled:opacity-50"
    >
      <Icon size={15} className="shrink-0 text-slate-500" />
      <span className="truncate">{children}</span>
    </button>
  )
}

export function MeetingDrawer({ meeting, role, members, sites, tasks, logs, onClose, onAddToCalendar, onDownloadIcs, onEmailInvites, onWhatsApp, onUpdateStatus }) {
  const [sending, setSending] = useState(false)
  const canManage = role.id === 'manager' || role.id === 'operator'
  const type = MEETING_TYPES[meeting.type]
  const status = MEETING_STATUS[meeting.status] ?? MEETING_STATUS.scheduled
  const site = sites.find((item) => item.id === meeting.siteId)
  const task = tasks.find((item) => item.id === meeting.taskId)
  const attendees = members.filter((member) => meeting.attendeeIds.includes(member.id))
  const isScheduled = meeting.status === 'scheduled'
  const calendarLabel = CALENDAR_STATUS[meeting.calendarStatus] ?? CALENDAR_STATUS.none

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  async function sendInvites() {
    setSending(true)
    try {
      await onEmailInvites()
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[1000] bg-slate-950/35 backdrop-blur-[1px]" role="dialog" aria-modal="true" aria-labelledby="meeting-drawer-title">
      <button type="button" className="absolute inset-0 cursor-default" onClick={onClose} aria-label="Close meeting details" />
      <aside className="absolute inset-y-0 right-0 z-10 flex w-full max-w-xl flex-col overflow-hidden border-l border-slate-200 bg-white shadow-pop">
        <div className="flex items-start justify-between border-b border-slate-100 px-5 py-4">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">{meeting.id} · {type?.label ?? 'Meeting'}</p>
            <h2 id="meeting-drawer-title" className="mt-1 truncate text-lg font-semibold text-slate-900">{meeting.title}</h2>
            <div className="mt-2 flex flex-wrap items-center gap-2"><Badge tone={status.tone}>{status.label}</Badge><span className="text-[10px] font-semibold text-slate-500">{calendarLabel}</span></div>
          </div>
          <button type="button" onClick={onClose} aria-label="Close meeting details" className="grid size-9 shrink-0 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800"><X size={18} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          <dl className="grid gap-3 text-xs sm:grid-cols-2">
            <div className="flex items-start gap-2"><CalendarDays size={15} className="mt-0.5 shrink-0 text-slate-500" /><div><dt className="text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-400">Date</dt><dd className="mt-0.5 font-medium text-slate-700">{formatLongDate(meeting.date)}</dd></div></div>
            <div className="flex items-start gap-2"><Clock3 size={15} className="mt-0.5 shrink-0 text-slate-500" /><div><dt className="text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-400">Time (Asia/Dhaka)</dt><dd className="mt-0.5 font-medium text-slate-700">{formatTimeRange(meeting)} · {formatDuration(meeting.durationMinutes)}</dd></div></div>
            <div className="flex items-start gap-2"><MapPin size={15} className="mt-0.5 shrink-0 text-slate-500" /><div><dt className="text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-400">Location</dt><dd className="mt-0.5 font-medium text-slate-700">{meeting.location}</dd></div></div>
            <div className="flex items-start gap-2"><UserRound size={15} className="mt-0.5 shrink-0 text-slate-500" /><div><dt className="text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-400">Organiser</dt><dd className="mt-0.5 font-medium text-slate-700">{meeting.organizer}</dd></div></div>
          </dl>

          {meeting.agenda && <p className="mt-4 rounded-lg bg-slate-50 px-3 py-2.5 text-xs leading-5 text-slate-600">{meeting.agenda}</p>}

          {(site || task) && (
            <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2">
              {site && <Link to={`/sites/${site.id}`} className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-700 hover:text-brand-900"><MapPin size={14} className="text-slate-500" />{site.name} site record</Link>}
              {task && <Link to={`/tasks?task=${task.id}`} className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-700 hover:text-brand-900"><CalendarCheck size={14} className="text-slate-500" />{task.id} · {task.title}</Link>}
            </div>
          )}

          <section className="mt-6 border-t border-slate-100 pt-5">
            <h3 className="text-xs font-semibold text-slate-800">Calendar</h3>
            <p className="mt-1 text-[11px] leading-5 text-slate-500">Add this meeting to Google Calendar, or download an .ics file for Outlook and Apple Calendar.</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <ActionButton icon={CalendarDays} onClick={onAddToCalendar} disabled={!isScheduled}>{meeting.calendarStatus === 'synced' ? 'Add again to Google Calendar' : 'Add to Google Calendar'}</ActionButton>
              <ActionButton icon={Download} onClick={onDownloadIcs} disabled={!isScheduled}>Download .ics file</ActionButton>
            </div>
            {meeting.calendarUrl && <a href={meeting.calendarUrl} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-semibold text-brand-700 hover:text-brand-900">Open calendar event <ExternalLink size={12} className="text-slate-500" /></a>}
          </section>

          <section className="mt-6 border-t border-slate-100 pt-5">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-xs font-semibold text-slate-800">Attendees <span className="font-normal text-slate-400">({attendees.length})</span></h3>
              {canManage && <button type="button" onClick={sendInvites} disabled={sending || !isScheduled} className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"><Mail size={13} className="text-slate-500" />{sending ? 'Sending…' : 'Email invitations'}</button>}
            </div>
            <ul className="mt-3 divide-y divide-slate-100 rounded-lg border border-slate-100">
              {attendees.map((member) => (
                <li key={member.id} className="flex items-center gap-3 px-3 py-2.5">
                  <span className="grid size-8 shrink-0 place-items-center rounded-full bg-slate-100 text-[10px] font-bold text-slate-600">{member.initials}</span>
                  <div className="min-w-0 flex-1"><p className="truncate text-xs font-medium text-slate-800">{member.name}</p><p className="truncate text-[10px] text-slate-400">{member.role} · {member.email}</p></div>
                  {canManage && isScheduled && <button type="button" onClick={() => onWhatsApp(member.id)} aria-label={`Send WhatsApp reminder to ${member.name}`} title="WhatsApp reminder" className="grid size-8 shrink-0 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800"><MessageCircle size={15} /></button>}
                </li>
              ))}
              {!attendees.length && <li className="px-3 py-3 text-[11px] text-slate-400">No attendees selected.</li>}
            </ul>
          </section>

          {canManage && isScheduled && (
            <section className="mt-6 border-t border-slate-100 pt-5">
              <h3 className="text-xs font-semibold text-slate-800">Meeting outcome</h3>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <ActionButton icon={CalendarCheck} onClick={() => onUpdateStatus('completed')}>Mark as completed</ActionButton>
                <ActionButton icon={CalendarX} onClick={() => onUpdateStatus('cancelled')}>Cancel meeting</ActionButton>
              </div>
            </section>
          )}
          {canManage && !isScheduled && (
            <section className="mt-6 border-t border-slate-100 pt-5">
              <button type="button" onClick={() => onUpdateStatus('scheduled')} className="text-xs font-semibold text-brand-700 hover:text-brand-900">Reopen as scheduled</button>
            </section>
          )}

          <section className="mt-6 border-t border-slate-100 pt-5">
            <h3 className="flex items-center gap-2 text-xs font-semibold text-slate-800"><Radio size={15} className="text-slate-500" />Communications</h3>
            <CommunicationHistory logs={logs} emptyText="No calendar events, invitations, or reminders have been sent for this meeting." />
          </section>
        </div>
      </aside>
    </div>
  )
}

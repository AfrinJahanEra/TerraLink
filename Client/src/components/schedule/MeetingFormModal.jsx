import { CalendarDays, CalendarPlus, Clock3, Mail, MapPin, Users, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { DURATION_OPTIONS, MEETING_TYPES } from '../../data/schedule'
import { addDaysToKey, formatDuration, todayKey } from '../../utils/schedule'
import { Button } from '../ui/Button'

const inputClass = 'mt-1.5 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-700 outline-none focus:border-brand-400'

function defaultLocation(type, site) {
  if (type === 'field_visit' && site) return `${site.name}, ${site.location}`
  return MEETING_TYPES[type]?.defaultLocation ?? ''
}

export function MeetingFormModal({ open, initial = {}, sites, tasks, members, organizerId, onClose, onCreate }) {
  const initialType = MEETING_TYPES[initial.type] ? initial.type : 'review_meeting'
  const initialSite = sites.find((site) => site.id === initial.siteId)
  const initialTask = tasks.find((task) => task.id === initial.taskId)
  const assigneeId = members.find((member) => member.name === initialTask?.assignee)?.id

  const [title, setTitle] = useState(initial.title ?? '')
  const [type, setType] = useState(initialType)
  const [date, setDate] = useState(initial.date ?? addDaysToKey(todayKey(), 1))
  const [startTime, setStartTime] = useState(initialType === 'field_visit' ? '09:30' : '11:00')
  const [durationMinutes, setDurationMinutes] = useState(MEETING_TYPES[initialType].defaultDuration)
  const [location, setLocation] = useState(defaultLocation(initialType, initialSite))
  const [siteId, setSiteId] = useState(initialSite?.id ?? '')
  const [taskId, setTaskId] = useState(initialTask?.id ?? '')
  const [attendeeIds, setAttendeeIds] = useState(() => [...new Set([organizerId, assigneeId].filter(Boolean))])
  const [agenda, setAgenda] = useState(initial.agenda ?? '')
  const [addToCalendar, setAddToCalendar] = useState(true)
  const [emailInvites, setEmailInvites] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return undefined
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose, open])

  if (!open) return null

  const siteTasks = siteId ? tasks.filter((task) => task.siteId === siteId) : tasks

  function changeType(nextType) {
    setType(nextType)
    setDurationMinutes(MEETING_TYPES[nextType].defaultDuration)
    setLocation(defaultLocation(nextType, sites.find((site) => site.id === siteId)))
  }

  function changeSite(nextSiteId) {
    setSiteId(nextSiteId)
    if (taskId && !tasks.some((task) => task.id === taskId && task.siteId === nextSiteId)) setTaskId('')
    if (type === 'field_visit') setLocation(defaultLocation(type, sites.find((site) => site.id === nextSiteId)))
  }

  function toggleAttendee(memberId) {
    setAttendeeIds((current) => current.includes(memberId) ? current.filter((id) => id !== memberId) : [...current, memberId])
    setError('')
  }

  function submit(event) {
    event.preventDefault()
    if (!attendeeIds.length) {
      setError('Select at least one attendee.')
      return
    }
    onCreate({
      title: title.trim(),
      type,
      date,
      startTime,
      durationMinutes: Number(durationMinutes),
      location: location.trim(),
      siteId,
      taskId,
      attendeeIds,
      agenda: agenda.trim(),
    }, { addToCalendar, emailInvites })
  }

  return (
    <div className="fixed inset-0 z-[1000] grid place-items-center bg-slate-950/45 p-4 backdrop-blur-[2px]" role="dialog" aria-modal="true" aria-labelledby="meeting-form-title">
      <button type="button" className="absolute inset-0 cursor-default" onClick={onClose} aria-label="Close meeting form" />
      <section className="relative z-10 max-h-[calc(100vh-2rem)] w-full max-w-2xl overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-pop">
        <div className="sticky top-0 z-10 flex items-start justify-between border-b border-slate-100 bg-white px-5 py-4">
          <div className="flex items-start gap-3"><span className="grid size-9 place-items-center rounded-lg bg-slate-100 text-slate-600"><CalendarPlus size={18} /></span><div><h2 id="meeting-form-title" className="text-sm font-semibold text-slate-900">Schedule meeting</h2><p className="mt-0.5 text-xs text-slate-500">Plan a field visit, review, or briefing and notify the people involved.</p></div></div>
          <button type="button" onClick={onClose} aria-label="Close" className="grid size-8 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800"><X size={17} /></button>
        </div>

        <form onSubmit={submit} className="space-y-4 p-5">
          <div className="grid gap-4 sm:grid-cols-[1fr_200px]">
            <label className="block"><span className="text-xs font-semibold text-slate-700">Title</span><input value={title} onChange={(event) => setTitle(event.target.value)} required placeholder="e.g. Pond A field verification visit" className={inputClass} /></label>
            <label className="block"><span className="text-xs font-semibold text-slate-700">Meeting type</span><select value={type} onChange={(event) => changeType(event.target.value)} className={inputClass}>{Object.entries(MEETING_TYPES).map(([id, item]) => <option key={id} value={id}>{item.label}</option>)}</select></label>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <label className="block"><span className="flex items-center gap-1.5 text-xs font-semibold text-slate-700"><CalendarDays size={14} className="text-slate-500" />Date</span><input type="date" value={date} min={todayKey()} onChange={(event) => setDate(event.target.value)} required className={inputClass} /></label>
            <label className="block"><span className="flex items-center gap-1.5 text-xs font-semibold text-slate-700"><Clock3 size={14} className="text-slate-500" />Start time</span><input type="time" value={startTime} step={900} onChange={(event) => setStartTime(event.target.value)} required className={inputClass} /></label>
            <label className="block"><span className="text-xs font-semibold text-slate-700">Duration</span><select value={durationMinutes} onChange={(event) => setDurationMinutes(Number(event.target.value))} className={inputClass}>{DURATION_OPTIONS.map((minutes) => <option key={minutes} value={minutes}>{formatDuration(minutes)}</option>)}</select></label>
          </div>

          <label className="block"><span className="flex items-center gap-1.5 text-xs font-semibold text-slate-700"><MapPin size={14} className="text-slate-500" />Location</span><input value={location} onChange={(event) => setLocation(event.target.value)} required placeholder="Office, site, or video link" className={inputClass} /></label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block"><span className="text-xs font-semibold text-slate-700">Related site <span className="font-normal text-slate-400">(optional)</span></span><select value={siteId} onChange={(event) => changeSite(event.target.value)} className={inputClass}><option value="">Programme-wide</option>{sites.map((site) => <option key={site.id} value={site.id}>{site.name} · {site.location}</option>)}</select></label>
            <label className="block"><span className="text-xs font-semibold text-slate-700">Linked task <span className="font-normal text-slate-400">(optional)</span></span><select value={taskId} onChange={(event) => setTaskId(event.target.value)} className={inputClass}><option value="">No linked task</option>{siteTasks.map((task) => <option key={task.id} value={task.id}>{task.id} · {task.title}</option>)}</select></label>
          </div>

          <fieldset className="rounded-lg border border-slate-200 p-3">
            <legend className="flex items-center gap-1.5 px-1 text-xs font-semibold text-slate-700"><Users size={14} className="text-slate-500" />Attendees</legend>
            <div className="mt-1 grid gap-2 sm:grid-cols-2">
              {members.map((member) => (
                <label key={member.id} className="flex cursor-pointer items-center gap-2 rounded-md px-1 py-1 text-xs text-slate-600 hover:bg-slate-50">
                  <input type="checkbox" checked={attendeeIds.includes(member.id)} onChange={() => toggleAttendee(member.id)} className="accent-slate-700" />
                  <span className="min-w-0 truncate"><span className="font-medium text-slate-700">{member.name}</span> <span className="text-slate-400">· {member.role}</span></span>
                </label>
              ))}
            </div>
            {error && <p role="alert" className="mt-2 text-[11px] font-medium text-rose-600">{error}</p>}
          </fieldset>

          <label className="block"><span className="text-xs font-semibold text-slate-700">Agenda</span><textarea value={agenda} onChange={(event) => setAgenda(event.target.value)} rows={3} placeholder="Purpose, decisions needed, and preparation" className="mt-1.5 w-full resize-none rounded-lg border border-slate-200 px-3 py-2.5 text-xs leading-5 text-slate-700 outline-none focus:border-brand-400" /></label>

          <fieldset className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2.5">
            <legend className="px-1 text-[10px] font-semibold text-slate-600">After saving</legend>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[11px] text-slate-600">
              <label className="flex cursor-pointer items-center gap-1.5"><input type="checkbox" checked={addToCalendar} onChange={() => setAddToCalendar((value) => !value)} className="accent-slate-700" /><CalendarDays size={13} className="text-slate-500" />Add to Google Calendar</label>
              <label className="flex cursor-pointer items-center gap-1.5"><input type="checkbox" checked={emailInvites} onChange={() => setEmailInvites((value) => !value)} className="accent-slate-700" /><Mail size={13} className="text-slate-500" />Email invitations to attendees</label>
            </div>
          </fieldset>

          <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end"><Button type="button" variant="secondary" onClick={onClose}>Cancel</Button><Button type="submit">Save meeting <CalendarPlus size={15} /></Button></div>
        </form>
      </section>
    </div>
  )
}

import { Check, Copy, ExternalLink, LoaderCircle, Mail, Plus, Video, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { prepareGoogleSignIn } from '../../services/calendar'
import { formatLongDate, formatTimeRange } from '../../services/taskEmails'
import { cn } from '../../utils/cn'
import { todayInDhaka } from '../../utils/reports'
import { Button } from '../ui/Button'

const inputClass = 'mt-1 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-700 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100'
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const GOOGLE_BLUE = 'bg-[#1a73e8] hover:bg-[#1765cc]'

function nextHalfHour() {
  const now = new Date(Date.now() + 60 * 60_000)
  now.setMinutes(now.getMinutes() < 30 ? 30 : 60, 0, 0)
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
}

const sameEmail = (a, b) => a.toLowerCase() === b.toLowerCase()

/**
 * Online meeting in Google Calendar with a Google Meet link, from the signed-in manager's Google account.
 * `request` prefills it: { task, site, title, agenda, guests: [{ name, email }] }. `members` are offered as one-click guests.
 */
export function MeetingModal({ request, members = [], onClose, onCreate }) {
  const { task, site } = request
  const [guests, setGuests] = useState(request.guests ?? [])
  const [draft, setDraft] = useState('')
  const [form, setForm] = useState({
    title: request.title ?? (task ? `${task.id} · ${task.title}` : site ? `${site.name} meeting` : 'TerraLink meeting'),
    date: todayInDhaka(),
    startTime: nextHalfHour(),
    durationMinutes: 30,
    agenda: request.agenda ?? (task ? `Progress on ${task.title.toLowerCase()} at ${task.site}, blockers, and next steps.` : ''),
  })
  const [state, setState] = useState({ status: 'idle', error: '', result: null })
  const [copied, setCopied] = useState(false)
  const suggestions = members.filter((member) => member.email && !guests.some((guest) => sameEmail(guest.email, member.email)))

  useEffect(() => {
    void prepareGoogleSignIn()
    const onKey = (event) => { if (event.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  function addGuests(text) {
    const found = text.split(/[\s,;]+/).map((item) => item.trim()).filter(Boolean)
    const valid = found.filter((email) => EMAIL.test(email))
    if (valid.length) setGuests((current) => [...current, ...valid.filter((email) => !current.some((guest) => sameEmail(guest.email, email))).map((email) => ({ name: '', email }))])
    setDraft(found.filter((email) => !EMAIL.test(email)).join(' '))
  }

  async function submit(event) {
    event.preventDefault()
    // An email still being typed counts too.
    const typed = [...new Set(draft.split(/[\s,;]+/).filter((email) => EMAIL.test(email) && !guests.some((guest) => sameEmail(guest.email, email))))]
    if (draft.trim()) addGuests(draft)
    const all = [...guests, ...typed.map((email) => ({ name: '', email }))]
    if (!form.title.trim()) return setState({ status: 'idle', error: 'Give the meeting a title.', result: null })
    if (!all.length) return setState({ status: 'idle', error: 'Add at least one email address.', result: null })
    if (!form.date || !form.startTime) return setState({ status: 'idle', error: 'Choose the date and time.', result: null })
    setState({ status: 'working', error: '', result: null })
    try {
      const result = await onCreate({ ...form, title: form.title.trim(), agenda: form.agenda.trim(), guests: all })
      setState({ status: 'done', error: '', result })
    } catch (error) {
      setState({ status: 'idle', error: error instanceof Error ? error.message : 'The meeting could not be created.', result: null })
    }
  }

  async function copyLink() {
    await navigator.clipboard?.writeText(state.result.meetUrl).catch(() => undefined)
    setCopied(true)
  }

  const set = (key) => (event) => setForm((current) => ({ ...current, [key]: key === 'durationMinutes' ? Number(event.target.value) : event.target.value }))

  return (
    <div className="fixed inset-0 z-[1100] grid place-items-center overflow-hidden bg-slate-950/55 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="meeting-title">
      <button type="button" className="absolute inset-0 cursor-default" onClick={onClose} aria-label="Close" tabIndex={-1} />
      <div className="animate-fade-in relative z-10 flex max-h-full w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-pop">
        <header className="flex shrink-0 items-center gap-3 border-b border-slate-100 px-5 py-4">
          <span className="grid size-10 place-items-center rounded-xl bg-[#1a73e8]/10 text-[#1a73e8]"><Video size={19} /></span>
          <div className="min-w-0 flex-1">
            <h2 id="meeting-title" className="text-sm font-semibold text-slate-900">Create meeting</h2>
            <p className="truncate text-[11px] text-slate-500">{task ? `${task.id} · ${task.site}` : site ? site.name : 'Google Calendar'} · Google Meet link from your account</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="grid size-8 place-items-center rounded-lg text-slate-500 hover:bg-slate-100"><X size={17} /></button>
        </header>

        {state.status === 'done' ? (
          <div className="thin-scroll space-y-4 overflow-y-auto p-5">
            <div className="rounded-xl bg-green-50 p-4 text-center">
              <span className="mx-auto grid size-11 place-items-center rounded-full bg-green-600 text-white"><Check size={22} /></span>
              <p className="mt-3 text-sm font-semibold text-slate-900">Meeting saved to Google Calendar</p>
              <p className="mt-1 text-xs text-slate-600">{formatLongDate(form.date)} · {formatTimeRange(form.date, form.startTime, form.durationMinutes)}</p>
            </div>
            <div className="flex items-center gap-2 rounded-lg border border-slate-200 p-2 pl-3">
              <Video size={15} className="shrink-0 text-[#1a73e8]" />
              <a href={state.result.meetUrl} target="_blank" rel="noreferrer" className="min-w-0 flex-1 truncate text-xs font-semibold text-[#1a73e8] hover:underline">{state.result.meetUrl}</a>
              <button type="button" onClick={copyLink} className="inline-flex h-8 items-center gap-1 rounded-md bg-slate-100 px-2.5 text-[11px] font-semibold text-slate-700 hover:bg-slate-200">{copied ? <Check size={13} /> : <Copy size={13} />}{copied ? 'Copied' : 'Copy'}</button>
            </div>
            <ul className="space-y-1.5">
              {state.result.logs.map((log) => (
                <li key={log.id} className="flex items-center gap-2 text-xs"><Mail size={13} className={log.status === 'Sent' ? 'text-green-600' : 'text-rose-500'} /><span className="min-w-0 flex-1 truncate text-slate-700">{log.recipient}</span><span className={cn('text-[11px] font-semibold', log.status === 'Sent' ? 'text-green-700' : 'text-rose-600')}>{log.status === 'Sent' ? 'Email sent' : 'Not sent'}</span></li>
              ))}
            </ul>
            <p className="text-[11px] leading-4 text-slate-500">Google also sent each guest a calendar invitation, so the meeting is in their Google Calendar.</p>
            <div className="flex gap-2">
              <Button as="a" href={state.result.meetUrl} target="_blank" rel="noreferrer" className={cn('flex-1', GOOGLE_BLUE)}><Video size={15} />Join now</Button>
              {state.result.calendarUrl && <Button as="a" href={state.result.calendarUrl} target="_blank" rel="noreferrer" variant="secondary"><ExternalLink size={14} />Calendar</Button>}
              <Button type="button" variant="secondary" onClick={onClose}>Done</Button>
            </div>
          </div>
        ) : (
          <form onSubmit={submit} noValidate className="flex min-h-0 flex-col">
            <div className="thin-scroll space-y-4 overflow-y-auto p-5">
              <div>
                <span className="text-[11px] font-semibold text-slate-700">Invite by email</span>
                <div className="mt-1 flex min-h-10 flex-wrap items-center gap-1.5 rounded-lg border border-slate-200 px-2 py-1.5 focus-within:border-brand-400 focus-within:ring-2 focus-within:ring-brand-100">
                  {guests.map((guest) => (
                    <span key={guest.email} className="inline-flex max-w-full items-center gap-1 rounded-full bg-slate-100 py-0.5 pl-2.5 pr-1 text-[11px] font-medium text-slate-700">
                      <span className="truncate">{guest.name ? `${guest.name} · ` : ''}{guest.email}</span>
                      <button type="button" onClick={() => setGuests((current) => current.filter((item) => item.email !== guest.email))} aria-label={`Remove ${guest.email}`} className="grid size-5 place-items-center rounded-full text-slate-500 hover:bg-slate-200"><X size={11} /></button>
                    </span>
                  ))}
                  <input
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    onKeyDown={(event) => { if (['Enter', ',', ' '].includes(event.key) && draft.trim()) { event.preventDefault(); addGuests(draft) } if (event.key === 'Backspace' && !draft && guests.length) setGuests((current) => current.slice(0, -1)) }}
                    onBlur={() => draft.trim() && addGuests(draft)}
                    placeholder={guests.length ? 'Add another email' : 'name@example.com'}
                    aria-label="Guest email"
                    className="h-7 min-w-[140px] flex-1 border-0 px-1 text-xs text-slate-700 outline-none"
                  />
                </div>
                {suggestions.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {suggestions.map((member) => (
                      <button key={member.id} type="button" onClick={() => setGuests((current) => [...current, { name: member.name, email: member.email }])} className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-2 py-0.5 text-[10.5px] font-medium text-slate-600 hover:border-brand-300 hover:bg-brand-50 hover:text-brand-800">
                        <Plus size={10} />{member.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <label className="block"><span className="text-[11px] font-semibold text-slate-700">Title</span><input value={form.title} onChange={set('title')} className={inputClass} /></label>
              <div className="grid grid-cols-3 gap-3">
                <label className="block"><span className="text-[11px] font-semibold text-slate-700">Date</span><input type="date" min={todayInDhaka()} value={form.date} onChange={set('date')} className={inputClass} /></label>
                <label className="block"><span className="text-[11px] font-semibold text-slate-700">Start</span><input type="time" value={form.startTime} onChange={set('startTime')} className={inputClass} /></label>
                <label className="block"><span className="text-[11px] font-semibold text-slate-700">Length</span><select value={form.durationMinutes} onChange={set('durationMinutes')} className={inputClass}>{[15, 30, 45, 60, 90, 120].map((minutes) => <option key={minutes} value={minutes}>{minutes} min</option>)}</select></label>
              </div>
              <label className="block"><span className="text-[11px] font-semibold text-slate-700">Agenda</span><textarea value={form.agenda} onChange={set('agenda')} rows={3} placeholder="What the meeting is for" className={cn(inputClass, 'h-auto resize-none py-2 leading-5')} /></label>
              {state.error && <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-[11px] font-medium text-rose-700">{state.error}</p>}
            </div>
            <footer className="flex shrink-0 items-center justify-end gap-2 border-t border-slate-100 bg-slate-50 px-5 py-3">
              <Button type="button" variant="secondary" onClick={onClose} className="h-9 min-h-9">Cancel</Button>
              <Button type="submit" disabled={state.status === 'working'} className={cn('h-9 min-h-9', GOOGLE_BLUE)}>{state.status === 'working' ? <LoaderCircle size={15} className="animate-spin" /> : <Video size={15} />}{state.status === 'working' ? 'Creating meeting' : 'Create and send invites'}</Button>
            </footer>
          </form>
        )}
      </div>
    </div>
  )
}

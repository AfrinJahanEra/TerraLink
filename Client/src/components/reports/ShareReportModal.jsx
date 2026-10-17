import { AlertTriangle, Check, LoaderCircle, Mail, Paperclip, Plus, Send, UserPlus, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { cn } from '../../utils/cn'
import { Button } from '../ui/Button'

const emailPattern = /^\S+@\S+\.\S+$/

const initialsOf = (name) => name.split(/[\s@.]+/).filter(Boolean).map((part) => part[0]).slice(0, 2).join('').toUpperCase()

/**
 * Pick who gets the report. Each person has their own Send button, so one click emails that person the
 * subject, the summary table and the PDF. Extra addresses can be added for people outside the team.
 */
export function ShareReportModal({ open, title, subject, attachment, attachmentError, emailSetup, members, currentUserEmail, onClose, onSend }) {
  const [note, setNote] = useState('')
  const [extras, setExtras] = useState([])
  const [address, setAddress] = useState('')
  const [addressError, setAddressError] = useState('')
  const [results, setResults] = useState({})

  useEffect(() => {
    if (!open) return undefined
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose, open])

  if (!open) return null

  const people = [
    ...members.filter((member) => member.email).map((member) => ({ id: member.id, name: member.name, email: member.email, detail: member.role, you: member.email === currentUserEmail })),
    ...extras,
  ]
  const ready = Boolean(attachment) && emailSetup.configured
  const pending = people.filter((person) => results[person.id]?.state !== 'sent' && results[person.id]?.state !== 'sending')

  function addAddress(event) {
    event.preventDefault()
    const email = address.trim().toLowerCase()
    if (!emailPattern.test(email)) return setAddressError('Enter a valid email address.')
    if (people.some((person) => person.email.toLowerCase() === email)) return setAddressError('That address is already in the list.')
    setExtras((current) => [...current, { id: `extra-${email}`, name: email, email, detail: 'Added address', extra: true }])
    setAddress('')
    setAddressError('')
  }

  async function sendTo(person) {
    setResults((current) => ({ ...current, [person.id]: { state: 'sending' } }))
    try {
      const log = await onSend({ id: person.id, name: person.name, email: person.email, role: person.detail }, note.trim())
      setResults((current) => ({ ...current, [person.id]: log.status === 'Failed' ? { state: 'failed', detail: log.detail } : { state: 'sent' } }))
    } catch (error) {
      setResults((current) => ({ ...current, [person.id]: { state: 'failed', detail: error instanceof Error ? error.message : 'The email could not be sent.' } }))
    }
  }

  // One at a time: the email service allows about one request per second.
  async function sendAll() {
    for (const person of pending) await sendTo(person)
  }

  return (
    <div className="fixed inset-0 z-[1000] grid place-items-center bg-slate-950/45 p-4 backdrop-blur-[2px]" role="dialog" aria-modal="true" aria-labelledby="send-report-title">
      <button type="button" className="absolute inset-0 cursor-default" onClick={onClose} aria-label="Close" />
      <section className="relative z-10 flex max-h-[calc(100vh-2rem)] w-full max-w-xl flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-pop">
        <div className="flex items-start justify-between border-b border-slate-100 px-5 py-4">
          <div className="flex items-start gap-3"><span className="grid size-9 place-items-center rounded-lg bg-slate-100 text-slate-600"><Mail size={18} /></span><div><h2 id="send-report-title" className="text-sm font-semibold text-slate-900">Send report</h2><p className="mt-0.5 text-xs text-slate-500">{title}</p></div></div>
          <button type="button" onClick={onClose} aria-label="Close" className="grid size-8 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800"><X size={17} /></button>
        </div>

        <div className="space-y-4 overflow-y-auto p-5">
          {!emailSetup.configured && !emailSetup.checking && (
            <p role="alert" className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs leading-5 text-amber-900"><AlertTriangle size={15} className="mt-0.5 shrink-0" /><span><strong className="font-semibold">Email is not set up.</strong> Add {emailSetup.missing.join(', ')} to Client/.env and restart the app. Until then nothing can be sent.</span></p>
          )}

          <div className="rounded-lg border border-slate-200 bg-slate-50/70 px-3.5 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400">Email</p>
            <p className="mt-1 text-xs font-semibold text-slate-800">{subject}</p>
            <p className="mt-1 text-[11px] leading-5 text-slate-500">The message has a summary table and the full report attached as a PDF.</p>
            {emailSetup.from && <p className="mt-1 text-[11px] text-slate-500">Sent from <span className="font-medium text-slate-700">{emailSetup.from}</span></p>}
            <p className={cn('mt-2 inline-flex items-center gap-1.5 rounded-md bg-white px-2 py-1 text-[11px] ring-1 ring-inset', attachmentError ? 'text-rose-700 ring-rose-200' : 'text-slate-600 ring-slate-200')}>
              {attachment ? <Paperclip size={12} className="text-slate-400" /> : attachmentError ? <AlertTriangle size={12} /> : <LoaderCircle size={12} className="animate-spin text-slate-400" />}
              {attachment ? `${attachment.filename} · ${Math.max(1, Math.round(attachment.bytes / 1024))} KB` : attachmentError || 'Preparing the PDF…'}
            </p>
          </div>

          <label className="block"><span className="text-xs font-semibold text-slate-700">Message <span className="font-normal text-slate-400">(optional)</span></span><textarea value={note} onChange={(event) => setNote(event.target.value)} rows={2} placeholder="Context, requested decisions, or next steps" className="mt-1.5 w-full resize-none rounded-lg border border-slate-200 px-3 py-2.5 text-xs leading-5 text-slate-700 outline-none focus:border-brand-400" /></label>

          <div>
            <p className="text-xs font-semibold text-slate-700">Send to</p>
            <ul className="mt-2 divide-y divide-slate-100 rounded-lg border border-slate-200">
              {people.map((person) => {
                const result = results[person.id]
                return (
                  <li key={person.id} className="px-3 py-2.5">
                    <div className="flex items-center gap-3">
                      <span className="grid size-8 shrink-0 place-items-center rounded-full bg-slate-100 text-[10px] font-bold text-slate-600">{person.extra ? <UserPlus size={14} /> : initialsOf(person.name)}</span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-semibold text-slate-800">{person.extra ? person.email : person.name}{person.you && <span className="ml-1.5 font-normal text-slate-400">(you)</span>}</p>
                        <p className="truncate text-[11px] text-slate-500">{person.extra ? person.detail : `${person.detail} · ${person.email}`}</p>
                      </div>
                      {result?.state === 'sent' ? (
                        <span className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-slate-100 px-3 text-xs font-semibold text-slate-700"><Check size={14} className="text-brand-700" />Sent</span>
                      ) : (
                        <Button type="button" variant={result?.state === 'failed' ? 'secondary' : 'primary'} className="min-h-8 px-3 text-xs" disabled={!ready || result?.state === 'sending'} onClick={() => sendTo(person)}>
                          {result?.state === 'sending' ? <LoaderCircle size={13} className="animate-spin" /> : <Send size={13} />}
                          {result?.state === 'sending' ? 'Sending…' : result?.state === 'failed' ? 'Try again' : 'Send'}
                        </Button>
                      )}
                    </div>
                    {result?.state === 'failed' && <p role="alert" className="mt-1.5 pl-11 text-[11px] leading-4 text-rose-600">{result.detail || 'The email could not be sent.'}</p>}
                  </li>
                )
              })}
            </ul>

            <form onSubmit={addAddress} className="mt-3 flex gap-2">
              <input type="email" value={address} onChange={(event) => { setAddress(event.target.value); setAddressError('') }} placeholder="Add another email address" aria-label="Add another email address" className="h-10 min-w-0 flex-1 rounded-lg border border-slate-200 px-3 text-xs text-slate-700 outline-none focus:border-brand-400" />
              <Button type="submit" variant="secondary" className="min-h-10 px-3 text-xs"><Plus size={14} />Add</Button>
            </form>
            {addressError && <p role="alert" className="mt-1.5 text-[11px] font-medium text-rose-600">{addressError}</p>}
          </div>
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <Button type="button" variant="ghost" onClick={onClose}>Close</Button>
          <Button type="button" variant="secondary" disabled={!ready || !pending.length} onClick={sendAll}><Send size={14} />Send to everyone{pending.length && pending.length < people.length ? ` left (${pending.length})` : ''}</Button>
        </div>
      </section>
    </div>
  )
}

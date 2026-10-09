import { Mail, Send, Users, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button } from '../ui/Button'

export function ShareReportModal({ open, title, summary, members, defaultRecipientIds = [], onClose, onSend }) {
  const [recipientIds, setRecipientIds] = useState(defaultRecipientIds)
  const [note, setNote] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return undefined
    const onKeyDown = (event) => {
      if (event.key === 'Escape' && !sending) onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose, open, sending])

  if (!open) return null

  function toggleRecipient(memberId) {
    setRecipientIds((current) => current.includes(memberId) ? current.filter((id) => id !== memberId) : [...current, memberId])
    setError('')
  }

  async function submit(event) {
    event.preventDefault()
    if (!recipientIds.length) {
      setError('Select at least one recipient.')
      return
    }
    setSending(true)
    try {
      await onSend({ recipientIds, note: note.trim() })
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : 'The report could not be shared.')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="print-hidden fixed inset-0 z-[1000] grid place-items-center bg-slate-950/45 p-4 backdrop-blur-[2px]" role="dialog" aria-modal="true" aria-labelledby="share-report-title">
      <button type="button" className="absolute inset-0 cursor-default" onClick={() => !sending && onClose()} aria-label="Close share report" />
      <section className="relative z-10 max-h-[calc(100vh-2rem)] w-full max-w-xl overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-pop">
        <div className="sticky top-0 z-10 flex items-start justify-between border-b border-slate-100 bg-white px-5 py-4">
          <div className="flex items-start gap-3"><span className="grid size-9 place-items-center rounded-lg bg-slate-100 text-slate-600"><Mail size={18} /></span><div><h2 id="share-report-title" className="text-sm font-semibold text-slate-900">Share report by email</h2><p className="mt-0.5 text-xs text-slate-500">{title}</p></div></div>
          <button type="button" onClick={onClose} disabled={sending} aria-label="Close" className="grid size-8 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800 disabled:opacity-50"><X size={17} /></button>
        </div>

        <form onSubmit={submit} className="space-y-4 p-5">
          <fieldset className="rounded-lg border border-slate-200 p-3">
            <legend className="flex items-center gap-1.5 px-1 text-xs font-semibold text-slate-700"><Users size={14} className="text-slate-500" />Recipients</legend>
            <div className="mt-1 grid gap-2 sm:grid-cols-2">
              {members.map((member) => (
                <label key={member.id} className="flex cursor-pointer items-center gap-2 rounded-md px-1 py-1 text-xs text-slate-600 hover:bg-slate-50">
                  <input type="checkbox" checked={recipientIds.includes(member.id)} onChange={() => toggleRecipient(member.id)} className="accent-slate-700" />
                  <span className="min-w-0 truncate"><span className="font-medium text-slate-700">{member.name}</span> <span className="text-slate-400">· {member.role}</span></span>
                </label>
              ))}
            </div>
          </fieldset>

          <label className="block"><span className="text-xs font-semibold text-slate-700">Cover note <span className="font-normal text-slate-400">(optional)</span></span><textarea value={note} onChange={(event) => setNote(event.target.value)} rows={3} placeholder="Context, requested decisions, or next steps" className="mt-1.5 w-full resize-none rounded-lg border border-slate-200 px-3 py-2.5 text-xs leading-5 text-slate-700 outline-none focus:border-brand-400" /></label>

          <div>
            <p className="text-xs font-semibold text-slate-700">Summary included in the email</p>
            <pre className="mt-1.5 whitespace-pre-wrap rounded-lg bg-slate-50 px-3 py-2.5 font-sans text-[11px] leading-5 text-slate-600">{summary}</pre>
            <p className="mt-1.5 text-[10px] text-slate-400">The email links back to the Reports module. Attach the printed PDF separately if a full copy is required.</p>
          </div>

          {error && <p role="alert" className="text-[11px] font-medium text-rose-600">{error}</p>}

          <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end"><Button type="button" variant="secondary" onClick={onClose} disabled={sending}>Cancel</Button><Button type="submit" disabled={sending}>{sending ? 'Sending…' : `Send to ${recipientIds.length || 'no'} ${recipientIds.length === 1 ? 'recipient' : 'recipients'}`} <Send size={15} /></Button></div>
        </form>
      </section>
    </div>
  )
}

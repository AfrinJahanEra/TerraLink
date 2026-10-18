import { CalendarPlus, Check, ClipboardPlus, ShieldCheck } from 'lucide-react'
import { useState } from 'react'
import { SITE_STATUS } from '../../constants/status'
import { Button } from '../ui/Button'
import { cn } from '../../utils/cn'

const decisionOptions = ['needs_review', 'confirmed', 'inconclusive']

export function DecisionPanel({ site, existingDecision, onSave, onCreateTask, onScheduleVisit }) {
  const savedStatus = existingDecision?.status ?? site.status
  const initialStatus = decisionOptions.includes(savedStatus) ? savedStatus : 'needs_review'
  const [status, setStatus] = useState(initialStatus)
  const [explanation, setExplanation] = useState(existingDecision?.note ?? '')
  const [saved, setSaved] = useState(false)

  function submitDecision(event) {
    event.preventDefault()
    onSave({ status, note: explanation.trim() })
    setSaved(true)
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-card">
      <div className="flex items-start gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-600"><ShieldCheck size={18} /></span>
        <div><h2 className="text-sm font-semibold text-slate-900">Manager review decision</h2><p className="mt-1 text-xs leading-5 text-slate-500">Record the human decision that controls the next workflow step.</p></div>
      </div>

      <form onSubmit={submitDecision} className="mt-5">
        <fieldset>
          <legend className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">Decision outcome</legend>
          <div className="mt-2 grid gap-2">
            {decisionOptions.map((option) => {
              const config = SITE_STATUS[option]
              const active = status === option
              return (
                <label key={option} className={cn('flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 transition', active ? 'border-slate-400 bg-slate-50' : 'border-slate-200 hover:border-slate-300')}>
                  <input type="radio" name="decision" value={option} checked={active} onChange={() => { setStatus(option); setSaved(false) }} className="accent-slate-700" />
                  <span className="text-xs font-semibold text-slate-700">{config.label}</span>
                </label>
              )
            })}
          </div>
        </fieldset>

        <label className="mt-4 block">
          <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">Review explanation</span>
          <textarea
            value={explanation}
            onChange={(event) => { setExplanation(event.target.value); setSaved(false) }}
            required
            rows={4}
            placeholder="Explain the evidence, limitations, and recommended next step."
            className="mt-2 w-full resize-none rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs leading-5 text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-brand-400 focus:bg-white"
          />
        </label>

        {saved && <p role="status" className="mt-3 flex items-center gap-2 text-xs font-medium text-brand-700"><Check size={14} className="text-slate-600" />Decision saved across the workspace.</p>}

        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <Button type="submit" className="flex-1">Save decision <Check size={15} /></Button>
          <Button type="button" variant="secondary" onClick={onCreateTask} className="flex-1"><ClipboardPlus size={15} className="text-slate-600" />Create review task</Button>
        </div>
        {onScheduleVisit && <Button type="button" onClick={onScheduleVisit} variant="ghost" className="mt-2 w-full"><CalendarPlus size={15} className="text-slate-600" />Schedule field verification visit</Button>}
      </form>

      {existingDecision && (
        <div className="mt-4 border-t border-slate-100 pt-4 text-[10px] leading-4 text-slate-400">Last saved by {existingDecision.decidedBy} on {existingDecision.displayDate}.</div>
      )}
    </section>
  )
}

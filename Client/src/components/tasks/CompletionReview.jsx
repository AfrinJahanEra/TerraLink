import { CircleCheck, RotateCcw, ShieldCheck, TriangleAlert } from 'lucide-react'
import { useState } from 'react'
import { TASK_RESOLUTION } from '../../constants/actions'
import { cn } from '../../utils/cn'
import { formatBdt } from '../../utils/currency'
import { formatDateTime } from '../../utils/reports'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'

/** The manager's decision on submitted evidence, or the recorded outcome once a task is completed. */
export function CompletionReview({ task, isManager, onReview }) {
  const [outcome, setOutcome] = useState('resolved')
  const [note, setNote] = useState('')
  const [error, setError] = useState('')

  if (task.status === 'completed' && task.resolution) {
    const resolution = TASK_RESOLUTION[task.resolution.outcome]
    return (
      <section className="mt-6 border-t border-slate-100 pt-5" aria-label="Outcome">
        <h3 className="flex items-center gap-2 text-xs font-semibold text-slate-800"><ShieldCheck size={15} className="text-slate-500" />Recorded outcome</h3>
        <div className="mt-3 rounded-lg bg-slate-50 px-4 py-3">
          <Badge tone={resolution.tone}>{resolution.label}</Badge>
          {task.resolution.note && <p className="mt-2 text-xs leading-5 text-slate-700">{task.resolution.note}</p>}
          <p className="mt-2 text-[10px] text-slate-400">Accepted by {task.resolution.by} · {formatDateTime(task.resolution.at)}</p>
        </div>
      </section>
    )
  }

  if (task.status !== 'awaiting_verification') return null

  if (!isManager) {
    return <section className="mt-6 border-t border-slate-100 pt-5"><p className="rounded-lg bg-slate-50 px-3 py-2.5 text-xs leading-5 text-slate-700">The project manager is reviewing the completion evidence. You will see the outcome here.</p></section>
  }

  function decide(decision) {
    if (decision === 'returned' && note.trim().length < 5) return setError('Say what still needs doing so the team can act on it.')
    try {
      onReview({ decision, outcome, note })
      setNote('')
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'The review could not be saved.')
    }
  }

  return (
    <section className="mt-6 border-t border-slate-100 pt-5" aria-label="Completion review">
      <h3 className="flex items-center gap-2 text-xs font-semibold text-slate-800"><ShieldCheck size={15} className="text-slate-500" />Review the completion</h3>
      <p className="mt-1 text-[11px] leading-5 text-slate-500">Compare the before and after photos above, then accept the work or send it back. Closing the task is only possible here.</p>

      {task.pendingCost > 0 && <p className="mt-3 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs leading-5 text-amber-900"><TriangleAlert size={14} className="mt-0.5 shrink-0" />{formatBdt(task.pendingCost)} of expenses are still pending approval. They only count toward the task cost once approved.</p>}

      <fieldset className="mt-4">
        <legend className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">Was the problem resolved?</legend>
        <div className="mt-2 grid gap-2 sm:grid-cols-3">
          {Object.entries(TASK_RESOLUTION).map(([id, item]) => (
            <label key={id} className={cn('flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2.5 text-xs font-semibold transition', outcome === id ? 'border-brand-600 bg-brand-50/60 text-slate-900' : 'border-slate-200 text-slate-600 hover:border-slate-300')}>
              <input type="radio" name={`outcome-${task.id}`} checked={outcome === id} onChange={() => setOutcome(id)} className="accent-brand-700" />{item.label}
            </label>
          ))}
        </div>
      </fieldset>

      <label className="mt-4 block"><span className="text-xs font-semibold text-slate-700">Reviewer note</span><textarea value={note} onChange={(event) => { setNote(event.target.value); setError('') }} rows={3} placeholder="What you checked. A note is required to send the work back." className="mt-1.5 w-full resize-none rounded-lg border border-slate-200 px-3 py-2.5 text-xs leading-5 outline-none focus:border-brand-400" /></label>
      {error && <p role="alert" className="mt-1.5 text-[11px] font-medium text-rose-600">{error}</p>}
      <div className="mt-3 flex flex-wrap gap-2">
        <Button type="button" className="min-h-9 px-3 text-xs" onClick={() => decide('approved')}><CircleCheck size={14} />Approve and complete</Button>
        <Button type="button" variant="secondary" className="min-h-9 px-3 text-xs" onClick={() => decide('returned')}><RotateCcw size={14} />Return for more work</Button>
      </div>
    </section>
  )
}

import { Check, Plus, ReceiptText, X } from 'lucide-react'
import { useState } from 'react'
import { EXPENSE_APPROVAL, EXPENSE_CATEGORIES } from '../../constants/actions'
import { formatBdt } from '../../utils/currency'
import { Lightbox } from '../community/Lightbox'
import { PhotoImage } from '../community/PhotoImage'
import { Badge } from '../ui/Badge'

function Figure({ label, value, detail, tone }) {
  return (
    <div className="rounded-lg bg-slate-50 px-3 py-2.5">
      <p className="text-[10px] font-semibold text-slate-400">{label}</p>
      <p className={`mt-1 text-sm font-bold ${tone === 'rose' ? 'text-amber-700' : 'text-slate-900'}`}>{value}</p>
      {detail && <p className="mt-0.5 text-[10px] text-slate-400">{detail}</p>}
    </div>
  )
}

/**
 * Planned cost against approved cost for one task, with every expense listed and reviewable.
 * `simple` drops the variance figure for the field team, who only need their budget and what is approved.
 */
export function TaskExpenses({ task, expenses, canAdd, canReview, onAdd, onReview, simple = false }) {
  const [rejecting, setRejecting] = useState(null)
  const [reason, setReason] = useState('')
  const [lightbox, setLightbox] = useState('')
  const own = expenses.filter((expense) => expense.taskId === task.id).sort((a, b) => b.date.localeCompare(a.date))
  const estimate = Number(task.estimatedCost || 0)
  const variance = task.actualCost - estimate

  return (
    <section className="mt-5 border-t border-slate-100 pt-5" aria-label="Expenses">
      <div className="flex items-center justify-between gap-3">
        <h3 className="flex items-center gap-2 text-xs font-semibold text-slate-800"><ReceiptText size={15} className="text-slate-500" />{simple ? 'Expenses' : 'Costs and expenses'}</h3>
        {canAdd && <button type="button" onClick={onAdd} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-[11px] font-semibold text-slate-700 hover:bg-slate-50"><Plus size={13} />Add expense</button>}
      </div>

      <div className={`mt-3 grid gap-2 ${simple ? 'grid-cols-3' : 'grid-cols-2 sm:grid-cols-4'}`}>
        <Figure label={simple ? 'Budget' : 'Estimated'} value={formatBdt(estimate)} />
        <Figure label="Approved" value={formatBdt(task.actualCost)} />
        <Figure label="Waiting approval" value={formatBdt(task.pendingCost)} />
        {!simple && <Figure label="Variance" value={`${variance > 0 ? '+' : variance < 0 ? '−' : ''}${formatBdt(Math.abs(variance))}`} detail={variance > 0 ? 'Over the estimate' : variance < 0 ? 'Under the estimate' : 'On the estimate'} tone={variance > 0 ? 'rose' : undefined} />}
      </div>

      <ul className="mt-3 divide-y divide-slate-100 rounded-lg border border-slate-100">
        {own.map((expense) => {
          const approval = EXPENSE_APPROVAL[expense.approvalStatus] ?? EXPENSE_APPROVAL.approved
          const photo = expense.receiptPhotos?.[0]
          return (
            <li key={expense.id} className="flex items-start gap-3 px-3 py-3">
              {photo && <span className="block size-10 shrink-0 overflow-hidden rounded-md bg-slate-100"><PhotoImage photoId={photo.id} alt="Receipt" onClick={setLightbox} /></span>}
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-slate-800">{expense.description}</p>
                <p className="mt-0.5 text-[10px] text-slate-400">{EXPENSE_CATEGORIES[expense.category] ?? 'Other'} · {expense.date}{simple ? '' : ` · ${expense.createdBy}`}</p>
                {expense.reviewNote && <p className="mt-1 text-[10px] leading-4 text-slate-500">{expense.reviewedBy}: {expense.reviewNote}</p>}
                {canReview && expense.approvalStatus === 'pending' && (
                  rejecting === expense.id ? (
                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      <input value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Reason for rejecting" aria-label="Reason for rejecting" className="h-8 min-w-0 flex-1 rounded-md border border-slate-200 px-2 text-[11px] outline-none focus:border-brand-400" />
                      <button type="button" disabled={reason.trim().length < 5} onClick={() => { onReview(expense.id, 'rejected', reason.trim()); setRejecting(null); setReason('') }} className="rounded-md bg-rose-600 px-2.5 py-1.5 text-[10px] font-semibold text-white disabled:opacity-40">Reject</button>
                      <button type="button" onClick={() => { setRejecting(null); setReason('') }} className="rounded-md px-2 py-1.5 text-[10px] font-semibold text-slate-500 hover:bg-slate-100">Cancel</button>
                    </div>
                  ) : (
                    <div className="mt-2 flex gap-1.5">
                      <button type="button" onClick={() => onReview(expense.id, 'approved')} className="inline-flex items-center gap-1 rounded-md bg-brand-700 px-2 py-1 text-[10px] font-semibold text-white hover:bg-brand-800"><Check size={11} />Approve</button>
                      <button type="button" onClick={() => setRejecting(expense.id)} className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1 text-[10px] font-semibold text-slate-600 hover:bg-slate-50"><X size={11} />Reject</button>
                    </div>
                  )
                )}
              </div>
              <div className="shrink-0 text-right"><p className="text-xs font-bold text-slate-900">{formatBdt(expense.amount)}</p><Badge tone={approval.tone} className="mt-1 px-2 py-0.5 text-[10px]">{approval.label}</Badge></div>
            </li>
          )
        })}
        {!own.length && <li className="px-3 py-5 text-center text-[11px] text-slate-400">No expenses have been recorded for this task.</li>}
      </ul>
      {lightbox && <Lightbox url={lightbox} onClose={() => setLightbox('')} />}
    </section>
  )
}

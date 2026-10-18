import { Check, CirclePlus, Plus, ReceiptText, X } from 'lucide-react'
import { useState } from 'react'
import { EXPENSE_APPROVAL, EXPENSE_CATEGORIES } from '../../constants/actions'
import { taskBudget } from '../../utils/budget'
import { cn } from '../../utils/cn'
import { formatBdt } from '../../utils/currency'
import { formatShortDate } from '../../utils/reports'
import { Lightbox } from '../community/Lightbox'
import { PhotoImage } from '../community/PhotoImage'

function Figure({ label, value, detail, strong }) {
  return (
    <div className="px-3 py-2.5">
      <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400">{label}</p>
      <p className={cn('mt-1 text-sm font-semibold tabular-nums', strong ? 'text-rose-700' : 'text-slate-900')}>{value}</p>
      {detail && <p className="mt-0.5 text-[10px] text-slate-400">{detail}</p>}
    </div>
  )
}

/** How an expense stands: accepted within the budget, approved, waiting for extra budget, or rejected. */
function statusLabel(expense) {
  if (expense.approvalStatus === 'pending') return expense.topUp ? 'Needs extra budget' : EXPENSE_APPROVAL.pending.label
  if (expense.approvalStatus === 'approved' && expense.autoApproved) return 'Within budget'
  return (EXPENSE_APPROVAL[expense.approvalStatus] ?? EXPENSE_APPROVAL.approved).label
}

/**
 * The money given for one task, what has been spent and the variance, with every expense listed.
 * Expenses within the budget are accepted at once; one that goes over carries an extra-budget request for the manager.
 */
export function TaskExpenses({ task, expenses, canAdd, canReview, canAddBudget = false, onAdd, onReview, onAddBudget, simple = false }) {
  const [rejecting, setRejecting] = useState(null)
  const [reason, setReason] = useState('')
  const [lightbox, setLightbox] = useState('')
  const [adding, setAdding] = useState(false)
  const [extra, setExtra] = useState({ amount: '', reason: '', error: '' })
  const own = expenses.filter((expense) => expense.taskId === task.id).sort((a, b) => b.date.localeCompare(a.date))
  const budget = taskBudget(task)
  const spent = Number(task.actualCost || 0)
  const variance = spent - budget
  const used = budget ? Math.min(100, Math.round((spent / budget) * 100)) : spent ? 100 : 0
  const topUps = task.budgetTopUps ?? []
  // Extra money the field coordinator has asked for and the manager has not decided on yet.
  const requests = own.filter((expense) => expense.approvalStatus === 'pending' && expense.topUp)
  const moreNeeded = requests.reduce((sum, expense) => sum + Number(expense.topUp.amount || 0), 0)

  function addBudget(event) {
    event.preventDefault()
    try {
      onAddBudget(Number(extra.amount), extra.reason)
      setAdding(false)
      setExtra({ amount: '', reason: '', error: '' })
    } catch (error) {
      setExtra((current) => ({ ...current, error: error instanceof Error ? error.message : 'The budget could not be added.' }))
    }
  }

  return (
    <section className="mt-5 border-t border-slate-100 pt-5" aria-label="Costs and expenses">
      <div className="flex items-center justify-between gap-3">
        <h3 className="flex items-center gap-2 text-xs font-semibold text-slate-800"><ReceiptText size={15} className="text-slate-500" />Costs and expenses</h3>
        <div className="flex items-center gap-1.5">
          {canAddBudget && onAddBudget && <button type="button" onClick={() => setAdding((value) => !value)} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-[11px] font-semibold text-slate-700 hover:bg-slate-50"><CirclePlus size={13} />Add budget</button>}
          {canAdd && <button type="button" onClick={onAdd} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-[11px] font-semibold text-slate-700 hover:bg-slate-50"><Plus size={13} />Add expense</button>}
        </div>
      </div>

      {adding && (
        <form onSubmit={addBudget} className="mt-3 flex flex-wrap items-start gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
          <label className="w-32"><span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-500">Amount (BDT)</span><input type="number" min="1" step="1" value={extra.amount} onChange={(event) => setExtra({ ...extra, amount: event.target.value, error: '' })} autoFocus className="mt-1 h-8 w-full rounded-md border border-slate-200 bg-white px-2 text-xs outline-none focus:border-slate-400" /></label>
          <label className="min-w-[160px] flex-1"><span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-500">Note <span className="normal-case tracking-normal text-slate-400">(optional)</span></span><input value={extra.reason} onChange={(event) => setExtra({ ...extra, reason: event.target.value })} placeholder="Extra truck for the north bank" className="mt-1 h-8 w-full rounded-md border border-slate-200 bg-white px-2 text-xs outline-none focus:border-slate-400" /></label>
          <div className="flex gap-1.5 self-end">
            <button type="submit" className="h-8 rounded-md bg-slate-900 px-3 text-[11px] font-semibold text-white hover:bg-slate-800">Add to budget</button>
            <button type="button" onClick={() => { setAdding(false); setExtra({ amount: '', reason: '', error: '' }) }} className="h-8 rounded-md px-2.5 text-[11px] font-semibold text-slate-500 hover:bg-slate-100">Cancel</button>
          </div>
          {extra.error && <p role="alert" className="w-full text-[11px] font-medium text-rose-600">{extra.error}</p>}
        </form>
      )}

      <div className="mt-3 rounded-lg border border-slate-200">
        <div className="grid grid-cols-2 divide-x divide-y divide-slate-100 sm:grid-cols-4 sm:divide-y-0">
          <Figure label="Budget given" value={budget ? formatBdt(budget) : 'Not set'} detail={!budget ? (canAddBudget ? 'Use Add budget' : 'Not given yet') : task.extraBudget ? `incl. ${formatBdt(task.extraBudget)} extra` : simple ? '' : 'For this task'} />
          <Figure label="Spent" value={formatBdt(spent)} detail={`${used}% of budget`} />
          <Figure label="More needed" value={formatBdt(moreNeeded)} detail={requests.length ? `${requests.length} ${requests.length === 1 ? 'request' : 'requests'} waiting for approval` : 'Nothing requested'} />
          <Figure label="Variance" value={`${variance > 0 ? '+' : variance < 0 ? '−' : ''}${formatBdt(Math.abs(variance))}`} detail={variance > 0 ? 'Over budget' : variance < 0 ? `${formatBdt(-variance)} left` : 'On budget'} strong={variance > 0} />
        </div>
        <div className="border-t border-slate-100 px-3 py-2.5">
          <div className="h-1.5 overflow-hidden rounded-full bg-slate-100"><div className={cn('h-full rounded-full', variance > 0 ? 'bg-rose-600' : 'bg-slate-800')} style={{ width: `${used}%` }} /></div>
        </div>
      </div>

      <ul className="mt-3 divide-y divide-slate-100 rounded-lg border border-slate-100">
        {own.map((expense) => {
          const photo = expense.receiptPhotos?.[0]
          const pending = expense.approvalStatus === 'pending'
          return (
            <li key={expense.id} className="flex items-start gap-3 px-3 py-3">
              {photo && <span className="block size-10 shrink-0 overflow-hidden rounded-md bg-slate-100"><PhotoImage photoId={photo.id} alt="Receipt" onClick={setLightbox} /></span>}
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-slate-800">{expense.description}</p>
                <p className="mt-0.5 text-[10px] text-slate-400">{EXPENSE_CATEGORIES[expense.category] ?? 'Other'} · {expense.date}{simple ? '' : ` · ${expense.createdBy}`}</p>
                {expense.topUp && (
                  <p className="mt-1.5 rounded-md bg-slate-50 px-2 py-1.5 text-[10.5px] leading-4 text-slate-700">
                    <strong className="font-semibold">Extra budget {pending ? 'requested' : expense.approvalStatus === 'approved' ? 'approved' : 'declined'}: {formatBdt(expense.topUp.amount)}</strong> · {expense.topUp.reason}
                  </p>
                )}
                {expense.reviewNote && !expense.autoApproved && <p className="mt-1 text-[10px] leading-4 text-slate-500">{expense.reviewedBy}: {expense.reviewNote}</p>}
                {canReview && pending && (
                  rejecting === expense.id ? (
                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      <input value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Reason for rejecting" aria-label="Reason for rejecting" className="h-8 min-w-0 flex-1 rounded-md border border-slate-200 px-2 text-[11px] outline-none focus:border-slate-400" />
                      <button type="button" disabled={reason.trim().length < 5} onClick={() => { onReview(expense.id, 'rejected', reason.trim()); setRejecting(null); setReason('') }} className="rounded-md bg-slate-900 px-2.5 py-1.5 text-[10px] font-semibold text-white disabled:opacity-40">Reject</button>
                      <button type="button" onClick={() => { setRejecting(null); setReason('') }} className="rounded-md px-2 py-1.5 text-[10px] font-semibold text-slate-500 hover:bg-slate-100">Cancel</button>
                    </div>
                  ) : (
                    <div className="mt-2 flex gap-1.5">
                      <button type="button" onClick={() => onReview(expense.id, 'approved')} className="inline-flex items-center gap-1 rounded-md bg-slate-900 px-2.5 py-1 text-[10px] font-semibold text-white hover:bg-slate-800"><Check size={11} />{expense.topUp ? `Approve + ${formatBdt(expense.topUp.amount)} budget` : 'Approve'}</button>
                      <button type="button" onClick={() => setRejecting(expense.id)} className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1 text-[10px] font-semibold text-slate-600 hover:bg-slate-50"><X size={11} />Reject</button>
                    </div>
                  )
                )}
              </div>
              <div className="shrink-0 text-right">
                <p className="text-xs font-bold tabular-nums text-slate-900">{formatBdt(expense.amount)}</p>
                <p className={cn('mt-1 text-[10px] font-semibold', pending ? 'text-slate-900' : expense.approvalStatus === 'rejected' ? 'text-slate-400 line-through' : 'text-slate-500')}>{statusLabel(expense)}</p>
              </div>
            </li>
          )
        })}
        {!own.length && <li className="px-3 py-5 text-center text-[11px] text-slate-400">No expenses have been recorded for this task.</li>}
      </ul>

      {topUps.length > 0 && (
        <div className="mt-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400">Budget changes</p>
          <ul className="mt-1.5 space-y-1">
            {topUps.map((item) => (
              <li key={`${item.expenseId}-${item.at}`} className="flex items-baseline justify-between gap-3 text-[11px] text-slate-600">
                <span className="min-w-0 truncate">+{formatBdt(item.amount)} {item.expenseId ? 'approved' : 'added'} by {item.approvedBy} · {item.reason}</span>
                <span className="shrink-0 text-[10px] text-slate-400">{formatShortDate(item.at)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {lightbox && <Lightbox url={lightbox} onClose={() => setLightbox('')} />}
    </section>
  )
}

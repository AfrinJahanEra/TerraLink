import { Check, FileText, ReceiptText, X } from 'lucide-react'
import { useState } from 'react'
import { EXPENSE_APPROVAL, EXPENSE_CATEGORIES } from '../../constants/actions'
import { formatBdt } from '../../utils/currency'
import { Lightbox } from '../community/Lightbox'
import { PhotoImage } from '../community/PhotoImage'
import { Badge } from '../ui/Badge'

function formatDate(value) {
  return new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(`${value}T12:00:00`))
}

/** Expense ledger. A manager (`canReview`) can approve or reject pending entries; a reason is required to reject. */
export function ExpenseHistory({ expenses, tasks, sites, canReview = false, onReview }) {
  const taskMap = new Map(tasks.map((task) => [task.id, task]))
  const siteMap = new Map(sites.map((site) => [site.id, site]))
  const [rejecting, setRejecting] = useState(null)
  const [reason, setReason] = useState('')
  const [lightbox, setLightbox] = useState('')

  function reject(id) {
    if (reason.trim().length < 5) return
    onReview(id, 'rejected', reason.trim())
    setRejecting(null)
    setReason('')
  }

  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-card">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4"><div><h2 className="text-sm font-semibold text-slate-900">Expense history</h2><p className="mt-0.5 text-xs text-slate-400">Only approved expenses count toward task and site costs</p></div><span className="text-xs font-semibold text-slate-500">{expenses.length} records</span></div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[920px] text-left text-xs">
          <thead className="bg-slate-50/70 text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400"><tr><th className="px-5 py-3">Date</th><th className="px-4 py-3">Description</th><th className="px-4 py-3">Site / task</th><th className="px-4 py-3">Receipt</th><th className="px-4 py-3">Status</th><th className="px-5 py-3 text-right">Amount</th></tr></thead>
          <tbody className="divide-y divide-slate-100">
            {expenses.map((expense) => {
              const task = taskMap.get(expense.taskId)
              const site = siteMap.get(expense.siteId)
              const approval = EXPENSE_APPROVAL[expense.approvalStatus] ?? EXPENSE_APPROVAL.approved
              const photo = expense.receiptPhotos?.[0]
              return (
                <tr key={expense.id} className="align-top hover:bg-slate-50/60">
                  <td className="whitespace-nowrap px-5 py-3.5 text-slate-500">{formatDate(expense.date)}</td>
                  <td className="px-4 py-3.5"><p className="font-semibold text-slate-800">{expense.description}</p><p className="mt-1 text-[10px] text-slate-400">{expense.id} · {EXPENSE_CATEGORIES[expense.category] ?? 'Other'} · Entered by {expense.createdBy}</p></td>
                  <td className="px-4 py-3.5"><p className="font-medium text-slate-700">{site?.name ?? 'Unknown site'}</p><p className="mt-1 text-[10px] text-slate-400">{task ? `${task.id} · ${task.title}` : 'Site-level cost'}</p></td>
                  <td className="max-w-56 px-4 py-3.5 text-slate-500">
                    <div className="flex items-start gap-2">
                      {photo && <PhotoThumb photoId={photo.id} onOpen={setLightbox} />}
                      {expense.receiptNote ? <span className="flex items-start gap-1.5"><FileText size={13} className="mt-0.5 shrink-0 text-slate-500" />{expense.receiptNote}</span> : !photo && 'No receipt'}
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <Badge tone={approval.tone} className="px-2 py-0.5 text-[10px]">{approval.label}</Badge>
                    {expense.approvalStatus !== 'pending' && expense.reviewedBy && <p className="mt-1 text-[10px] text-slate-400">{expense.reviewedBy}</p>}
                    {expense.reviewNote && <p className="mt-1 max-w-40 text-[10px] leading-4 text-slate-500">{expense.reviewNote}</p>}
                    {canReview && expense.approvalStatus === 'pending' && (
                      rejecting === expense.id ? (
                        <div className="mt-2 space-y-1.5">
                          <input value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Reason" aria-label="Reason for rejecting" className="h-8 w-40 rounded-md border border-slate-200 px-2 text-[11px] outline-none focus:border-brand-400" />
                          <div className="flex gap-1.5"><button type="button" onClick={() => reject(expense.id)} disabled={reason.trim().length < 5} className="rounded-md bg-rose-600 px-2 py-1 text-[10px] font-semibold text-white disabled:opacity-40">Reject</button><button type="button" onClick={() => { setRejecting(null); setReason('') }} className="rounded-md px-2 py-1 text-[10px] font-semibold text-slate-500 hover:bg-slate-100">Cancel</button></div>
                        </div>
                      ) : (
                        <div className="mt-2 flex gap-1.5">
                          <button type="button" onClick={() => onReview(expense.id, 'approved')} className="inline-flex items-center gap-1 rounded-md bg-brand-700 px-2 py-1 text-[10px] font-semibold text-white hover:bg-brand-800"><Check size={11} />Approve</button>
                          <button type="button" onClick={() => setRejecting(expense.id)} className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1 text-[10px] font-semibold text-slate-600 hover:bg-slate-50"><X size={11} />Reject</button>
                        </div>
                      )
                    )}
                  </td>
                  <td className="whitespace-nowrap px-5 py-3.5 text-right font-semibold text-slate-900">{formatBdt(expense.amount)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      {!expenses.length && <div className="px-6 py-14 text-center"><ReceiptText size={26} className="mx-auto text-slate-400" /><p className="mt-3 text-xs text-slate-500">No expenses are visible in this workspace.</p></div>}
      {lightbox && <Lightbox url={lightbox} onClose={() => setLightbox('')} />}
    </section>
  )
}

function PhotoThumb({ photoId, onOpen }) {
  return <span className="block size-10 shrink-0 overflow-hidden rounded-md bg-slate-100"><PhotoImage photoId={photoId} alt="Receipt" onClick={onOpen} /></span>
}

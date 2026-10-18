import { CalendarDays, FileText, LoaderCircle, ReceiptText, Save, Send, TriangleAlert, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { EXPENSE_CATEGORIES } from '../../constants/actions'
import { useApp } from '../../hooks/useApp'
import { storePhotos } from '../../services/photoStore'
import { taskBudget } from '../../utils/budget'
import { formatBdt } from '../../utils/currency'
import { todayInDhaka } from '../../utils/reports'
import { Button } from '../ui/Button'
import { PhotoPicker } from '../ui/PhotoPicker'

const inputClass = 'mt-1.5 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-700 outline-none focus:border-brand-400 disabled:bg-slate-50 disabled:text-slate-400'

/** Records one expense against an open task. `lockTask` fixes the task when the form is opened from that task. */
export function ExpenseFormModal({ open, tasks, initialTaskId, lockTask = false, onClose, onCreate }) {
  const { role } = useApp()
  const openTasks = tasks.filter((task) => task.status !== 'completed' && task.status !== 'cancelled')
  const [date, setDate] = useState(todayInDhaka())
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('transport')
  const [description, setDescription] = useState('')
  const [taskId, setTaskId] = useState(openTasks.some((task) => task.id === initialTaskId) ? initialTaskId : openTasks[0]?.id ?? '')
  const [receiptNote, setReceiptNote] = useState('')
  const [receipt, setReceipt] = useState([])
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [topUpAmount, setTopUpAmount] = useState('')
  const [topUpReason, setTopUpReason] = useState('')
  const isManager = role?.id === 'manager'
  const selected = openTasks.find((task) => task.id === taskId)
  const budget = selected ? taskBudget(selected) : 0
  const spent = Number(selected?.actualCost ?? 0)
  const available = budget - spent
  const over = selected && Number(amount) > 0 ? Math.max(0, Number(amount) - Math.max(available, 0)) : 0
  // A field coordinator going over the money given must ask for at least the difference.
  const needsTopUp = !isManager && over > 0
  const requested = Number(topUpAmount || over)

  useEffect(() => {
    if (!open) return undefined
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose, open])

  if (!open) return null

  async function submit(event) {
    event.preventDefault()
    const task = openTasks.find((item) => item.id === taskId)
    if (!task) return setError('Choose an open task for this expense.')
    if (date > todayInDhaka()) return setError('The expense date cannot be in the future.')
    if (!isManager && !receipt.length) return setError('Add a photo of the receipt.')
    if (needsTopUp && requested < over) return setError(`Request at least ${formatBdt(over)} of extra budget.`)
    if (needsTopUp && topUpReason.trim().length < 5) return setError('Say why the extra budget is needed.')
    setError('')
    setSaving(true)
    try {
      const receiptPhotos = receipt.length ? await storePhotos(receipt.map((item) => item.file), 'receipt') : []
      await onCreate({
        date, amount: Number(amount), category, description: description.trim(), taskId, siteId: task.siteId, receiptNote: receiptNote.trim(), receiptPhotos,
        ...(needsTopUp ? { topUp: { amount: requested, reason: topUpReason.trim() } } : {}),
      })
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'The expense could not be saved.')
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[1100] grid place-items-center bg-slate-950/45 p-4 backdrop-blur-[2px]" role="dialog" aria-modal="true" aria-labelledby="expense-modal-title">
      <button type="button" className="absolute inset-0 cursor-default" onClick={onClose} aria-label="Close expense form" />
      <section className="relative z-10 max-h-[calc(100vh-2rem)] w-full max-w-xl overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-pop">
        <div className="sticky top-0 z-10 flex items-start justify-between border-b border-slate-100 bg-white px-5 py-4">
          <div className="flex items-center gap-3"><span className="grid size-9 place-items-center rounded-lg bg-slate-100 text-slate-600"><ReceiptText size={17} /></span><div><h2 id="expense-modal-title" className="text-sm font-semibold text-slate-900">Add expense</h2><p className="mt-0.5 text-xs text-slate-500">{isManager ? 'Your entries are accepted when you record them. No receipt needed.' : 'Within the task budget it is accepted at once. Above it, ask for extra budget.'}</p></div></div>
          <button type="button" onClick={onClose} aria-label="Close" className="grid size-8 place-items-center rounded-lg text-slate-500 hover:bg-slate-100"><X size={17} /></button>
        </div>

        <form onSubmit={submit} className="space-y-4 p-5">
          <label className="block"><span className="text-xs font-semibold text-slate-700">Linked task</span><select value={taskId} onChange={(event) => setTaskId(event.target.value)} disabled={lockTask} required className={inputClass}>{openTasks.map((task) => <option key={task.id} value={task.id}>{task.id} · {task.title}</option>)}</select></label>
          {selected && (
            <dl className="grid grid-cols-3 divide-x divide-slate-200 rounded-lg border border-slate-200 text-center">
              {[['Budget given', formatBdt(budget)], ['Spent', formatBdt(spent)], [available < 0 ? 'Over by' : 'Remaining', formatBdt(Math.abs(available))]].map(([label, value]) => (
                <div key={label} className="px-3 py-2"><dt className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400">{label}</dt><dd className="mt-0.5 text-sm font-semibold tabular-nums text-slate-900">{value}</dd></div>
              ))}
            </dl>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block"><span className="text-xs font-semibold text-slate-700">Category</span><select value={category} onChange={(event) => setCategory(event.target.value)} className={inputClass}>{Object.entries(EXPENSE_CATEGORIES).map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select></label>
            <label className="block"><span className="flex items-center gap-1.5 text-xs font-semibold text-slate-700"><CalendarDays size={14} className="text-slate-500" />Expense date</span><input type="date" value={date} onChange={(event) => setDate(event.target.value)} required max={todayInDhaka()} className={inputClass} /></label>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block"><span className="text-xs font-semibold text-slate-700">Amount (BDT)</span><input type="number" min="1" step="1" value={amount} onChange={(event) => setAmount(event.target.value)} required className={inputClass} /></label>
            <label className="block"><span className="text-xs font-semibold text-slate-700">Description</span><input value={description} onChange={(event) => setDescription(event.target.value)} required placeholder="What was paid for" className={inputClass} /></label>
          </div>
          {!isManager && (
            <>
              <div>
                <span className="text-xs font-semibold text-slate-700">Receipt photo</span>
                <div className="mt-1.5 max-w-[160px]"><PhotoPicker photos={receipt} onChange={setReceipt} max={1} hint="One photo of the receipt" /></div>
              </div>
              <label className="block"><span className="flex items-center gap-1.5 text-xs font-semibold text-slate-700"><FileText size={14} className="text-slate-500" />Receipt note <span className="font-normal text-slate-400">(optional)</span></span><textarea value={receiptNote} onChange={(event) => setReceiptNote(event.target.value)} rows={2} placeholder="Receipt number or where the paper copy is kept" className="mt-1.5 w-full resize-none rounded-lg border border-slate-200 px-3 py-2.5 text-xs text-slate-700 outline-none focus:border-brand-400" /></label>
            </>
          )}
          {needsTopUp && (
            <div className="space-y-3 rounded-lg border border-slate-300 bg-slate-50 p-4">
              <p className="flex items-start gap-2 text-xs text-slate-800"><TriangleAlert size={15} className="mt-px shrink-0 text-slate-600" /><span><strong className="font-semibold">{formatBdt(over)} over the remaining budget.</strong> Request extra budget. The expense is accepted once the project manager approves it.</span></p>
              <div className="grid gap-3 sm:grid-cols-[150px_minmax(0,1fr)]">
                <label className="block"><span className="text-xs font-semibold text-slate-700">Extra budget (BDT)</span><input type="number" min={over} step="1" value={topUpAmount} onChange={(event) => setTopUpAmount(event.target.value)} placeholder={String(over)} className={inputClass} /></label>
                <label className="block"><span className="text-xs font-semibold text-slate-700">Why it is needed</span><input value={topUpReason} onChange={(event) => setTopUpReason(event.target.value)} placeholder="More waste than expected; a second truck was needed" className={inputClass} /></label>
              </div>
            </div>
          )}
          {isManager && over > 0 && <p className="text-xs text-slate-600">This takes the task {formatBdt(over)} over its budget.</p>}
          {error && <p role="alert" className="text-xs font-medium text-rose-600">{error}</p>}
          <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end"><Button type="button" variant="secondary" onClick={onClose}>Cancel</Button><Button type="submit" disabled={saving || !openTasks.length}>{saving ? <LoaderCircle size={15} className="animate-spin" /> : needsTopUp ? <Send size={15} /> : <Save size={15} />}{needsTopUp ? 'Send for approval' : 'Record expense'}</Button></div>
        </form>
      </section>
    </div>
  )
}

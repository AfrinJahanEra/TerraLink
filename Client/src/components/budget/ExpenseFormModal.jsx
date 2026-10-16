import { CalendarDays, FileText, LoaderCircle, ReceiptText, Save, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { EXPENSE_CATEGORIES } from '../../constants/actions'
import { useApp } from '../../hooks/useApp'
import { storePhotos } from '../../services/photoStore'
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
    setError('')
    setSaving(true)
    try {
      const receiptPhotos = receipt.length ? await storePhotos(receipt.map((item) => item.file), 'receipt') : []
      await onCreate({ date, amount: Number(amount), category, description: description.trim(), taskId, siteId: task.siteId, receiptNote: receiptNote.trim(), receiptPhotos })
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
          <div className="flex items-center gap-3"><span className="grid size-9 place-items-center rounded-lg bg-slate-100 text-slate-600"><ReceiptText size={17} /></span><div><h2 id="expense-modal-title" className="text-sm font-semibold text-slate-900">Add expense</h2><p className="mt-0.5 text-xs text-slate-500">{role?.id === 'manager' ? 'Your entries are approved when you record them.' : 'It counts toward the task cost once the project manager approves it.'}</p></div></div>
          <button type="button" onClick={onClose} aria-label="Close" className="grid size-8 place-items-center rounded-lg text-slate-500 hover:bg-slate-100"><X size={17} /></button>
        </div>

        <form onSubmit={submit} className="space-y-4 p-5">
          <label className="block"><span className="text-xs font-semibold text-slate-700">Linked task</span><select value={taskId} onChange={(event) => setTaskId(event.target.value)} disabled={lockTask} required className={inputClass}>{openTasks.map((task) => <option key={task.id} value={task.id}>{task.id} · {task.title}</option>)}</select></label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block"><span className="text-xs font-semibold text-slate-700">Category</span><select value={category} onChange={(event) => setCategory(event.target.value)} className={inputClass}>{Object.entries(EXPENSE_CATEGORIES).map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select></label>
            <label className="block"><span className="flex items-center gap-1.5 text-xs font-semibold text-slate-700"><CalendarDays size={14} className="text-slate-500" />Expense date</span><input type="date" value={date} onChange={(event) => setDate(event.target.value)} required max={todayInDhaka()} className={inputClass} /></label>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block"><span className="text-xs font-semibold text-slate-700">Amount (BDT)</span><input type="number" min="1" step="1" value={amount} onChange={(event) => setAmount(event.target.value)} required className={inputClass} /></label>
            <label className="block"><span className="text-xs font-semibold text-slate-700">Description</span><input value={description} onChange={(event) => setDescription(event.target.value)} required placeholder="What was paid for" className={inputClass} /></label>
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-700">Receipt photo <span className="font-normal text-slate-400">(optional)</span></span>
            <div className="mt-1.5 max-w-[160px]"><PhotoPicker photos={receipt} onChange={setReceipt} max={1} hint="One photo of the receipt" /></div>
          </div>
          <label className="block"><span className="flex items-center gap-1.5 text-xs font-semibold text-slate-700"><FileText size={14} className="text-slate-500" />Receipt note <span className="font-normal text-slate-400">(optional)</span></span><textarea value={receiptNote} onChange={(event) => setReceiptNote(event.target.value)} rows={2} placeholder="Receipt number or where the paper copy is kept" className="mt-1.5 w-full resize-none rounded-lg border border-slate-200 px-3 py-2.5 text-xs text-slate-700 outline-none focus:border-brand-400" /></label>
          {error && <p role="alert" className="text-xs font-medium text-rose-600">{error}</p>}
          <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end"><Button type="button" variant="secondary" onClick={onClose}>Cancel</Button><Button type="submit" disabled={saving || !openTasks.length}>{saving ? <LoaderCircle size={15} className="animate-spin" /> : <Save size={15} />}Record expense</Button></div>
        </form>
      </section>
    </div>
  )
}

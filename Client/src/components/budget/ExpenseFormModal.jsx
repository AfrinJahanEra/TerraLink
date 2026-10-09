import { CalendarDays, FileText, ReceiptText, Save, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { formatBdtBangla } from '../../utils/currency'
import { Button } from '../ui/Button'

export function ExpenseFormModal({ open, tasks, onClose, onCreate }) {
  const [date, setDate] = useState('2026-10-09')
  const [amount, setAmount] = useState('4200')
  const [description, setDescription] = useState('Field visit transport and supplies')
  const [taskId, setTaskId] = useState(tasks[0]?.id ?? '')
  const [receiptNote, setReceiptNote] = useState('Receipt retained with the field visit record.')

  useEffect(() => {
    if (!open) return undefined
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose, open])

  if (!open) return null

  function submit(event) {
    event.preventDefault()
    const task = tasks.find((item) => item.id === taskId)
    if (!task) return
    onCreate({ date, amount: Number(amount), description: description.trim(), taskId, siteId: task.siteId, receiptNote: receiptNote.trim() })
  }

  return (
    <div className="fixed inset-0 z-[1000] grid place-items-center bg-slate-950/45 p-4 backdrop-blur-[2px]" role="dialog" aria-modal="true" aria-labelledby="expense-modal-title">
      <button type="button" className="absolute inset-0 cursor-default" onClick={onClose} aria-label="Close expense form" />
      <section className="relative z-10 max-h-[calc(100vh-2rem)] w-full max-w-xl overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-pop">
        <div className="sticky top-0 z-10 flex items-start justify-between border-b border-slate-100 bg-white px-5 py-4">
          <div className="flex items-center gap-3"><span className="grid size-9 place-items-center rounded-lg bg-slate-100 text-slate-600"><ReceiptText size={17} /></span><div><h2 id="expense-modal-title" className="text-sm font-semibold text-slate-900">Add expense</h2><p className="mt-0.5 text-xs text-slate-500">The amount will update the linked task, site, and dashboard.</p></div></div>
          <button type="button" onClick={onClose} aria-label="Close" className="grid size-8 place-items-center rounded-lg text-slate-500 hover:bg-slate-100"><X size={17} /></button>
        </div>

        <form onSubmit={submit} className="space-y-4 p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block"><span className="flex items-center gap-1.5 text-xs font-semibold text-slate-700"><CalendarDays size={14} className="text-slate-500" />Expense date</span><input type="date" value={date} onChange={(event) => setDate(event.target.value)} required max="2026-10-09" className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 px-3 text-xs text-slate-700 outline-none focus:border-brand-400" /></label>
            <label className="block"><span className="text-xs font-semibold text-slate-700">Amount (BDT)</span><input type="number" min="1" step="1" value={amount} onChange={(event) => setAmount(event.target.value)} required className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 px-3 text-xs text-slate-700 outline-none focus:border-brand-400" /><span className="mt-1 block text-[10px] text-slate-400">Current entry: {formatBdtBangla(amount)}</span></label>
          </div>
          <label className="block"><span className="text-xs font-semibold text-slate-700">Linked task</span><select value={taskId} onChange={(event) => setTaskId(event.target.value)} required className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-700 outline-none focus:border-brand-400">{tasks.map((task) => <option key={task.id} value={task.id}>{task.id} · {task.title} · {task.site}</option>)}</select></label>
          <label className="block"><span className="text-xs font-semibold text-slate-700">Description</span><input value={description} onChange={(event) => setDescription(event.target.value)} required className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 px-3 text-xs text-slate-700 outline-none focus:border-brand-400" /></label>
          <label className="block"><span className="flex items-center gap-1.5 text-xs font-semibold text-slate-700"><FileText size={14} className="text-slate-500" />Receipt note</span><textarea value={receiptNote} onChange={(event) => setReceiptNote(event.target.value)} rows={3} placeholder="Receipt number, storage location, or verification note" className="mt-1.5 w-full resize-none rounded-lg border border-slate-200 px-3 py-2.5 text-xs leading-5 text-slate-700 outline-none focus:border-brand-400" /></label>
          <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end"><Button type="button" variant="secondary" onClick={onClose}>Cancel</Button><Button type="submit">Record expense <Save size={15} /></Button></div>
        </form>
      </section>
    </div>
  )
}

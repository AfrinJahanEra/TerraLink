import { addDays, todayInDhaka } from '../../utils/reports'
import { CalendarDays, ClipboardPlus, UserRound, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button } from '../ui/Button'

export function TaskCreationModal({ open, site, members, onClose, onCreate }) {
  const [title, setTitle] = useState('Verify observed water-area change')
  const [assignee, setAssignee] = useState(members[0]?.name ?? '')
  const [dueDate, setDueDate] = useState(addDays(todayInDhaka(), 5))
  const [priority, setPriority] = useState('High')
  const [estimatedCost, setEstimatedCost] = useState('')
  const [notes, setNotes] = useState('Visit the site, capture geotagged evidence, and report field conditions.')

  useEffect(() => {
    if (!open) return undefined
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose, open])

  if (!open) return null

  function submitTask(event) {
    event.preventDefault()
    const selectedAssignee = members.find((item) => item.name === assignee)
    onCreate({ title: title.trim(), assignee, initials: selectedAssignee.initials, dueDate, priority, estimatedCost: Number(estimatedCost), notes: notes.trim() })
  }

  return (
    <div className="fixed inset-0 z-[1000] grid place-items-center bg-slate-950/45 p-4 backdrop-blur-[2px]" role="dialog" aria-modal="true" aria-labelledby="task-modal-title">
      <button type="button" className="absolute inset-0 cursor-default" onClick={onClose} aria-label="Close task form" />
      <section className="relative z-10 w-full max-w-lg rounded-xl border border-slate-200 bg-white shadow-pop">
        <div className="flex items-start justify-between border-b border-slate-100 px-5 py-4">
          <div className="flex items-start gap-3"><span className="grid size-9 place-items-center rounded-lg bg-slate-100 text-slate-600"><ClipboardPlus size={18} /></span><div><h2 id="task-modal-title" className="text-sm font-semibold text-slate-900">Create review task</h2><p className="mt-0.5 text-xs text-slate-500">Site preselected: {site.name}, {site.location}</p></div></div>
          <button type="button" onClick={onClose} aria-label="Close" className="grid size-8 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800"><X size={17} /></button>
        </div>

        <form onSubmit={submitTask} className="space-y-4 p-5">
          <label className="block"><span className="text-xs font-semibold text-slate-700">Task title</span><input value={title} onChange={(event) => setTitle(event.target.value)} required className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 px-3 text-xs text-slate-700 outline-none focus:border-brand-400" /></label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block"><span className="flex items-center gap-1.5 text-xs font-semibold text-slate-700"><UserRound size={14} className="text-slate-500" />Assignee</span><select value={assignee} onChange={(event) => setAssignee(event.target.value)} className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-700 outline-none focus:border-brand-400">{members.map((item) => <option key={item.id} value={item.name}>{item.name}</option>)}</select><span className={`mt-1 block text-[10px] ${members.length ? 'text-slate-400' : 'font-medium text-amber-700'}`}>{members.length ? 'Work can only be given to a field coordinator.' : 'Add a field coordinator on the Team page first.'}</span></label>
            <label className="block"><span className="flex items-center gap-1.5 text-xs font-semibold text-slate-700"><CalendarDays size={14} className="text-slate-500" />Due date</span><input type="date" value={dueDate} min={todayInDhaka()} onChange={(event) => setDueDate(event.target.value)} required className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 px-3 text-xs text-slate-700 outline-none focus:border-brand-400" /></label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block"><span className="text-xs font-semibold text-slate-700">Priority</span><select value={priority} onChange={(event) => setPriority(event.target.value)} className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-700 outline-none focus:border-brand-400"><option>High</option><option>Medium</option><option>Low</option></select></label>
            <label className="block"><span className="text-xs font-semibold text-slate-700">Budget given (BDT)</span><input type="number" min="0" step="100" value={estimatedCost} onChange={(event) => setEstimatedCost(event.target.value)} required className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 px-3 text-xs text-slate-700 outline-none focus:border-brand-400" /></label>
          </div>
          <label className="block"><span className="text-xs font-semibold text-slate-700">Field instructions</span><textarea value={notes} onChange={(event) => setNotes(event.target.value)} required rows={3} className="mt-1.5 w-full resize-none rounded-lg border border-slate-200 px-3 py-2.5 text-xs leading-5 text-slate-700 outline-none focus:border-brand-400" /></label>

          <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end">
            <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={!members.length}>Create task <ClipboardPlus size={15} /></Button>
          </div>
        </form>
      </section>
    </div>
  )
}

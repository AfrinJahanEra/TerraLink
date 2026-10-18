import { CalendarDays, ClipboardPlus, FileText, Mail, UserRound, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { REPORT_CATEGORIES } from '../../constants/reports'
import { TASK_PRIORITIES } from '../../constants/actions'
import { addDays, todayInDhaka } from '../../utils/reports'
import { Button } from '../ui/Button'

export function TaskFormModal({ open, sites, members, initialSiteId, report = null, onClose, onCreate }) {
  const [title, setTitle] = useState(report ? `Respond to ${REPORT_CATEGORIES[report.category].label.toLowerCase()} (${report.id})` : '')
  const [description, setDescription] = useState(report ? `Report ${report.id}: ${report.description}\n\nVisit the site, photograph the problem and the work done, and record the cost.` : '')
  const [siteId, setSiteId] = useState(report?.siteId ?? initialSiteId ?? sites[0]?.id ?? '')
  const [assignee, setAssignee] = useState(members[0]?.name ?? '')
  const [dueDate, setDueDate] = useState(addDays(todayInDhaka(), 7))
  const [estimatedCost, setEstimatedCost] = useState('')
  const [priority, setPriority] = useState(report ? 'High' : 'Medium')

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
    const site = sites.find((item) => item.id === siteId)
    const member = members.find((item) => item.name === assignee)
    onCreate({
      title: title.trim(), description: description.trim(), site: site.name, siteId,
      assignee, initials: member.initials, dueDate, estimatedCost: Number(estimatedCost),
      priority, notifications: { email: true, calendar: true }, reportId: report?.id ?? null,
    })
  }

  return (
    <div className="fixed inset-0 z-[1000] grid place-items-center bg-slate-950/45 p-4 backdrop-blur-[2px]" role="dialog" aria-modal="true" aria-labelledby="create-task-title">
      <button type="button" className="absolute inset-0 cursor-default" onClick={onClose} aria-label="Close task form" />
      <section className="relative z-10 max-h-[calc(100vh-2rem)] w-full max-w-2xl overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-pop">
        <div className="sticky top-0 z-10 flex items-start justify-between border-b border-slate-100 bg-white px-5 py-4">
          <div className="flex items-start gap-3"><span className="grid size-9 place-items-center rounded-lg bg-slate-100 text-slate-600"><ClipboardPlus size={18} /></span><div><h2 id="create-task-title" className="text-sm font-semibold text-slate-900">Create task</h2><p className="mt-0.5 text-xs text-slate-500">Link responsibility, deadline, cost, and reminder preferences.</p></div></div>
          <button type="button" onClick={onClose} aria-label="Close" className="grid size-8 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800"><X size={17} /></button>
        </div>

        <form onSubmit={submit} className="space-y-4 p-5">
          {report && <p className="flex items-start gap-2 rounded-lg bg-slate-50 px-3 py-2.5 text-xs leading-5 text-slate-600"><FileText size={14} className="mt-0.5 shrink-0 text-slate-500" />Created from verified report <strong className="font-semibold text-slate-800">{report.id}</strong>. The task keeps the link, so the report shows what was done about it.</p>}
          <label className="block"><span className="text-xs font-semibold text-slate-700">Task title</span><input value={title} onChange={(event) => setTitle(event.target.value)} required placeholder="Describe the required action" className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 px-3 text-xs text-slate-700 outline-none focus:border-brand-400" /></label>
          <label className="block"><span className="text-xs font-semibold text-slate-700">Description</span><textarea value={description} onChange={(event) => setDescription(event.target.value)} required rows={3} placeholder="Add evidence requirements and expected outcome" className="mt-1.5 w-full resize-none rounded-lg border border-slate-200 px-3 py-2.5 text-xs leading-5 text-slate-700 outline-none focus:border-brand-400" /></label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block"><span className="text-xs font-semibold text-slate-700">Site</span><select value={siteId} disabled={Boolean(report?.siteId)} onChange={(event) => setSiteId(event.target.value)} className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-700 outline-none focus:border-brand-400">{sites.map((site) => <option key={site.id} value={site.id}>{site.name} · {site.location}</option>)}</select></label>
            <label className="block"><span className="flex items-center gap-1.5 text-xs font-semibold text-slate-700"><UserRound size={14} className="text-slate-500" />Assignee</span><select value={assignee} onChange={(event) => setAssignee(event.target.value)} className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-700 outline-none focus:border-brand-400">{members.map((member) => <option key={member.id} value={member.name}>{member.name}</option>)}</select><span className={`mt-1 block text-[10px] ${members.length ? 'text-slate-400' : 'font-medium text-amber-700'}`}>{members.length ? 'Work can only be given to a field coordinator.' : 'Add a field coordinator on the Team page first.'}</span></label>
            <label className="block"><span className="flex items-center gap-1.5 text-xs font-semibold text-slate-700"><CalendarDays size={14} className="text-slate-500" />Deadline</span><input type="date" min={todayInDhaka()} value={dueDate} onChange={(event) => setDueDate(event.target.value)} required className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 px-3 text-xs text-slate-700 outline-none focus:border-brand-400" /></label>
            <label className="block"><span className="text-xs font-semibold text-slate-700">Budget given (BDT)</span><input type="number" min="0" step="100" value={estimatedCost} onChange={(event) => setEstimatedCost(event.target.value)} required className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 px-3 text-xs text-slate-700 outline-none focus:border-brand-400" /></label>
          </div>

          <label className="block"><span className="text-xs font-semibold text-slate-700">Priority</span><select value={priority} onChange={(event) => setPriority(event.target.value)} className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-700 outline-none focus:border-brand-400">{TASK_PRIORITIES.map((item) => <option key={item}>{item}</option>)}</select></label>

<p className="flex items-start gap-2 rounded-lg bg-slate-50 px-3 py-2.5 text-[11px] leading-4 text-slate-500"><Mail size={14} className="mt-px shrink-0 text-slate-500" />The assignee gets a professional email with a calendar invitation for the deadline, so it appears in their calendar automatically.</p>

          <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end"><Button type="button" variant="secondary" onClick={onClose}>Cancel</Button><Button type="submit" disabled={!members.length}>Create task <ClipboardPlus size={15} /></Button></div>
        </form>
      </section>
    </div>
  )
}

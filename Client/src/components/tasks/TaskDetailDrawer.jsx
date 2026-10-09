import {
  CalendarDays,
  Check,
  CircleDollarSign,
  Clock3,
  Mail,
  MapPin,
  MessageCircle,
  MessageSquareText,
  Send,
  UserRound,
  X,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { TASK_STATUS, TASK_STATUS_ORDER } from '../../constants/status'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'

function allowedStatuses(role, task) {
  if (role.id === 'manager') return TASK_STATUS_ORDER
  if (role.id === 'coordinator' && task.assignee === role.user.name) {
    return [...new Set([task.status, 'in_progress', 'reported_complete'])]
  }
  return [task.status]
}

export function TaskDetailDrawer({ task, role, members, onClose, onUpdate, onAddComment }) {
  const [status, setStatus] = useState(task.status)
  const [assignee, setAssignee] = useState(task.assignee)
  const [dueDate, setDueDate] = useState(task.dueDate)
  const [estimatedCost, setEstimatedCost] = useState(String(task.estimatedCost))
  const [actualCost, setActualCost] = useState(String(task.actualCost))
  const [notifications, setNotifications] = useState(task.notifications)
  const [comment, setComment] = useState('')
  const [saved, setSaved] = useState(false)
  const canManageRecord = role.id === 'manager' || role.id === 'operator'
  const canAssign = role.id === 'manager'
  const canUpdateProgress = role.id === 'manager' || (role.id === 'coordinator' && task.assignee === role.user.name)
  const canComment = role.id !== 'coordinator' || task.assignee === role.user.name
  const statusOptions = useMemo(() => allowedStatuses(role, task), [role, task])

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  function submitChanges(event) {
    event.preventDefault()
    const member = members.find((item) => item.name === assignee)
    onUpdate({ status, assignee, initials: member.initials, dueDate, estimatedCost: Number(estimatedCost), actualCost: Number(actualCost), notifications })
    setSaved(true)
  }

  function submitComment(event) {
    event.preventDefault()
    if (!comment.trim()) return
    onAddComment(comment.trim())
    setComment('')
  }

  return (
    <div className="fixed inset-0 z-[1000] bg-slate-950/35 backdrop-blur-[1px]" role="dialog" aria-modal="true" aria-labelledby="task-drawer-title">
      <button type="button" className="absolute inset-0 cursor-default" onClick={onClose} aria-label="Close task details" />
      <aside className="absolute inset-y-0 right-0 z-10 flex w-full max-w-xl flex-col overflow-hidden border-l border-slate-200 bg-white shadow-pop">
        <div className="flex items-start justify-between border-b border-slate-100 px-5 py-4">
          <div className="min-w-0"><p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">{task.id}</p><h2 id="task-drawer-title" className="mt-1 truncate text-lg font-semibold text-slate-900">{task.title}</h2><div className="mt-2 flex flex-wrap items-center gap-2"><Badge tone={TASK_STATUS[task.status].tone}>{TASK_STATUS[task.status].label}</Badge><span className="text-[10px] font-semibold text-slate-500">{task.priority} priority</span></div></div>
          <button type="button" onClick={onClose} aria-label="Close task details" className="grid size-9 shrink-0 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800"><X size={18} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          <p className="text-xs leading-5 text-slate-600">{task.description}</p>
          <Link to={`/sites/${task.siteId}`} className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-brand-700 hover:text-brand-900"><MapPin size={14} className="text-slate-500" />{task.site} site record</Link>

          <form onSubmit={submitChanges} className="mt-5 space-y-4 border-t border-slate-100 pt-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block"><span className="text-xs font-semibold text-slate-700">Status</span><select value={status} disabled={!canUpdateProgress} onChange={(event) => { setStatus(event.target.value); setSaved(false) }} className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-700 outline-none disabled:bg-slate-50 disabled:text-slate-400">{statusOptions.map((id) => <option key={id} value={id}>{TASK_STATUS[id].label}</option>)}</select></label>
              <label className="block"><span className="flex items-center gap-1.5 text-xs font-semibold text-slate-700"><UserRound size={14} className="text-slate-500" />Assignee</span><select value={assignee} disabled={!canAssign} onChange={(event) => { setAssignee(event.target.value); setSaved(false) }} className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-700 outline-none disabled:bg-slate-50 disabled:text-slate-400">{members.map((member) => <option key={member.id} value={member.name}>{member.name}</option>)}</select></label>
              <label className="block"><span className="flex items-center gap-1.5 text-xs font-semibold text-slate-700"><CalendarDays size={14} className="text-slate-500" />Deadline</span><input type="date" value={dueDate} disabled={!canManageRecord} onChange={(event) => { setDueDate(event.target.value); setSaved(false) }} className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 px-3 text-xs text-slate-700 outline-none disabled:bg-slate-50 disabled:text-slate-400" /></label>
              <label className="block"><span className="flex items-center gap-1.5 text-xs font-semibold text-slate-700"><CircleDollarSign size={14} className="text-slate-500" />Estimated cost</span><input type="number" min="0" value={estimatedCost} disabled={!canManageRecord} onChange={(event) => { setEstimatedCost(event.target.value); setSaved(false) }} className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 px-3 text-xs text-slate-700 outline-none disabled:bg-slate-50 disabled:text-slate-400" /></label>
              <label className="block sm:col-span-2"><span className="flex items-center gap-1.5 text-xs font-semibold text-slate-700"><CircleDollarSign size={14} className="text-slate-500" />Actual cost</span><input type="number" min="0" value={actualCost} disabled={!canManageRecord && !canUpdateProgress} onChange={(event) => { setActualCost(event.target.value); setSaved(false) }} className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 px-3 text-xs text-slate-700 outline-none disabled:bg-slate-50 disabled:text-slate-400" /></label>
            </div>

            <fieldset className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2.5">
              <legend className="px-1 text-[10px] font-semibold text-slate-600">Notification preferences</legend>
              <div className="flex flex-wrap items-center gap-4 text-[10px] text-slate-500">
                {[["email", "Email", Mail], ["calendar", "Calendar", CalendarDays], ["whatsapp", "WhatsApp", MessageCircle]].map(([id, label, Icon]) => (
                  <label key={id} className="flex items-center gap-1.5"><input type="checkbox" checked={notifications[id]} disabled={!canManageRecord} onChange={() => { setNotifications((current) => ({ ...current, [id]: !current[id] })); setSaved(false) }} className="accent-slate-700" /><Icon size={12} className="text-slate-500" />{label}</label>
                ))}
              </div>
            </fieldset>

            {saved && <p role="status" className="flex items-center gap-1.5 text-xs font-medium text-emerald-700"><Check size={14} className="text-slate-600" />Task changes saved.</p>}
            {(canManageRecord || canUpdateProgress) && <Button type="submit" className="w-full">Save task changes <Check size={15} /></Button>}
          </form>

          <section className="mt-6 border-t border-slate-100 pt-5">
            <h3 className="flex items-center gap-2 text-xs font-semibold text-slate-800"><MessageSquareText size={15} className="text-slate-500" />Inspection notes and comments</h3>
            {canComment && <form onSubmit={submitComment} className="mt-3 flex gap-2"><input value={comment} onChange={(event) => setComment(event.target.value)} placeholder="Add a concise progress note" className="h-10 min-w-0 flex-1 rounded-lg border border-slate-200 px-3 text-xs text-slate-700 outline-none focus:border-brand-400" /><button type="submit" disabled={!comment.trim()} aria-label="Add comment" className="grid size-10 place-items-center rounded-lg bg-slate-800 text-white transition hover:bg-slate-900 disabled:opacity-40"><Send size={15} /></button></form>}
            <div className="mt-3 space-y-2">
              {task.comments.map((item) => <div key={item.id} className="rounded-lg bg-slate-50 px-3 py-2.5"><p className="text-xs leading-5 text-slate-600">{item.text}</p><p className="mt-1 text-[10px] text-slate-400">{item.author} · {item.time}</p></div>)}
              {!task.comments.length && <p className="py-3 text-[11px] text-slate-400">No notes have been added.</p>}
            </div>
          </section>

          <section className="mt-6 border-t border-slate-100 pt-5">
            <h3 className="flex items-center gap-2 text-xs font-semibold text-slate-800"><Clock3 size={15} className="text-slate-500" />Activity history</h3>
            <div className="mt-3 space-y-3">{task.activityHistory.map((item) => <div key={item.id} className="flex gap-3"><span className="mt-1.5 size-2 shrink-0 rounded-full bg-slate-400" /><div><p className="text-xs text-slate-600">{item.action}</p><p className="mt-0.5 text-[10px] text-slate-400">{item.actor} · {item.time}</p></div></div>)}</div>
          </section>
        </div>
      </aside>
    </div>
  )
}

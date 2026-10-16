import {
  CalendarDays,
  CalendarPlus,
  Check,
  CircleDollarSign,
  Clock3,
  Download,
  FileText,
  Mail,
  MapPin,
  MessageSquareText,
  Radio,
  ReceiptText,
  Send,
  UserRound,
  X,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { can } from '../../constants/access'
import { canAccessPath } from '../../constants/navigation'
import { TASK_STATUS, isTaskClosed } from '../../constants/status'
import { buildScheduleLink } from '../../utils/schedule'
import { isTaskOverdue } from '../../utils/tasks'
import { CommunicationHistory } from '../communications/CommunicationHistory'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { CompletionReview } from './CompletionReview'
import { TaskEvidence } from './TaskEvidence'
import { TaskExpenses } from './TaskExpenses'
import { TaskWorkflow } from './TaskWorkflow'

const actionClass = 'flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-left text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:pointer-events-none disabled:opacity-50'

function ActionButton({ icon: Icon, children, onClick, disabled }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} className={actionClass}>
      <Icon size={15} className="shrink-0 text-slate-500" />
      <span className="truncate">{children}</span>
    </button>
  )
}

function ActionLink({ icon: Icon, to, children }) {
  return (
    <Link to={to} className={actionClass}>
      <Icon size={15} className="shrink-0 text-slate-500" />
      <span className="truncate">{children}</span>
    </Link>
  )
}

export function TaskDetailDrawer({
  task, report, expenses, role, members, logs = [],
  onClose, onUpdate, onAddComment, onSetStatus, onSubmitCompletion, onReviewCompletion, onAddExpense, onReviewExpense,
  onAddToCalendar, onDownloadIcs, onEmailReminder,
}) {
  const [assignee, setAssignee] = useState(task.assignee)
  const [dueDate, setDueDate] = useState(task.dueDate)
  const [estimatedCost, setEstimatedCost] = useState(String(task.estimatedCost))
  const [notifications, setNotifications] = useState(task.notifications)
  const [comment, setComment] = useState('')
  const [saved, setSaved] = useState(false)
  const [sendingEmail, setSendingEmail] = useState(false)
  const permitted = (permission) => can(role.id, permission)
  const isManager = permitted('tasks.review')
  const ownTask = role.id === 'coordinator' && task.assignee === role.user.name
  // A coordinator can act only on their own tasks; the other roles act on any task their permissions allow.
  const forThisTask = (permission) => permitted(permission) && (role.id !== 'coordinator' || ownTask)
  const canAssign = permitted('tasks.assign')
  const canRemind = permitted('tasks.remind')
  const canComment = forThisTask('tasks.comment')
  const closed = isTaskClosed(task)
  const canAddExpense = !closed && forThisTask('expenses.add')
  const canUseCalendar = canRemind || task.assignee === role.user.name
  const overdue = isTaskOverdue(task)

  // Reassignment offers field coordinators only. A task still held by someone else keeps that name visible so it can be moved.
  const assigneeOptions = members.some((member) => member.name === task.assignee)
    ? members
    : [{ id: 'current-assignee', name: task.assignee, initials: task.initials, legacy: true }, ...members]

  async function sendEmailReminder() {
    setSendingEmail(true)
    try {
      await onEmailReminder()
    } finally {
      setSendingEmail(false)
    }
  }

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  function submitChanges(event) {
    event.preventDefault()
    const member = assigneeOptions.find((item) => item.name === assignee)
    onUpdate({ assignee, initials: member.initials, dueDate, estimatedCost: Number(estimatedCost), notifications })
    setSaved(true)
  }

  function submitComment(event) {
    event.preventDefault()
    if (!comment.trim()) return
    onAddComment(comment.trim())
    setComment('')
  }

  const status = TASK_STATUS[task.status]
  return (
    <div className="fixed inset-0 z-[1000] bg-slate-950/35 backdrop-blur-[1px]" role="dialog" aria-modal="true" aria-labelledby="task-drawer-title">
      <button type="button" className="absolute inset-0 cursor-default" onClick={onClose} aria-label="Close task details" />
      <aside className="absolute inset-y-0 right-0 z-10 flex w-full max-w-2xl flex-col overflow-hidden border-l border-slate-200 bg-white shadow-pop">
        <div className="flex items-start justify-between border-b border-slate-100 px-5 py-4">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">{task.id}</p>
            <h2 id="task-drawer-title" className="mt-1 text-lg font-semibold leading-6 text-slate-900">{task.title}</h2>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Badge tone={status.tone}>{status.label}</Badge>
              {overdue && <Badge tone="amber">Overdue</Badge>}
              <span className="text-[10px] font-semibold text-slate-500">{task.priority} priority</span>
              <span className="text-[10px] text-slate-400">Due {task.due} · {task.assignee}</span>
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label="Close task details" className="grid size-9 shrink-0 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800"><X size={18} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          <p className="text-xs leading-5 text-slate-600">{task.description}</p>
          <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2">
            {canAccessPath(role.id, `/sites/${task.siteId}`)
              ? <Link to={`/sites/${task.siteId}`} className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-700 hover:text-brand-900"><MapPin size={14} className="text-slate-500" />{task.site} site record</Link>
              : <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500"><MapPin size={14} className="text-slate-400" />{task.site}</span>}
            {task.reportId && (permitted('community.view')
              ? <Link to={`/community?report=${task.reportId}`} className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-700 hover:text-brand-900"><FileText size={14} className="text-slate-500" />Source report {task.reportId}</Link>
              : <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500"><FileText size={14} />Source report {task.reportId}</span>)}
          </div>

          <TaskWorkflow task={task} role={role} onSetStatus={onSetStatus} onSubmitCompletion={onSubmitCompletion} />
          <TaskEvidence task={task} report={report} />
          <CompletionReview task={task} isManager={isManager} onReview={onReviewCompletion} />
          <TaskExpenses task={task} expenses={expenses} canAdd={canAddExpense} canReview={permitted('expenses.approve')} onAdd={onAddExpense} onReview={onReviewExpense} />

          {canAssign && !closed && (
            <form onSubmit={submitChanges} className="mt-6 space-y-4 border-t border-slate-100 pt-5">
              <h3 className="text-xs font-semibold text-slate-800">Assignment and plan</h3>
              <div className="grid gap-4 sm:grid-cols-3">
                <label className="block"><span className="flex items-center gap-1.5 text-xs font-semibold text-slate-700"><UserRound size={14} className="text-slate-500" />Assignee</span><select value={assignee} onChange={(event) => { setAssignee(event.target.value); setSaved(false) }} className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-700 outline-none disabled:bg-slate-50 disabled:text-slate-400">{assigneeOptions.map((member) => <option key={member.id} value={member.name}>{member.name}{member.legacy ? ' (not a field coordinator)' : ''}</option>)}</select></label>
                <label className="block"><span className="flex items-center gap-1.5 text-xs font-semibold text-slate-700"><CalendarDays size={14} className="text-slate-500" />Deadline</span><input type="date" value={dueDate} onChange={(event) => { setDueDate(event.target.value); setSaved(false) }} className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 px-3 text-xs text-slate-700 outline-none" /></label>
                <label className="block"><span className="flex items-center gap-1.5 text-xs font-semibold text-slate-700"><CircleDollarSign size={14} className="text-slate-500" />Estimated cost</span><input type="number" min="0" value={estimatedCost} onChange={(event) => { setEstimatedCost(event.target.value); setSaved(false) }} className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 px-3 text-xs text-slate-700 outline-none" /></label>
              </div>

              <fieldset className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2.5">
                <legend className="px-1 text-[10px] font-semibold text-slate-600">Notification preferences</legend>
                <div className="flex flex-wrap items-center gap-4 text-[10px] text-slate-500">
                  {[['email', 'Email', Mail], ['calendar', 'Google Calendar', CalendarDays]].map(([id, label, Icon]) => (
                    <label key={id} className="flex items-center gap-1.5"><input type="checkbox" checked={notifications[id]} onChange={() => { setNotifications((current) => ({ ...current, [id]: !current[id] })); setSaved(false) }} className="accent-slate-700" /><Icon size={12} className="text-slate-500" />{label}</label>
                  ))}
                </div>
              </fieldset>

              {saved && <p role="status" className="flex items-center gap-1.5 text-xs font-medium text-brand-700"><Check size={14} className="text-slate-600" />Changes saved.</p>}
              <Button type="submit" className="w-full">Save assignment and plan <Check size={15} /></Button>
            </form>
          )}

          {(canUseCalendar || canRemind) && !closed && (
            <section className="mt-6 border-t border-slate-100 pt-5">
              <h3 className="text-xs font-semibold text-slate-800">Follow-up actions</h3>
              <p className="mt-1 text-[11px] leading-5 text-slate-500">Put the deadline on a calendar, remind {task.assignee}, or plan the related field work.</p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {canUseCalendar && onAddToCalendar && <ActionButton icon={CalendarDays} onClick={onAddToCalendar}>Add deadline to Google Calendar</ActionButton>}
                {canUseCalendar && onDownloadIcs && <ActionButton icon={Download} onClick={onDownloadIcs}>Download deadline .ics</ActionButton>}
                {canRemind && onEmailReminder && <ActionButton icon={Mail} onClick={sendEmailReminder} disabled={sendingEmail}>{sendingEmail ? 'Sending reminder…' : 'Email reminder to assignee'}</ActionButton>}
                {permitted('schedule.manage') && <ActionLink icon={CalendarPlus} to={buildScheduleLink({ new: 'field_visit', site: task.siteId, task: task.id, title: `${task.site} field visit · ${task.id}` })}>Schedule field visit</ActionLink>}
                {permitted('expenses.view') && <ActionLink icon={ReceiptText} to="/expenses">Open expense ledger</ActionLink>}
              </div>
            </section>
          )}

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

          <section className="mt-6 border-t border-slate-100 pt-5">
            <h3 className="flex items-center gap-2 text-xs font-semibold text-slate-800"><Radio size={15} className="text-slate-500" />Communications</h3>
            <CommunicationHistory logs={logs} emptyText="No emails or calendar events have been recorded for this task." />
          </section>
        </div>
      </aside>
    </div>
  )
}

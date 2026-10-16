import { Ban, CircleCheck, LoaderCircle, OctagonAlert, Play, RotateCcw, Send } from 'lucide-react'
import { useState } from 'react'
import { can } from '../../constants/access'
import { storePhotos } from '../../services/photoStore'
import { cn } from '../../utils/cn'
import { formatDateTime, todayInDhaka } from '../../utils/reports'
import { Button } from '../ui/Button'
import { PhotoPicker } from '../ui/PhotoPicker'

const STEPS = [
  ['open', 'Open'],
  ['in_progress', 'In progress'],
  ['awaiting_verification', 'Awaiting verification'],
  ['completed', 'Completed'],
]

function Stepper({ status }) {
  // Blocked work sits at the in-progress stage; cancelled work is shown by its banner instead.
  const index = STEPS.findIndex(([id]) => id === (status === 'blocked' ? 'in_progress' : status))
  return (
    <ol className="flex items-start" aria-label="Task stages">
      {STEPS.map(([id, label], position) => {
        const reached = index >= position && status !== 'cancelled'
        return (
          <li key={id} className="flex flex-1 flex-col items-center text-center">
            <div className="flex w-full items-center">
              <span className={cn('h-0.5 flex-1', position === 0 ? 'bg-transparent' : reached ? 'bg-brand-500' : 'bg-slate-200')} />
              <span className={cn('grid size-6 shrink-0 place-items-center rounded-full border-2 text-[10px] font-bold', reached ? 'border-brand-600 bg-brand-600 text-white' : 'border-slate-300 bg-white text-slate-400')} aria-current={index === position ? 'step' : undefined}>{position + 1}</span>
              <span className={cn('h-0.5 flex-1', position === STEPS.length - 1 ? 'bg-transparent' : index > position && status !== 'cancelled' ? 'bg-brand-500' : 'bg-slate-200')} />
            </div>
            <span className={cn('mt-1.5 px-1 text-[10px] leading-3', index === position && status !== 'cancelled' ? 'font-semibold text-slate-800' : 'text-slate-400')}>{label}</span>
          </li>
        )
      })}
    </ol>
  )
}

function ReasonForm({ label, placeholder, confirmLabel, onConfirm, onCancel, danger }) {
  const [reason, setReason] = useState('')
  const [error, setError] = useState('')
  function submit(event) {
    event.preventDefault()
    if (reason.trim().length < 5) return setError('Give a short reason.')
    onConfirm(reason.trim())
  }
  return (
    <form onSubmit={submit} className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3">
      <label className="block"><span className="text-xs font-semibold text-slate-700">{label}</span><textarea value={reason} onChange={(event) => { setReason(event.target.value); setError('') }} rows={2} placeholder={placeholder} className="mt-1.5 w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs outline-none focus:border-brand-400" /></label>
      {error && <p role="alert" className="mt-1 text-[11px] font-medium text-rose-600">{error}</p>}
      <div className="mt-2 flex gap-2"><Button type="submit" className={cn('min-h-9 px-3 text-xs', danger && 'bg-rose-600 hover:bg-rose-700')}>{confirmLabel}</Button><Button type="button" variant="ghost" className="min-h-9 px-3 text-xs" onClick={onCancel}>Cancel</Button></div>
    </form>
  )
}

function CompletionForm({ onSubmit, onCancel }) {
  const [photos, setPhotos] = useState([])
  const [completedOn, setCompletedOn] = useState(todayInDhaka())
  const [summary, setSummary] = useState('')
  const [expensesStatus, setExpensesStatus] = useState('recorded')
  const [followUp, setFollowUp] = useState('')
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [failure, setFailure] = useState('')

  async function submit(event) {
    event.preventDefault()
    const found = {}
    if (!photos.length) found.photos = 'Add at least one after-photo.'
    if (summary.trim().length < 10) found.summary = 'Describe what was done in a few words.'
    if (!completedOn || completedOn > todayInDhaka()) found.completedOn = 'Choose the day the work finished, not a future date.'
    setErrors(found)
    if (Object.keys(found).length) return
    setSaving(true)
    setFailure('')
    try {
      const stored = await storePhotos(photos.map((item) => item.file), 'completion')
      onSubmit({ photos: stored, completedOn, summary: summary.trim(), expensesStatus, followUp: followUp.trim() })
    } catch (error) {
      setFailure(error instanceof Error ? error.message : 'The evidence could not be saved.')
      setSaving(false)
    }
  }

  const fieldClass = 'mt-1.5 block w-full rounded-lg border border-slate-200 bg-white px-3 text-xs outline-none focus:border-brand-400'
  return (
    <form onSubmit={submit} noValidate className="mt-4 space-y-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
      <div><span className="text-xs font-semibold text-slate-700">After-photos</span><div className="mt-2"><PhotoPicker photos={photos} onChange={setPhotos} error={errors.photos} hint="Show the result of the work, from the same spot as the report photo if you can" /></div></div>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block"><span className="text-xs font-semibold text-slate-700">Work finished on</span><input type="date" value={completedOn} max={todayInDhaka()} onChange={(event) => setCompletedOn(event.target.value)} className={cn(fieldClass, 'h-10')} />{errors.completedOn && <span role="alert" className="mt-1 block text-[11px] font-medium text-rose-600">{errors.completedOn}</span>}</label>
        <label className="block"><span className="text-xs font-semibold text-slate-700">Expenses</span><select value={expensesStatus} onChange={(event) => setExpensesStatus(event.target.value)} className={cn(fieldClass, 'h-10')}><option value="recorded">All expenses are recorded</option><option value="pending_more">More expenses will be submitted</option></select></label>
      </div>
      <label className="block"><span className="text-xs font-semibold text-slate-700">What was done</span><textarea value={summary} onChange={(event) => setSummary(event.target.value)} rows={3} placeholder="Work carried out, materials removed or checked, anything the reviewer should know" className={cn(fieldClass, 'resize-none py-2.5 leading-5')} />{errors.summary && <span role="alert" className="mt-1 block text-[11px] font-medium text-rose-600">{errors.summary}</span>}</label>
      <label className="block"><span className="text-xs font-semibold text-slate-700">Remaining issue or follow-up <span className="font-normal text-slate-400">(optional)</span></span><textarea value={followUp} onChange={(event) => setFollowUp(event.target.value)} rows={2} className={cn(fieldClass, 'resize-none py-2.5 leading-5')} /></label>
      {failure && <p role="alert" className="text-xs font-medium text-rose-600">{failure}</p>}
      <div className="flex gap-2"><Button type="submit" disabled={saving} className="min-h-9 px-3 text-xs">{saving ? <LoaderCircle size={14} className="animate-spin" /> : <Send size={14} />}Submit for verification</Button><Button type="button" variant="ghost" className="min-h-9 px-3 text-xs" onClick={onCancel}>Cancel</Button></div>
      <p className="text-[10px] leading-4 text-slate-400">Submitting does not close the task. The project manager reviews the evidence and either completes it or sends it back.</p>
    </form>
  )
}

/** Where the task is, what can happen next and who is allowed to do it. */
export function TaskWorkflow({ task, role, onSetStatus, onSubmitCompletion }) {
  const [panel, setPanel] = useState(null)
  const isManager = can(role.id, 'tasks.review')
  const canCancel = can(role.id, 'tasks.cancel')
  // The manager can move any task; a coordinator only their own.
  const canMove = can(role.id, 'tasks.progress') && (role.id !== 'coordinator' || task.assignee === role.user.name)
  const close = () => setPanel(null)

  const run = (action) => {
    try { action(); close() } catch (error) { window.alert(error instanceof Error ? error.message : 'That change was not allowed.') }
  }

  return (
    <section className="mt-6 border-t border-slate-100 pt-5" aria-label="Workflow">
      <Stepper status={task.status} />

      {task.status === 'blocked' && <p className="mt-4 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs leading-5 text-amber-900"><OctagonAlert size={15} className="mt-0.5 shrink-0" /><span><strong className="font-semibold">Blocked.</strong> {task.blockedReason}</span></p>}
      {task.status === 'cancelled' && <p className="mt-4 flex items-start gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs leading-5 text-slate-700"><Ban size={15} className="mt-0.5 shrink-0" /><span><strong className="font-semibold">Cancelled.</strong> {task.cancelReason}</span></p>}
      {task.lastReturn && task.status === 'in_progress' && <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs leading-5 text-amber-900"><strong className="font-semibold">Returned for more work</strong> by {task.lastReturn.by} on {formatDateTime(task.lastReturn.at)}: {task.lastReturn.note}</p>}

      <div className="mt-4 flex flex-wrap gap-2">
        {canMove && task.status === 'open' && <Button type="button" className="min-h-9 px-3 text-xs" onClick={() => run(() => onSetStatus('in_progress'))}><Play size={14} />Start work</Button>}
        {canMove && task.status === 'in_progress' && <Button type="button" className="min-h-9 px-3 text-xs" onClick={() => setPanel('complete')}><CircleCheck size={14} />Submit completion evidence</Button>}
        {canMove && task.status === 'in_progress' && <Button type="button" variant="secondary" className="min-h-9 px-3 text-xs" onClick={() => setPanel('block')}><OctagonAlert size={14} />Report blocked</Button>}
        {canMove && task.status === 'blocked' && <Button type="button" className="min-h-9 px-3 text-xs" onClick={() => run(() => onSetStatus('in_progress'))}><Play size={14} />Resume work</Button>}
        {canCancel && (task.status === 'completed' || task.status === 'cancelled') && <Button type="button" variant="secondary" className="min-h-9 px-3 text-xs" onClick={() => run(() => onSetStatus('open'))}><RotateCcw size={14} />Reopen task</Button>}
        {canCancel && ['open', 'in_progress', 'blocked'].includes(task.status) && <Button type="button" variant="ghost" className="min-h-9 px-3 text-xs text-rose-700 hover:bg-rose-50 hover:text-rose-800" onClick={() => setPanel('cancel')}><Ban size={14} />Cancel task</Button>}
        {task.status === 'awaiting_verification' && !isManager && <p className="text-xs leading-5 text-slate-500">Completion evidence was submitted. The project manager will review it.</p>}
        {!canMove && !isManager && task.status !== 'awaiting_verification' && task.status !== 'completed' && task.status !== 'cancelled' && <p className="text-xs leading-5 text-slate-500">{task.assignee} updates this task’s progress. The project manager approves and closes it.</p>}
      </div>

      {panel === 'block' && <ReasonForm label="What is blocking the work?" placeholder="For example: access to the bank is closed until Sunday" confirmLabel="Mark as blocked" onCancel={close} onConfirm={(reason) => run(() => onSetStatus('blocked', reason))} />}
      {panel === 'cancel' && <ReasonForm label="Why is the task being cancelled?" placeholder="Recorded in the history" confirmLabel="Cancel task" danger onCancel={close} onConfirm={(reason) => run(() => onSetStatus('cancelled', reason))} />}
      {panel === 'complete' && <CompletionForm onCancel={close} onSubmit={(submission) => run(() => onSubmitCompletion(submission))} />}
    </section>
  )
}

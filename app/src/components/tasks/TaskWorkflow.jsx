import { Ban, CircleCheck, LoaderCircle, LockKeyhole, OctagonAlert, Play, RotateCcw, Send } from 'lucide-react'
import { useRef, useState } from 'react'
import { can } from '../../constants/access'
import { isTaskClosed } from '../../constants/status'
import { NOT_CLEARED, analyzePhoto, loadCleanupModel } from '../../services/cleanupAi'
import { storePhotos } from '../../services/photoStore'
import { cn } from '../../utils/cn'
import { formatDateTime, todayInDhaka } from '../../utils/reports'
import { Button } from '../ui/Button'
import { PhotoPicker } from '../ui/PhotoPicker'
import { AfterPhotoCheck } from './AfterPhotoCheck'

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

/** Where the coordinator is when they submit, for the manager's location check. Null when the browser cannot tell. */
function currentLocation() {
  return new Promise((resolve) => {
    if (!navigator.geolocation) return resolve(null)
    navigator.geolocation.getCurrentPosition(
      (position) => resolve({ latitude: position.coords.latitude, longitude: position.coords.longitude, accuracy: Math.round(position.coords.accuracy) }),
      () => resolve(null),
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 },
    )
  })
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
  // AI verdict per after-photo, keyed by its preview URL. Photos are checked one at a time as they are added.
  const [checks, setChecks] = useState({})
  const [download, setDownload] = useState(null)
  const queue = useRef(Promise.resolve())

  function changePhotos(next) {
    setPhotos(next)
    next.filter((photo) => !checks[photo.url]).forEach((photo) => {
      setChecks((current) => ({ ...current, [photo.url]: { status: 'checking' } }))
      queue.current = queue.current.then(async () => {
        try {
          await loadCleanupModel(setDownload)
          const result = await analyzePhoto(photo.file)
          setChecks((current) => ({ ...current, [photo.url]: { status: 'done', ...result } }))
        } catch {
          setChecks((current) => ({ ...current, [photo.url]: { status: 'error' } }))
        }
      })
    })
  }

  const photoChecks = photos.map((photo) => checks[photo.url] ?? { status: 'checking' })
  const checking = photoChecks.some((check) => check.status === 'checking')
  const dirty = photoChecks.filter((check) => check.status === 'done' && check.waste >= NOT_CLEARED).length
  const locked = checking || dirty > 0

  async function submit(event) {
    event.preventDefault()
    const found = {}
    if (!photos.length) found.photos = 'Add at least one after-photo.'
    if (locked) return
    if (summary.trim().length < 10) found.summary = 'Describe what was done in a few words.'
    if (!completedOn || completedOn > todayInDhaka()) found.completedOn = 'Choose the day the work finished, not a future date.'
    setErrors(found)
    if (Object.keys(found).length) return
    setSaving(true)
    setFailure('')
    try {
      const [stored, location] = await Promise.all([storePhotos(photos.map((item) => item.file), 'completion'), currentLocation()])
      const aiPrecheck = photoChecks.map((check, index) => ({ name: photos[index].file.name, status: check.status, waste: check.waste ?? null }))
      onSubmit({ photos: stored, completedOn, summary: summary.trim(), expensesStatus, followUp: followUp.trim(), location, aiPrecheck })
    } catch (error) {
      setFailure(error instanceof Error ? error.message : 'The evidence could not be saved.')
      setSaving(false)
    }
  }

  const fieldClass = 'mt-1.5 block w-full rounded-lg border border-slate-200 bg-white px-3 text-xs outline-none focus:border-brand-400'
  return (
    <form onSubmit={submit} noValidate className="mt-4 space-y-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
      <div><span className="text-xs font-semibold text-slate-700">After-photos</span><div className="mt-2"><PhotoPicker photos={photos} onChange={changePhotos} error={errors.photos} hint="Show the result of the work, from the same spot as the report photo if you can" /><AfterPhotoCheck photos={photos} checks={checks} download={download} /></div></div>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block"><span className="text-xs font-semibold text-slate-700">Work finished on</span><input type="date" value={completedOn} max={todayInDhaka()} onChange={(event) => setCompletedOn(event.target.value)} className={cn(fieldClass, 'h-10')} />{errors.completedOn && <span role="alert" className="mt-1 block text-[11px] font-medium text-rose-600">{errors.completedOn}</span>}</label>
        <label className="block"><span className="text-xs font-semibold text-slate-700">Expenses</span><select value={expensesStatus} onChange={(event) => setExpensesStatus(event.target.value)} className={cn(fieldClass, 'h-10')}><option value="recorded">All expenses are recorded</option><option value="pending_more">More expenses will be submitted</option></select></label>
      </div>
      <label className="block"><span className="text-xs font-semibold text-slate-700">What was done</span><textarea value={summary} onChange={(event) => setSummary(event.target.value)} rows={3} placeholder="Work carried out, materials removed or checked, anything the reviewer should know" className={cn(fieldClass, 'resize-none py-2.5 leading-5')} />{errors.summary && <span role="alert" className="mt-1 block text-[11px] font-medium text-rose-600">{errors.summary}</span>}</label>
      <label className="block"><span className="text-xs font-semibold text-slate-700">Remaining issue or follow-up <span className="font-normal text-slate-400">(optional)</span></span><textarea value={followUp} onChange={(event) => setFollowUp(event.target.value)} rows={2} className={cn(fieldClass, 'resize-none py-2.5 leading-5')} /></label>
      {failure && <p role="alert" className="text-xs font-medium text-rose-600">{failure}</p>}
      {photos.length > 0 && locked && (
        <p className="flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-2 text-[11px] font-medium text-slate-600">
          <LockKeyhole size={13} className="shrink-0" />{checking ? 'Submit unlocks when the AI has checked every photo.' : `Submit is locked: the AI still sees waste in ${dirty === 1 ? 'one photo' : `${dirty} photos`}.`}
        </p>
      )}
      <div className="flex gap-2"><Button type="submit" disabled={saving || (photos.length > 0 && locked)} className="min-h-9 px-3 text-xs">{saving ? <LoaderCircle size={14} className="animate-spin" /> : <Send size={14} />}Submit for verification</Button><Button type="button" variant="ghost" className="min-h-9 px-3 text-xs" onClick={onCancel}>Cancel</Button></div>
      <p className="text-[10px] leading-4 text-slate-400">Submitting does not close the task. The project manager reviews the evidence and either completes it or sends it back.</p>
    </form>
  )
}

/** Where the task is, what can happen next and who is allowed to do it. */
export function TaskWorkflow({ task, role, onSetStatus, onSubmitCompletion }) {
  const [panel, setPanel] = useState(null)
  const isManager = can(role.id, 'tasks.review')
  const canCancel = can(role.id, 'tasks.cancel')
  // Only the assignee does the work. The manager reviews it, so approving and doing are never the same person.
  const canMove = can(role.id, 'tasks.progress') && task.assignee === role.user.name
  const close = () => setPanel(null)

  // Submitted work is handled by the review section; a closed task only offers the manager a reopen.
  if (task.status === 'awaiting_verification' || (isTaskClosed(task) && !canCancel)) return null

  const run = (action) => {
    try { action(); close() } catch (error) { window.alert(error instanceof Error ? error.message : 'That change was not allowed.') }
  }

  return (
    <section className="mt-5 border-t border-slate-100 pt-5" aria-label="Workflow">
      {task.status === 'blocked' && <p className="mb-4 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs leading-5 text-amber-900"><OctagonAlert size={15} className="mt-0.5 shrink-0" /><span><strong className="font-semibold">Blocked.</strong> {task.blockedReason}</span></p>}
      {task.status === 'cancelled' && <p className="mb-4 flex items-start gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs leading-5 text-slate-700"><Ban size={15} className="mt-0.5 shrink-0" /><span><strong className="font-semibold">Cancelled.</strong> {task.cancelReason}</span></p>}
      {task.lastReturn && task.status === 'in_progress' && <p className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs leading-5 text-amber-900"><strong className="font-semibold">Returned for more work</strong> by {task.lastReturn.by} on {formatDateTime(task.lastReturn.at)}: {task.lastReturn.note}</p>}

      <div className="flex flex-wrap gap-2">
        {canMove && task.status === 'open' && <Button type="button" className="min-h-9 px-3 text-xs" onClick={() => run(() => onSetStatus('in_progress'))}><Play size={14} />Start work</Button>}
        {canMove && task.status === 'in_progress' && <Button type="button" className="min-h-9 px-3 text-xs" onClick={() => setPanel('complete')}><CircleCheck size={14} />Submit completion evidence</Button>}
        {canMove && task.status === 'in_progress' && <Button type="button" variant="secondary" className="min-h-9 px-3 text-xs" onClick={() => setPanel('block')}><OctagonAlert size={14} />Report blocked</Button>}
        {canMove && task.status === 'blocked' && <Button type="button" className="min-h-9 px-3 text-xs" onClick={() => run(() => onSetStatus('in_progress'))}><Play size={14} />Resume work</Button>}
        {canCancel && (task.status === 'completed' || task.status === 'cancelled') && <Button type="button" variant="secondary" className="min-h-9 px-3 text-xs" onClick={() => run(() => onSetStatus('open'))}><RotateCcw size={14} />Reopen task</Button>}
        {canCancel && ['open', 'in_progress', 'blocked'].includes(task.status) && <Button type="button" variant="ghost" className="min-h-9 px-3 text-xs text-rose-700 hover:bg-rose-50 hover:text-rose-800" onClick={() => setPanel('cancel')}><Ban size={14} />Cancel task</Button>}
        {isManager && ['open', 'in_progress', 'blocked'].includes(task.status) && <p className="self-center text-xs leading-5 text-slate-500">Waiting for {task.assignee} to {task.status === 'open' ? 'start' : 'finish'} the work.</p>}
      </div>

      {panel === 'block' && <ReasonForm label="What is blocking the work?" placeholder="For example: access to the bank is closed until Sunday" confirmLabel="Mark as blocked" onCancel={close} onConfirm={(reason) => run(() => onSetStatus('blocked', reason))} />}
      {panel === 'cancel' && <ReasonForm label="Why is the task being cancelled?" placeholder="Recorded in the history" confirmLabel="Cancel task" danger onCancel={close} onConfirm={(reason) => run(() => onSetStatus('cancelled', reason))} />}
      {panel === 'complete' && <CompletionForm onCancel={close} onSubmit={(submission) => run(() => onSubmitCompletion(submission))} />}
    </section>
  )
}

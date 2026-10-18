import { BrainCircuit, CircleCheck, Circle, ImageOff, LoaderCircle, MapPin, RotateCcw, Sparkles, TriangleAlert } from 'lucide-react'
import { useState } from 'react'
import { usePhoto } from '../../hooks/usePhoto'
import { CLEANUP_VERDICT, analyzePhoto, decideCleanup, loadCleanupModel } from '../../services/cleanupAi'
import { getPhoto } from '../../services/photoStore'
import { cn } from '../../utils/cn'
import { distanceMeters } from '../../utils/geo'

// Results survive closing and reopening the task drawer during the session.
const results = new Map()

const TONE = {
  green: { banner: 'bg-green-600', soft: 'bg-green-50 text-green-800', bar: 'bg-green-500' },
  amber: { banner: 'bg-amber-500', soft: 'bg-amber-50 text-amber-900', bar: 'bg-amber-500' },
  rose: { banner: 'bg-rose-600', soft: 'bg-rose-50 text-rose-800', bar: 'bg-rose-500' },
}

const percent = (value) => `${Math.round(value * 100)}%`
const megabytes = (bytes) => (bytes / 1_048_576).toFixed(0)

function Photo({ photoId, label, scanning, waste, tone }) {
  const { url, state } = usePhoto(photoId)
  return (
    <figure className="min-w-0">
      <div className={cn('relative aspect-[4/3] overflow-hidden rounded-lg bg-slate-900 ring-2', tone === 'after' ? 'ring-green-500/70' : 'ring-slate-200')}>
        {url ? <img src={url} alt={label} className="size-full object-cover" /> : <div className="grid size-full place-items-center text-[10px] text-slate-400">{state === 'loading' ? <LoaderCircle size={16} className="animate-spin" /> : <span className="flex flex-col items-center gap-1"><ImageOff size={16} />No photo</span>}</div>}
        {scanning && <><div className="waste-scan-grid absolute inset-0 bg-slate-950/20" /><div className="waste-scan-line" /></>}
        <span className="absolute left-2 top-2 rounded bg-slate-950/80 px-1.5 py-0.5 text-[9px] font-bold tracking-wide text-white">{label}</span>
        {waste !== undefined && <span className={cn('waste-pop absolute bottom-2 right-2 rounded-md px-1.5 py-0.5 text-[10px] font-bold text-white', waste >= 0.55 ? 'bg-rose-600' : waste >= 0.3 ? 'bg-amber-500' : 'bg-green-600')}>Waste {percent(waste)}</span>}
      </div>
    </figure>
  )
}

function Bar({ label, value, color }) {
  return (
    <div>
      <div className="flex justify-between text-[11px]"><span className="text-slate-600">{label}</span><span className="font-semibold text-slate-900">{percent(value)}</span></div>
      <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-100"><div className={cn('h-full rounded-full transition-all duration-700', color)} style={{ width: percent(value) }} /></div>
    </div>
  )
}

/**
 * Compares the report photo with the after-photos using a real vision model, so the manager sees whether the waste is gone
 * before approving. `onResult` receives the verdict so it can be saved with the review.
 */
export function AiCleanupCheck({ report, submission, onResult }) {
  const beforeId = report?.photos?.[0]?.id ?? null
  const afterIds = (submission?.photos ?? []).map((photo) => photo.id)
  const [run, setRun] = useState(() => results.get(submission?.id) ?? { status: 'idle' })
  const location = submission?.location
  const target = report ? [report.latitude, report.longitude] : null
  const distance = location && target ? Math.round(distanceMeters([location.latitude, location.longitude], target)) : null

  async function start() {
    const steps = { status: 'running', step: 'model', download: null, scanning: null, before: [], after: [] }
    setRun(steps)
    const update = (changes) => setRun((current) => ({ ...current, ...changes }))
    try {
      await loadCleanupModel((download) => update({ download }))
      const before = []
      if (beforeId) {
        update({ step: 'before', scanning: beforeId })
        const blob = await getPhoto(beforeId)
        if (blob) before.push(await analyzePhoto(blob))
        update({ before })
      }
      const after = []
      for (const id of afterIds) {
        update({ step: 'after', scanning: id })
        const blob = await getPhoto(id)
        if (blob) after.push({ id, ...(await analyzePhoto(blob)) })
        update({ after: [...after] })
      }
      if (!after.length) throw new Error('The after-photos are not available in this browser.')
      update({ step: 'decide', scanning: null })
      const decision = { ...decideCleanup(before, after), before: before[0] ?? null, after, distance }
      const done = { status: 'done', decision }
      results.set(submission.id, done)
      setRun(done)
      onResult?.(decision)
    } catch (error) {
      setRun({ status: 'error', message: error instanceof Error ? error.message : 'The AI check could not run.' })
    }
  }

  const steps = [
    ['model', run.download?.total ? `Loading the AI vision model · ${megabytes(run.download.loaded)} of ${megabytes(run.download.total)} MB` : 'Loading the AI vision model'],
    ['before', beforeId ? 'Reading the report photo' : 'No report photo to compare'],
    ['after', `Reading ${afterIds.length === 1 ? 'the after-photo' : `${afterIds.length} after-photos`}`],
    ['decide', 'Comparing before and after'],
  ]
  const order = steps.map(([id]) => id)
  const decision = run.status === 'done' ? run.decision : null
  const verdict = decision ? CLEANUP_VERDICT[decision.verdict] : null
  const tone = verdict ? TONE[verdict.tone] : null
  const wasteFor = (id) => (id === beforeId ? (run.before?.[0] ?? decision?.before)?.waste : (run.after ?? decision?.after)?.find((item) => item.id === id)?.waste)

  return (
    <section className="mt-4 overflow-hidden rounded-xl border border-slate-200" aria-label="AI cleanup check">
      <div className="flex items-center gap-2.5 bg-gradient-to-r from-brand-950 via-brand-900 to-brand-700 px-4 py-3 text-white">
        <BrainCircuit size={17} className="text-green-300" />
        <div className="min-w-0 flex-1"><p className="text-xs font-semibold">AI cleanup check</p><p className="truncate text-[10px] text-brand-100">CLIP vision model by OpenAI · runs on this device, photos never leave it</p></div>
        {run.status === 'done' && <button type="button" onClick={start} className="inline-flex items-center gap-1 rounded-md bg-white/10 px-2 py-1 text-[10px] font-semibold hover:bg-white/20"><RotateCcw size={11} />Re-run</button>}
      </div>

      <div className="space-y-3 p-4">
        <div className="grid grid-cols-2 gap-2.5">
          <Photo photoId={beforeId} label="BEFORE · REPORT" scanning={run.status === 'running' && run.scanning === beforeId} waste={wasteFor(beforeId)} />
          <Photo photoId={afterIds[0]} label={`AFTER${afterIds.length > 1 ? ` · 1 OF ${afterIds.length}` : ''}`} tone="after" scanning={run.status === 'running' && run.scanning === afterIds[0]} waste={wasteFor(afterIds[0])} />
        </div>

        {run.status === 'idle' && (
          <button type="button" onClick={start} disabled={!afterIds.length} className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-800 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-brand-900 disabled:opacity-50">
            <Sparkles size={15} className="text-green-300" />{afterIds.length ? 'Run AI check on the after-photos' : 'No after-photos to check'}
          </button>
        )}

        {run.status === 'running' && (
          <ol className="space-y-2 rounded-lg bg-slate-50 p-3">
            {steps.map(([id, label]) => {
              const index = order.indexOf(id)
              const current = order.indexOf(run.step)
              return (
                <li key={id} className={cn('flex items-center gap-2 text-[11px]', index < current ? 'text-slate-600' : index === current ? 'font-semibold text-slate-900' : 'text-slate-400')}>
                  {index < current ? <CircleCheck size={14} className="text-green-600" /> : index === current ? <LoaderCircle size={14} className="animate-spin text-brand-600" /> : <Circle size={14} className="text-slate-300" />}
                  {label}
                </li>
              )
            })}
            {run.step === 'model' && run.download?.total > 0 && <div className="h-1.5 overflow-hidden rounded-full bg-slate-200"><div className="h-full rounded-full bg-brand-600 transition-all" style={{ width: `${Math.round((run.download.loaded / run.download.total) * 100)}%` }} /></div>}
            {run.step === 'model' && <p className="text-[10px] text-slate-400">The model downloads once (about 90 MB) and is kept by the browser for next time.</p>}
          </ol>
        )}

        {run.status === 'error' && (
          <div className="flex items-start gap-2 rounded-lg bg-rose-50 px-3 py-2.5 text-[11px] text-rose-800"><TriangleAlert size={14} className="mt-px shrink-0" /><span className="flex-1">{run.message}</span><button type="button" onClick={start} className="font-semibold underline">Try again</button></div>
        )}

        {decision && (
          <div className="space-y-3">
            <div className={cn('waste-pop flex items-center gap-3 rounded-lg px-4 py-3 text-white', tone.banner)}>
              {decision.verdict === 'cleared' ? <CircleCheck size={20} /> : <TriangleAlert size={20} />}
              <div className="flex-1"><p className="text-sm font-bold">{verdict.label}</p><p className="text-[11px] opacity-90">AI confidence {percent(decision.confidence)}{decision.reduction !== null ? ` · waste ${decision.reduction}% lower than in the report` : ''}</p></div>
            </div>
            <div className="space-y-2">
              {decision.beforeWaste !== null && <Bar label="Waste in the report photo" value={decision.beforeWaste} color="bg-rose-500" />}
              <Bar label="Waste in the after-photo" value={decision.afterWaste} color={tone.bar} />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {[['Before', decision.before], ...decision.after.map((item, index) => [decision.after.length > 1 ? `After ${index + 1}` : 'After', item])].filter(([, item]) => item).map(([label, item]) => (
                <span key={label} className="rounded-full bg-slate-100 px-2.5 py-1 text-[10.5px] text-slate-600"><strong className="font-semibold text-slate-800">{label}:</strong> AI sees {item.top.slice(0, 2).map((top) => `${top.text} ${percent(top.probability)}`).join(', ')}</span>
              ))}
            </div>
            <p className={cn('rounded-lg px-3 py-2 text-[11px] leading-4', tone.soft)}>{decision.summary}</p>
            <p className="flex items-start gap-2 text-[11px] leading-4 text-slate-500">
              <MapPin size={13} className="mt-px shrink-0" />
              {decision.distance === null || decision.distance === undefined
                ? 'Location check: the submission has no device location.'
                : decision.distance <= 150
                  ? `Location check: submitted ${decision.distance} m from the report spot.`
                  : <span className="text-amber-700">Location check: submitted {decision.distance >= 1000 ? `${(decision.distance / 1000).toFixed(1)} km` : `${decision.distance} m`} from the report spot. Ask for a photo taken on site.</span>}
            </p>
            <p className="text-[10px] text-slate-400">The AI suggests; you decide below.</p>
          </div>
        )}
      </div>
    </section>
  )
}

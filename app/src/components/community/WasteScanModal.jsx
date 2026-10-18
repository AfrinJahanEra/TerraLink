import { Circle, CircleCheck, FileText, LoaderCircle, ScanSearch, ShieldAlert, Trash2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { SEVERITY, detectWaste, renderAnnotated } from '../../services/wasteDetection'
import { cn } from '../../utils/cn'
import { Button } from '../ui/Button'

const STEPS = ['Preparing image', 'Running waste detection model', 'Locating debris regions', 'Classifying waste type', 'Scoring severity']
const STEP_MS = 720

const wait = (ms) => new Promise((resolve) => { window.setTimeout(resolve, ms) })

function DetectionBoxes({ detections }) {
  return detections.map((item, index) => (
    <div
      key={index}
      className="waste-box pointer-events-none absolute border-2 border-green-500 bg-green-500/15"
      style={{ left: `${item.box.x * 100}%`, top: `${item.box.y * 100}%`, width: `${item.box.w * 100}%`, height: `${item.box.h * 100}%`, animationDelay: `${index * 160}ms` }}
    >
      <span className={cn('absolute left-[-2px] whitespace-nowrap rounded-sm bg-green-500 px-1.5 py-0.5 text-[10px] font-semibold text-white', item.box.y > 0.08 ? '-top-5' : 'top-0')}>
        {item.label} {Math.round(item.confidence * 100)}%
      </span>
    </div>
  ))
}

function Stat({ label, value }) {
  return (
    <div className="rounded-lg border border-slate-200 px-2.5 py-2">
      <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-slate-400">{label}</p>
      <p className="mt-0.5 text-sm font-semibold text-slate-900">{value}</p>
    </div>
  )
}

/** Runs the detection for one photo alongside the scanning animation, then reports the result to the form. */
function useScan(url, file, onResult, onFailed) {
  const [step, setStep] = useState(0)
  const [preview, setPreview] = useState(null)
  const callbacks = useRef({ onResult, onFailed })
  useEffect(() => { callbacks.current = { onResult, onFailed } })

  useEffect(() => {
    let cancelled = false
    const timer = window.setInterval(() => setStep((current) => Math.min(current + 1, STEPS.length - 1)), STEP_MS)
    async function run() {
      try {
        const detecting = detectWaste(file).then((result) => { if (!cancelled) setPreview(result); return result })
        const [analysis] = await Promise.all([detecting, wait(STEPS.length * STEP_MS + 300)])
        const annotatedBlob = analysis.hasWaste ? await renderAnnotated(file, analysis.detections) : null
        if (!cancelled) callbacks.current.onResult(url, { analysis, annotatedBlob })
      } catch (error) {
        if (!cancelled) callbacks.current.onFailed(error instanceof Error ? error.message : 'The photo could not be analysed.')
      }
    }
    run()
    return () => { cancelled = true; window.clearInterval(timer) }
  }, [url, file])

  return { step, preview }
}

export function WasteScanModal({ items, onResult, onRemove, onClose }) {
  const [index, setIndex] = useState(0)
  const [failure, setFailure] = useState({ url: '', message: '' })
  const item = items[Math.min(index, items.length - 1)]
  const result = item.analysis
  const failed = failure.url === item.url ? failure.message : ''
  const last = index >= items.length - 1
  const next = () => (last ? onClose() : setIndex((current) => current + 1))

  useEffect(() => {
    if (!result && !failed) return undefined
    const onKey = (event) => { if (event.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [result, failed, onClose])

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="waste-scan-title" className="fixed inset-0 z-[1200] grid place-items-center overflow-y-auto bg-slate-950/80 p-4 backdrop-blur-sm">
      <div className="animate-fade-in w-full max-w-4xl overflow-hidden rounded-2xl bg-white shadow-pop">
        <header className="flex items-center gap-3 border-b border-slate-100 px-5 py-3">
          <span className="grid size-8 place-items-center rounded-lg bg-green-50 text-green-600"><ScanSearch size={17} /></span>
          <div className="min-w-0 flex-1">
            <h2 id="waste-scan-title" className="text-sm font-semibold text-slate-900">AI waste detection</h2>
            <p className="truncate text-[11px] text-slate-500">Photo {Math.min(index, items.length - 1) + 1} of {items.length} · {item.file.name}</p>
          </div>
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold text-slate-500">Prototype model</span>
        </header>

        {result || failed
          ? <ResultView item={item} result={result} failed={failed} last={last} onNext={next} onRemove={() => onRemove(item.url)} />
          : <ScanningView key={item.url} item={item} onResult={onResult} onFailed={(message) => setFailure({ url: item.url, message })} />}
      </div>
    </div>
  )
}

function ImageFrame({ url, children }) {
  return (
    <div className="grid min-h-72 place-items-center bg-slate-950 p-4">
      <div className="relative w-fit overflow-hidden rounded-lg">
        <img src={url} alt="Photo being analysed" className="block max-h-[52vh] max-w-full" />
        {children}
      </div>
    </div>
  )
}

function ScanningView({ item, onResult, onFailed }) {
  const { step, preview } = useScan(item.url, item.file, onResult, onFailed)
  const progress = Math.round(((step + 1) / STEPS.length) * 100)
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_280px]">
      <ImageFrame url={item.url}>
        <div className="waste-scan-grid absolute inset-0 bg-slate-950/25" />
        <div className="waste-scan-line" />
        {['left-2 top-2 border-l-2 border-t-2', 'right-2 top-2 border-r-2 border-t-2', 'bottom-2 left-2 border-b-2 border-l-2', 'bottom-2 right-2 border-b-2 border-r-2'].map((corner) => (
          <span key={corner} className={cn('absolute size-6 border-green-400', corner)} />
        ))}
        {step >= 2 && preview?.detections.map((detection, n) => (
          <span key={n} className="absolute grid size-4 -translate-x-1/2 -translate-y-1/2 place-items-center" style={{ left: `${(detection.box.x + detection.box.w / 2) * 100}%`, top: `${(detection.box.y + detection.box.h / 2) * 100}%` }}>
            <span className="absolute size-4 animate-ping rounded-full bg-green-400/70" />
            <span className="size-2 rounded-full bg-green-400" />
          </span>
        ))}
      </ImageFrame>
      <div className="flex flex-col gap-4 p-5">
        <div>
          <p className="text-xs font-semibold text-slate-800">Scanning for waste</p>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-green-500 transition-all duration-500" style={{ width: `${progress}%` }} /></div>
        </div>
        <ol className="space-y-2.5">
          {STEPS.map((label, n) => (
            <li key={label} className={cn('flex items-center gap-2.5 text-xs', n < step ? 'text-slate-700' : n === step ? 'font-semibold text-slate-900' : 'text-slate-400')}>
              {n < step ? <CircleCheck size={15} className="text-green-600" /> : n === step ? <LoaderCircle size={15} className="animate-spin text-green-600" /> : <Circle size={15} className="text-slate-300" />}
              {label}
            </li>
          ))}
        </ol>
        <p className="mt-auto text-[11px] leading-4 text-slate-400">The photo stays on this device while it is analysed.</p>
      </div>
    </div>
  )
}

function ResultView({ item, result, failed, last, onNext, onRemove }) {
  const found = result?.hasWaste
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_280px]">
      <ImageFrame url={item.url}>{found && <DetectionBoxes detections={result.detections} />}</ImageFrame>
      <div className="flex flex-col gap-4 p-5">
        {failed ? (
          <>
            <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-rose-50 px-2.5 py-1 text-[11px] font-semibold text-rose-700"><ShieldAlert size={13} />Could not analyse</span>
            <p className="text-xs leading-5 text-slate-600">{failed}</p>
          </>
        ) : found ? (
          <>
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-2.5 py-1 text-[11px] font-semibold text-green-700"><CircleCheck size={13} />Waste detected</span>
              <span className="text-lg font-bold text-slate-900">{Math.round(result.confidence * 100)}%</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <Stat label="Areas" value={result.detections.length} />
              <Stat label="Coverage" value={`${result.coverage}%`} />
              <Stat label="Severity" value={SEVERITY[result.severity].label} />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">Summary</p>
              <p className="mt-1 text-xs leading-5 text-slate-700">{result.summary}</p>
            </div>
            <p className="rounded-lg bg-green-50 px-3 py-2 text-[11px] font-medium leading-4 text-green-800">{result.recommendation}</p>
            <p className="flex items-start gap-2 text-[11px] leading-4 text-slate-500"><FileText size={14} className="mt-px shrink-0" />A PDF report with the marked photo is attached when you submit.</p>
          </>
        ) : (
          <>
            <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600"><ShieldAlert size={13} />No waste detected</span>
            <p className="text-xs leading-5 text-slate-600">{result.summary} {result.recommendation}</p>
            <p className="rounded-lg bg-amber-50 px-3 py-2 text-[11px] font-medium leading-4 text-amber-800">The report can be submitted only when at least one photo shows waste.</p>
          </>
        )}
        <div className="mt-auto flex flex-col gap-2">
          {found
            ? <Button type="button" onClick={onNext}>{last ? 'Continue to form' : 'Next photo'}</Button>
            : <>
                <Button type="button" onClick={onRemove}><Trash2 size={15} />Remove photo</Button>
                {!failed && <Button type="button" variant="secondary" onClick={onNext}>{last ? 'Keep photo and close' : 'Keep photo, next'}</Button>}
              </>}
        </div>
      </div>
    </div>
  )
}

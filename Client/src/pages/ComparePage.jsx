import { ArrowLeft, Check, MapPin, Play, Satellite } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { AreaChangeSummary } from '../components/compare/AreaChangeSummary'
import { ComparisonViewer } from '../components/compare/ComparisonViewer'
import { DataQualityPanel } from '../components/compare/DataQualityPanel'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Toast } from '../components/ui/Toast'
import { SITE_STATUS } from '../constants/status'
import { useApp } from '../hooks/useApp'
import { useNotice } from '../hooks/useNotice'
import { observe } from '../services/observation'
import { compareObservations } from '../services/sentinel'
import { todayInDhaka } from '../utils/reports'

// Same time of year, one year apart, in the dry season when Bangladesh has the fewest clouds.
const DEFAULT_FROM = '2025-02-15'
const DEFAULT_TO = '2026-02-15'
const DEFAULT_WINDOW = 15
const WINDOWS = [7, 15, 30, 60]
const IDLE = { state: 'loading', message: 'Starting' }

const inputClass = 'mt-1.5 block h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100'

export function ComparePage() {
  const { siteId } = useParams()
  const { can, sites, comparisons, saveComparison } = useApp()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const site = sites.find((item) => item.id === siteId)
  const from = searchParams.get('from') ?? DEFAULT_FROM
  const to = searchParams.get('to') ?? DEFAULT_TO
  const windowDays = WINDOWS.includes(Number(searchParams.get('w'))) ? Number(searchParams.get('w')) : DEFAULT_WINDOW

  const [form, setForm] = useState({ from, to, windowDays })
  const [formError, setFormError] = useState('')
  const [earlier, setEarlier] = useState(IDLE)
  const [later, setLater] = useState(IDLE)
  const [notice, showNotice] = useNotice(3500)
  const runId = useRef(0)
  const canSave = can('measurement.save')

  // Run the two observations in parallel whenever the site or the requested dates change.
  useEffect(() => {
    if (!site) return
    const id = ++runId.current
    const run = (date, set) => {
      set({ state: 'loading', message: 'Starting' })
      observe({ site, date, windowDays, onStep: (message) => { if (runId.current === id) set({ state: 'loading', message }) } })
        .then((result) => {
          if (runId.current !== id) return
          set(result.status === 'done' ? { state: 'done', observation: result.observation } : { state: 'none', suggestion: result.suggestion })
        })
        .catch((error) => {
          if (runId.current === id) set({ state: 'error', message: error instanceof Error ? error.message : 'Something went wrong while reading the imagery.' })
        })
    }
    run(from, setEarlier)
    run(to, setLater)
    return () => { runId.current += 1 }
    // `site` identity changes when workspace data changes; the run depends only on which site and which dates.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [site?.id, from, to, windowDays])

  const result = useMemo(
    () => site && earlier.state === 'done' && later.state === 'done' ? compareObservations(earlier.observation, later.observation, site) : null,
    [earlier, later, site],
  )
  const savedAlready = result && comparisons.some((item) => item.siteId === site.id && item.earlier.id === earlier.observation.id && item.later.id === later.observation.id)

  if (!site) {
    return (
      <div className="grid min-h-[60vh] place-items-center text-center"><div><MapPin size={28} className="mx-auto text-slate-500" /><h2 className="mt-4 text-xl font-semibold text-slate-900">Water body not found</h2><Button as={Link} to="/map" className="mt-5"><ArrowLeft size={15} />Return to map</Button></div></div>
    )
  }

  function applyDates(next) {
    setSearchParams({ from: next.from, to: next.to, w: String(next.windowDays) }, { replace: true })
  }

  function submit(event) {
    event.preventDefault()
    if (!form.from || !form.to) return setFormError('Choose both dates.')
    if (form.from >= form.to) return setFormError('The earlier date must come before the later date.')
    if (form.to > todayInDhaka()) return setFormError('The later date cannot be in the future.')
    if (form.from < '2017-01-01') return setFormError('Sentinel-2 imagery starts in 2017.')
    setFormError('')
    applyDates(form)
  }

  function applySuggestion(side, date) {
    const next = { ...form, [side]: date }
    setForm(next)
    applyDates(next)
  }

  function save() {
    try {
      saveComparison({ siteId: site.id, earlier: earlier.observation, later: later.observation, result })
      showNotice('Measurement saved to the site record.')
    } catch (error) {
      showNotice(error instanceof Error ? error.message : 'The measurement could not be saved.')
    }
  }

  const status = SITE_STATUS[site.status]

  return (
    <div className="animate-fade-in space-y-6 pb-8">
      <header className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <Link to={`/sites/${site.id}`} className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900"><ArrowLeft size={14} />Site review</Link>
          <div className="mt-3 flex flex-wrap items-center gap-2"><h2 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">{site.name}</h2><Badge tone={status.tone}>{status.label}</Badge></div>
          <p className="mt-2 flex items-center gap-1.5 text-sm text-slate-500"><MapPin size={15} />{site.location} · {site.area} mapped</p>
        </div>
        <label className="block">
          <span className="text-xs font-semibold text-slate-600">Water body</span>
          <select value={site.id} onChange={(event) => navigate(`/compare/${event.target.value}?${searchParams.toString()}`)} className={`${inputClass} lg:w-64`}>
            {sites.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
        </label>
      </header>

      <form onSubmit={submit} className="rounded-xl border border-slate-200 bg-white p-5 shadow-card" aria-label="Choose dates">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_auto] lg:items-end">
          <label className="block"><span className="text-xs font-semibold text-slate-700">Earlier date</span><input type="date" value={form.from} min="2017-01-01" max={todayInDhaka()} onChange={(event) => setForm({ ...form, from: event.target.value })} className={inputClass} /></label>
          <label className="block"><span className="text-xs font-semibold text-slate-700">Later date</span><input type="date" value={form.to} min="2017-01-01" max={todayInDhaka()} onChange={(event) => setForm({ ...form, to: event.target.value })} className={inputClass} /></label>
          <label className="block"><span className="text-xs font-semibold text-slate-700">Look for a scene within</span><select value={form.windowDays} onChange={(event) => setForm({ ...form, windowDays: Number(event.target.value) })} className={inputClass}>{WINDOWS.map((days) => <option key={days} value={days}>± {days} days</option>)}</select></label>
          <Button type="submit" className="h-10"><Play size={15} />Compare</Button>
        </div>
        {formError && <p role="alert" className="mt-3 text-xs font-medium text-rose-600">{formError}</p>}
        <p className="mt-4 border-t border-slate-100 pt-3 text-[11px] leading-5 text-slate-500">TerraLink picks the clearest Sentinel-2 scene near each date that fully covers the outline, and shows the real acquisition date. Compare the same time of year, because water level follows the monsoon. Both dates are searched in the public Sentinel-2 archive, so the first run for a pair downloads imagery and later runs reuse it from this browser.</p>
      </form>

      <ComparisonViewer site={site} earlier={earlier} later={later} onUseSuggestion={applySuggestion} />

      {result ? (
        <>
          <AreaChangeSummary earlier={earlier.observation} later={later.observation} result={result} />
          <DataQualityPanel site={site} earlier={earlier.observation} later={later.observation} result={result} />

          <section className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-card sm:flex-row sm:items-center sm:justify-between">
            <div><h2 className="text-sm font-semibold text-slate-900">Record this measurement</h2><p className="mt-1 max-w-xl text-xs leading-5 text-slate-500">Saving adds it to the site record and the audit trail. A measured decrease flags the site for a review decision. It never creates a task by itself, because a person has to decide what the change means.</p></div>
            <div className="flex flex-wrap items-center gap-2">
              {canSave
                ? <Button type="button" onClick={save} disabled={savedAlready}>{savedAlready ? <><Check size={15} />Saved</> : <><Satellite size={15} />Save to site record</>}</Button>
                : <p className="max-w-[240px] text-[11px] leading-5 text-slate-400">Only the project manager can save a measurement.</p>}
              <Button as={Link} to={`/sites/${site.id}`} variant="secondary">Open site review</Button>
            </div>
          </section>
        </>
      ) : (
        <p className="rounded-xl border border-dashed border-slate-300 bg-white px-5 py-8 text-center text-xs leading-5 text-slate-500">The measured area appears here once both dates have a usable scene. Nothing is estimated until then.</p>
      )}

      <Toast message={notice} />
    </div>
  )
}

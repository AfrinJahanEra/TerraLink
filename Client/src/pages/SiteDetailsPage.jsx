import {
  ArrowLeft,
  CalendarRange,
  Check,
  ClipboardCheck,
  Database,
  MapPin,
  RotateCcw,
  ShieldCheck,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { AnalysisSummary } from '../components/site/AnalysisSummary'
import { DecisionPanel } from '../components/site/DecisionPanel'
import { ImageComparison } from '../components/site/ImageComparison'
import { TaskCreationModal } from '../components/site/TaskCreationModal'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { SITE_STATUS } from '../constants/status'
import { analysisSources, getSiteComparisons } from '../data/siteAnalysis'
import { useApp } from '../hooks/useApp'

function ReadOnlyReview({ role, decision }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-card">
      <div className="flex items-start gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-600"><ShieldCheck size={18} /></span>
        <div><h2 className="text-sm font-semibold text-slate-900">Review decision</h2><p className="mt-1 text-xs leading-5 text-slate-500">Your {role.label.toLowerCase()} access is read-only for manager decisions.</p></div>
      </div>
      {decision ? (
        <div className="mt-4 border-t border-slate-100 pt-4"><Badge tone={SITE_STATUS[decision.status].tone}>{SITE_STATUS[decision.status].label}</Badge><p className="mt-3 text-xs leading-5 text-slate-600">{decision.note}</p><p className="mt-3 text-[10px] text-slate-400">Saved by {decision.decidedBy} on {decision.displayDate}</p></div>
      ) : (
        <p className="mt-4 border-t border-slate-100 pt-4 text-xs leading-5 text-slate-500">No manager decision has been recorded for this site.</p>
      )}
      <Button as={Link} to="/tasks" variant="secondary" className="mt-4 w-full"><ClipboardCheck size={15} className="text-slate-600" />Open task workspace</Button>
    </section>
  )
}

function SourcePanel({ site, comparison }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-card">
      <div className="flex items-start gap-3"><span className="grid size-9 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-600"><Database size={17} /></span><div><h2 className="text-sm font-semibold text-slate-900">Observation record</h2><p className="mt-1 text-xs text-slate-500">Source, period, and interpretation context.</p></div></div>
      <dl className="mt-4 divide-y divide-slate-100 border-y border-slate-100 text-xs">
        <div className="flex justify-between gap-4 py-3"><dt className="text-slate-400">Imagery</dt><dd className="text-right font-medium text-slate-700">{analysisSources.imagery}</dd></div>
        <div className="flex justify-between gap-4 py-3"><dt className="text-slate-400">Provider</dt><dd className="text-right font-medium text-slate-700">{analysisSources.provider}</dd></div>
        <div className="flex justify-between gap-4 py-3"><dt className="text-slate-400">Comparison</dt><dd className="text-right font-medium text-slate-700">{comparison.beforeDate} – {comparison.afterDate}</dd></div>
        <div className="flex justify-between gap-4 py-3"><dt className="text-slate-400">Measurement</dt><dd className="text-right font-medium text-slate-700">{analysisSources.measurement}</dd></div>
      </dl>
      <p className="mt-4 text-xs leading-5 text-slate-500">{site.reviewNote}</p>
    </section>
  )
}

export function SiteDetailsPage() {
  const { siteId } = useParams()
  const { role, sites, tasks, decisions, recordDecision, createTask, resetDemo } = useApp()
  const site = sites.find((item) => item.id === siteId)
  const comparisons = useMemo(() => site ? getSiteComparisons(site) : [], [site])
  const [periodId, setPeriodId] = useState('2021-2024')
  const [taskOpen, setTaskOpen] = useState(false)
  const [notice, setNotice] = useState('')
  const comparison = comparisons.find((item) => item.id === periodId) ?? comparisons[0]

  if (!site) {
    return (
      <div className="grid min-h-[60vh] place-items-center text-center"><div><MapPin size={28} className="mx-auto text-slate-500" /><h2 className="mt-4 text-xl font-semibold text-slate-900">Site not found</h2><p className="mt-2 text-sm text-slate-500">This monitoring-site identifier is not part of the demo dataset.</p><Button as={Link} to="/map" className="mt-5"><ArrowLeft size={15} />Return to map</Button></div></div>
    )
  }

  const status = SITE_STATUS[site.status]
  const existingDecision = decisions[site.id]

  function showNotice(message) {
    setNotice(message)
    window.setTimeout(() => setNotice(''), 2600)
  }

  function handleDecision({ status: outcome, note }) {
    const now = new Date()
    recordDecision({
      siteId: site.id,
      status: outcome,
      note,
      decidedBy: role.user.name,
      decidedAt: now.toISOString(),
      displayDate: new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).format(now),
    })
    showNotice('Decision saved and workspace status updated.')
  }

  function handleCreateTask(task) {
    const date = new Date(`${task.dueDate}T12:00:00`)
    const taskId = `TL-${101 + tasks.length}`
    createTask({
      ...task,
      id: taskId,
      site: site.name,
      siteId: site.id,
      due: new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short' }).format(date),
      status: 'approved',
      createdAt: new Date().toISOString(),
    })
    setTaskOpen(false)
    showNotice(`${taskId} created and added to the task list.`)
  }

  function handleReset() {
    if (!window.confirm('Reset all saved review decisions and created demo tasks?')) return
    resetDemo()
    showNotice('Demo review data has been reset.')
  }

  return (
    <div className="animate-fade-in space-y-6 pb-8">
      <header className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <Link to="/map" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900"><ArrowLeft size={14} className="text-slate-500" />Wetland map</Link>
          <div className="mt-3 flex flex-wrap items-center gap-2"><h2 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">{site.name}</h2><Badge tone={status.tone}>{status.label}</Badge></div>
          <p className="mt-2 flex items-center gap-1.5 text-sm text-slate-500"><MapPin size={15} className="text-slate-500" />{site.location} · {site.area} visible water area</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <label className="relative flex items-center"><CalendarRange size={15} className="pointer-events-none absolute left-3 text-slate-500" /><select value={periodId} onChange={(event) => setPeriodId(event.target.value)} aria-label="Comparison period" className="h-10 rounded-lg border border-slate-200 bg-white pl-9 pr-8 text-xs font-semibold text-slate-700 shadow-card outline-none focus:border-brand-400">{comparisons.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
          {role.id === 'manager' && <Button type="button" variant="secondary" onClick={handleReset}><RotateCcw size={15} className="text-slate-600" />Reset demo</Button>}
        </div>
      </header>

      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-y border-slate-200 py-3 text-[10px] text-slate-500">
        <span className="font-semibold text-slate-700">Analysis period: {comparison.label}</span>
        <span>Season: {comparison.season}</span>
        <span>Imagery: Real EOX mosaic</span>
        <span>Measurements: Sample figures</span>
      </div>

      <ImageComparison site={site} comparison={comparison} />
      <div className="space-y-5"><AnalysisSummary comparison={comparison} /></div>

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(340px,0.85fr)]">
        <SourcePanel site={site} comparison={comparison} />
        {role.id === 'manager' ? (
          <DecisionPanel key={site.id} site={site} existingDecision={existingDecision} onSave={handleDecision} onCreateTask={() => setTaskOpen(true)} />
        ) : (
          <ReadOnlyReview role={role} decision={existingDecision} />
        )}
      </div>

      <TaskCreationModal open={taskOpen} site={site} onClose={() => setTaskOpen(false)} onCreate={handleCreateTask} />

      {notice && <div role="status" className="fixed bottom-5 right-5 z-[1100] flex max-w-sm items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-3 text-xs font-semibold text-slate-700 shadow-pop"><Check size={15} className="text-slate-600" />{notice}</div>}
    </div>
  )
}

import {
  ArrowLeft,
  CalendarPlus,
  Layers,
  ClipboardCheck,
  Database,
  MapPin,
  ShieldCheck,
} from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ReportCard } from '../components/community/ReportCard'
import { DecisionPanel } from '../components/site/DecisionPanel'
import { MeasuredComparison } from '../components/site/MeasuredComparison'
import { TaskCreationModal } from '../components/site/TaskCreationModal'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Toast } from '../components/ui/Toast'
import { SITE_STATUS } from '../constants/status'
import { METHOD } from '../constants/observations'
import { useApp } from '../hooks/useApp'
import { useNotice } from '../hooks/useNotice'
import { buildScheduleLink } from '../utils/schedule'
import { assignableMembers, createActivity, formatTaskDate } from '../utils/tasks'

function ReadOnlyReview({ role, decision, siteId, scheduleVisitLink }) {
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
      <Button as={Link} to={`/tasks?site=${siteId}`} variant="secondary" className="mt-4 w-full"><ClipboardCheck size={15} className="text-slate-600" />Open task workspace</Button>
      {scheduleVisitLink && <Button as={Link} to={scheduleVisitLink} variant="ghost" className="mt-2 w-full"><CalendarPlus size={15} className="text-slate-600" />Schedule field verification visit</Button>}
    </section>
  )
}

function SourcePanel({ site }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-card">
      <div className="flex items-start gap-3"><span className="grid size-9 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-600"><Database size={17} /></span><div><h2 className="text-sm font-semibold text-slate-900">Observation record</h2><p className="mt-1 text-xs text-slate-500">Source, method, and interpretation context.</p></div></div>
      <dl className="mt-4 divide-y divide-slate-100 border-y border-slate-100 text-xs">
        <div className="flex justify-between gap-4 py-3"><dt className="text-slate-400">Imagery</dt><dd className="text-right font-medium text-slate-700">{METHOD.source}</dd></div>
        <div className="flex justify-between gap-4 py-3"><dt className="text-slate-400">Method</dt><dd className="text-right font-medium text-slate-700">NDWI above {METHOD.threshold}, 10 m pixels</dd></div>
        <div className="flex justify-between gap-4 py-3"><dt className="text-slate-400">Boundary</dt><dd className="text-right font-medium text-slate-700">{site.boundarySource}<span className="block text-[10px] font-normal text-slate-400">Community-mapped, not verified</span></dd></div>
        <div className="flex justify-between gap-4 py-3"><dt className="text-slate-400">Water-area change</dt><dd className="text-right font-medium text-slate-700">{site.measured ? 'Measured, see above' : 'Not yet measured'}</dd></div>
      </dl>
      <p className="mt-4 text-xs leading-5 text-slate-500">{site.reviewNote}</p>
    </section>
  )
}

function SiteReports({ site, reports, onOpen }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white shadow-card">
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
        <div><h2 className="text-sm font-semibold text-slate-900">Community reports</h2><p className="mt-0.5 text-xs text-slate-400">Photo evidence submitted for {site.name}</p></div>
        <Link to={`/community?site=${site.id}`} className="text-xs font-semibold text-brand-700 hover:text-brand-900">Open community reports</Link>
      </div>
      {reports.length ? (
        <div className="divide-y divide-slate-100">{reports.map((report) => <ReportCard key={report.id} report={report} siteName={site.name} onSelect={onOpen} />)}</div>
      ) : (
        <p className="px-5 py-8 text-center text-xs text-slate-500">No community reports for this water body.</p>
      )}
    </section>
  )
}

export function SiteDetailsPage() {
  const { siteId } = useParams()
  const { role, can, scope, tasks, teamMembers, decisions, recordDecision, createTask } = useApp()
  const navigate = useNavigate()
  // A coordinator can open only the sites they have a task at.
  const site = scope.sites.find((item) => item.id === siteId)
  const [taskOpen, setTaskOpen] = useState(false)
  const [notice, showNotice] = useNotice(3000)

  if (!site) {
    return (
      <div className="grid min-h-[60vh] place-items-center text-center"><div><MapPin size={28} className="mx-auto text-slate-500" /><h2 className="mt-4 text-xl font-semibold text-slate-900">Site not found</h2><p className="mt-2 text-sm text-slate-500">This water body is not available to your role. Coordinators can open the sites they have tasks at.</p><Button as={Link} to="/map" className="mt-5"><ArrowLeft size={15} />Return to map</Button></div></div>
    )
  }

  const status = SITE_STATUS[site.status]
  const existingDecision = decisions[site.id]
  const canSchedule = can('schedule.manage')
  const scheduleVisitLink = canSchedule ? buildScheduleLink({ new: 'field_visit', site: site.id, title: `${site.name} field verification visit` }) : ''

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
    const highestId = tasks.reduce((highest, item) => Math.max(highest, Number(item.id.replace('TL-', '')) || 0), 100)
    const taskId = `TL-${highestId + 1}`
    createTask({
      ...task,
      id: taskId,
      description: task.notes,
      site: site.name,
      siteId: site.id,
      due: formatTaskDate(task.dueDate),
      status: 'open',
      estimatedCost: 0,
      source: 'site_review',
      assignedBy: role.user.name,
      notifications: { email: true, calendar: true },
      comments: [],
      activityHistory: [createActivity(`Task created from ${site.name} analysis`, role.user.name)],
      createdAt: new Date().toISOString(),
    })
    setTaskOpen(false)
    showNotice(`${taskId} created and added to the task list.`)
  }

  return (
    <div className="animate-fade-in space-y-6 pb-8">
      <header className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <Link to="/map" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900"><ArrowLeft size={14} className="text-slate-500" />Wetland map</Link>
          <div className="mt-3 flex flex-wrap items-center gap-2"><h2 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">{site.name}</h2><Badge tone={status.tone}>{status.label}</Badge></div>
          <p className="mt-2 flex items-center gap-1.5 text-sm text-slate-500"><MapPin size={15} className="text-slate-500" />{site.location} · {site.area} mapped area</p>
        </div>

        {can('measurement.run') && <Button as={Link} to={`/compare/${site.id}`} variant="secondary"><Layers size={15} className="text-slate-600" />Satellite comparison</Button>}
      </header>

      <MeasuredComparison site={site} showActions={can('measurement.run')} />

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(340px,0.85fr)]">
        <SourcePanel site={site} />
        {can('sites.decide') ? (
          <DecisionPanel key={site.id} site={site} existingDecision={existingDecision} onSave={handleDecision} onCreateTask={() => setTaskOpen(true)} scheduleVisitLink={scheduleVisitLink} />
        ) : (
          <ReadOnlyReview role={role} decision={existingDecision} siteId={site.id} scheduleVisitLink={scheduleVisitLink} />
        )}
      </div>

      {can('community.view') && <SiteReports site={site} reports={scope.communityReports.filter((report) => report.siteId === site.id)} onOpen={(id) => navigate(`/community?report=${id}`)} />}

      <TaskCreationModal open={taskOpen} site={site} members={assignableMembers(teamMembers)} onClose={() => setTaskOpen(false)} onCreate={handleCreateTask} />

      <Toast message={notice} />
    </div>
  )
}

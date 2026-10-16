import { isTaskClosed } from '../constants/status'
import { ArrowRight, CalendarPlus, ClipboardPlus, CloudOff, ScanSearch } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Badge } from '../components/ui/Badge'
import { PageHeader } from '../components/ui/PageHeader'
import { SummaryStrip } from '../components/ui/SummaryStrip'
import { SITE_STATUS } from '../constants/status'
import { useApp } from '../hooks/useApp'
import { buildScheduleLink } from '../utils/schedule'

function SectionHeader({ title, description, count }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
      <div><h2 className="text-sm font-semibold text-slate-900">{title}</h2><p className="mt-0.5 text-xs text-slate-400">{description}</p></div>
      {count !== undefined && <span className="text-xs font-semibold text-slate-500">{count}</span>}
    </div>
  )
}

export function ReviewQueuePage() {
  const { can, sites, tasks, decisions } = useApp()
  const canAct = can('schedule.manage')
  const canCreateTask = can('tasks.create')
  const awaiting = sites.filter((site) => site.status === 'needs_review' || site.status === 'reported_issue')
  const dataGaps = sites.filter((site) => site.status === 'insufficient_data')
  const register = Object.values(decisions ?? {}).sort((a, b) => String(b.decidedAt).localeCompare(String(a.decidedAt)))
  const siteById = new Map(sites.map((site) => [site.id, site]))
  const openTasksFor = (siteId) => tasks.filter((task) => task.siteId === siteId && !isTaskClosed(task)).length
  const followUps = sites.filter((site) => site.status === 'confirmed').length

  return (
    <div className="animate-fade-in space-y-5 pb-8">
      <PageHeader
        eyebrow="Monitoring"
        title="Review queue"
        description="Water bodies waiting for a documented manager decision, sites where imagery cannot support a comparison, and the register of recorded decisions."
      />

      <SummaryStrip
        items={[
          { label: 'awaiting review', value: awaiting.length, tone: awaiting.length ? 'amber' : undefined },
          { label: 'with insufficient data', value: dataGaps.length },
          { label: 'confirmed for follow-up', value: followUps, tone: followUps ? 'rose' : undefined },
          { label: 'decisions recorded', value: register.length },
        ]}
        note={can('sites.decide') ? undefined : 'Read-only: the project manager records decisions'}
      />

      <section className="rounded-xl border border-slate-200 bg-white shadow-card">
        <SectionHeader title="Awaiting review" description="Sites to review before any action is taken, including those with community reports" count={`${awaiting.length} pending`} />
        {awaiting.length ? (
          <div className="divide-y divide-slate-100">
            {awaiting.map((site) => (
              <div key={site.id} className="flex flex-col gap-3 px-5 py-4 lg:flex-row lg:items-center">
                <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-600"><ScanSearch size={17} /></span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2"><p className="text-xs font-semibold text-slate-800">{site.name} · {site.location}</p><Badge tone={SITE_STATUS[site.status].tone} className="px-2 py-0.5 text-[10px]">{SITE_STATUS[site.status].label}</Badge></div>
                  <p className="mt-1 text-[11px] leading-5 text-slate-500">{site.reviewNote}</p>
                  <p className="mt-1 text-[10px] text-slate-400">{site.area} mapped · {site.openReports} open community report{site.openReports === 1 ? '' : 's'} · {openTasksFor(site.id)} open tasks</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {canAct && <Link to={buildScheduleLink({ new: 'field_visit', site: site.id, title: `${site.name} field verification visit` })} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 text-[11px] font-semibold text-slate-700 hover:bg-slate-50"><CalendarPlus size={13} className="text-slate-500" />Schedule visit</Link>}
                  {canCreateTask && <Link to={`/tasks?new=task&site=${site.id}`} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 text-[11px] font-semibold text-slate-700 hover:bg-slate-50"><ClipboardPlus size={13} className="text-slate-500" />Create task</Link>}
                  <Link to={`/sites/${site.id}`} className="inline-flex h-9 items-center gap-1 rounded-lg bg-brand-700 px-3 text-[11px] font-semibold text-white hover:bg-brand-800">Review <ArrowRight size={13} /></Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="px-5 py-10 text-center text-xs text-slate-500">No water bodies currently require review.</p>
        )}
      </section>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <section className="rounded-xl border border-slate-200 bg-white shadow-card">
          <SectionHeader title="Data quality" description="Water bodies too small or unclear for a reliable comparison" count={dataGaps.length} />
          {dataGaps.length ? (
            <ul className="divide-y divide-slate-100">
              {dataGaps.map((site) => (
                <li key={site.id} className="flex items-start gap-3 px-5 py-3.5">
                  <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-500"><CloudOff size={15} /></span>
                  <div className="min-w-0 flex-1">
                    <Link to={`/sites/${site.id}`} className="text-xs font-semibold text-slate-800 hover:text-brand-700">{site.name} · {site.location}</Link>
                    <p className="mt-0.5 text-[11px] leading-5 text-slate-500">{site.reviewNote}</p>
                    <p className="mt-0.5 text-[10px] text-slate-400">{site.area} mapped, under the one hectare minimum for 10 m imagery</p>
                  </div>
                  {canAct && <Link to={buildScheduleLink({ new: 'field_visit', site: site.id, title: `${site.name} ground observation` })} title="Schedule ground observation" aria-label={`Schedule ground observation at ${site.name}`} className="grid size-8 shrink-0 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800"><CalendarPlus size={15} /></Link>}
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-5 py-8 text-center text-xs text-slate-500">All sites have usable imagery.</p>
          )}
        </section>

        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-card">
          <SectionHeader title="Decision register" description="Documented outcomes of manager reviews" count={register.length} />
          {register.length ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-left text-xs">
                <thead className="border-b border-slate-100 bg-slate-50/70 text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">
                  <tr><th className="px-5 py-2.5">Site</th><th className="px-3 py-2.5">Decision</th><th className="px-3 py-2.5">Note</th><th className="px-5 py-2.5">Recorded</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {register.map((decision) => {
                    const site = siteById.get(decision.siteId)
                    const status = SITE_STATUS[decision.status] ?? SITE_STATUS.inconclusive
                    return (
                      <tr key={decision.siteId} className="align-top">
                        <td className="px-5 py-3"><Link to={`/sites/${decision.siteId}`} className="font-semibold text-slate-800 hover:text-brand-700">{site?.name ?? decision.siteId}</Link></td>
                        <td className="px-3 py-3"><Badge tone={status.tone} className="whitespace-nowrap px-2 py-0.5 text-[10px]">{status.label}</Badge></td>
                        <td className="max-w-xs px-3 py-3 leading-5 text-slate-600">{decision.note || '—'}</td>
                        <td className="whitespace-nowrap px-5 py-3 text-slate-500">{decision.decidedBy}<p className="text-[10px] text-slate-400">{decision.displayDate}</p></td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="px-5 py-8 text-center text-xs text-slate-500">No decisions have been recorded yet. Open a site to record one.</p>
          )}
        </section>
      </div>
    </div>
  )
}

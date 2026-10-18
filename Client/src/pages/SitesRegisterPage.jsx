import { isTaskClosed } from '../constants/status'
import { ArrowRight, CalendarPlus, CircleCheck, Download, Plus, Satellite, Search, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { SiteFormModal } from '../components/sites/SiteFormModal'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { PageHeader } from '../components/ui/PageHeader'
import { SummaryStrip } from '../components/ui/SummaryStrip'
import { SITE_TYPES } from '../constants/sites'
import { SITE_STATUS } from '../constants/status'
import { useApp } from '../hooks/useApp'
import { buildSiteBudgetRows } from '../utils/budget'
import { cn } from '../utils/cn'
import { downloadCsv } from '../utils/csv'
import { formatBdt } from '../utils/currency'
import { buildScheduleLink, formatDateLabel, todayKey } from '../utils/schedule'

export function SitesRegisterPage() {
  const { can, sites, tasks, siteBudgets, expenses, meetings } = useApp()
  const [searchParams] = useSearchParams()
  const [search, setSearch] = useState('')
  // Links such as "Sites to review" open the register already filtered.
  const [status, setStatus] = useState(() => (SITE_STATUS[searchParams.get('status')] ? searchParams.get('status') : 'all'))
  const [adding, setAdding] = useState(false)
  const [addedId, setAddedId] = useState('')
  const canSchedule = can('schedule.manage')
  const added = sites.find((site) => site.id === addedId)
  const today = todayKey()

  const rows = useMemo(() => {
    const budgets = new Map(buildSiteBudgetRows(sites, tasks, siteBudgets, expenses).map((row) => [row.id, row]))
    return sites.map((site) => {
      const nextVisit = meetings
        .filter((meeting) => meeting.siteId === site.id && meeting.status === 'scheduled' && meeting.date >= today)
        .sort((a, b) => a.date.localeCompare(b.date))[0]
      return {
        site,
        budget: budgets.get(site.id),
        openTasks: tasks.filter((task) => task.siteId === site.id && !isTaskClosed(task)).length,
        nextVisit,
      }
    })
  }, [expenses, meetings, siteBudgets, sites, tasks, today])

  const filtered = rows.filter(({ site }) => {
    const term = search.trim().toLowerCase()
    const matchesSearch = !term || `${site.name} ${site.location}`.toLowerCase().includes(term)
    return matchesSearch && (status === 'all' || site.status === status)
  })

  const reviewCount = sites.filter((site) => site.status === 'needs_review').length
  const followUpCount = sites.filter((site) => site.status === 'confirmed').length
  const overBudget = rows.filter((row) => row.budget?.overBudget).length

  function exportRegister() {
    downloadCsv(`terralink-sites-${today}.csv`, [
      ['Site', 'Location', 'Type', 'Responsible authority', 'Status', 'Mapped area', 'Open reports', 'Boundary source', 'Open tasks', 'Planned (BDT)', 'Actual (BDT)', 'Remaining (BDT)', 'Next scheduled visit'],
      ...filtered.map(({ site, budget, openTasks, nextVisit }) => [
        site.name, site.location, SITE_TYPES[site.type]?.label ?? 'Lake', site.authority ?? '', SITE_STATUS[site.status]?.label ?? site.status, site.area, site.openReports, site.boundarySource,
        openTasks, budget?.planned ?? 0, budget?.actual ?? 0, budget?.remaining ?? 0, nextVisit ? `${nextVisit.date} ${nextVisit.startTime}` : '',
      ]),
    ])
  }

  return (
    <div className="animate-fade-in space-y-5 pb-8">
      <PageHeader
        eyebrow="Monitoring"
        title="Sites register"
        description="Every monitored water body with its status, mapped area, community reports, open work, budget position, and next scheduled visit."
        actions={(
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="secondary" onClick={exportRegister}><Download size={15} />Export CSV</Button>
            {can('sites.add') && <Button type="button" onClick={() => setAdding(true)}><Plus size={15} />Add water body</Button>}
          </div>
        )}
      />

      {added && (
        <div className="animate-fade-in flex flex-col gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3 sm:flex-row sm:items-center">
          <CircleCheck size={18} className="shrink-0 text-green-600" />
          <p className="flex-1 text-xs text-green-900"><strong className="font-semibold">{added.name}</strong> was added to the register ({added.area}). Run its first satellite comparison to measure the water area.</p>
          <div className="flex shrink-0 items-center gap-2">
            {can('measurement.run') && <Button as={Link} to={`/compare/${added.id}`} className="h-8 min-h-8 px-3 text-xs"><Satellite size={13} />Run comparison</Button>}
            <Button as={Link} to={`/sites/${added.id}`} variant="secondary" className="h-8 min-h-8 px-3 text-xs">Open site</Button>
            <button type="button" onClick={() => setAddedId('')} aria-label="Dismiss" className="grid size-8 place-items-center rounded-lg text-green-700 hover:bg-green-100"><X size={15} /></button>
          </div>
        </div>
      )}

      <SummaryStrip
        items={[
          { label: 'monitored sites', value: sites.length },
          { label: 'awaiting review', value: reviewCount, tone: reviewCount ? 'amber' : undefined },
          { label: 'with a reported issue', value: sites.filter((site) => site.status === 'reported_issue').length },
          { label: 'confirmed for follow-up', value: followUpCount, tone: followUpCount ? 'rose' : undefined },
          { label: 'over budget', value: overBudget, tone: overBudget ? 'rose' : undefined },
        ]}
      />

      <div className="flex flex-wrap items-center gap-3">
        <label className="relative min-w-[220px] flex-1 sm:max-w-xs">
          <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search water bodies or areas" aria-label="Search sites" className="h-9 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-xs text-slate-700 outline-none focus:border-brand-400" />
        </label>
        <select value={status} onChange={(event) => setStatus(event.target.value)} aria-label="Status" className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-700 outline-none focus:border-brand-400">
          <option value="all">All statuses</option>
          {Object.entries(SITE_STATUS).map(([id, item]) => <option key={id} value={id}>{item.label}</option>)}
        </select>
        <p className="ml-auto text-xs text-slate-500"><strong className="font-semibold text-slate-800">{filtered.length}</strong> of {sites.length} sites</p>
      </div>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-xs">
            <thead className="border-b border-slate-100 bg-slate-50/70 text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">
              <tr>
                <th className="px-5 py-3">Site</th>
                <th className="px-3 py-3">Status</th>
                <th className="px-3 py-3 text-right">Mapped area</th>
                <th className="px-3 py-3 text-right">Open reports</th>
                <th className="px-3 py-3 text-right">Open tasks</th>
                <th className="px-3 py-3 text-right">Budget used</th>
                <th className="px-3 py-3">Next visit</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(({ site, budget, openTasks, nextVisit }) => {
                const statusInfo = SITE_STATUS[site.status] ?? SITE_STATUS.inconclusive
                return (
                  <tr key={site.id} className="hover:bg-slate-50/60">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-1.5">
                        <Link to={`/sites/${site.id}`} className="font-semibold text-slate-800 hover:text-brand-700">{site.name}</Link>
                        {site.custom && <span className="rounded bg-green-100 px-1.5 py-px text-[9px] font-bold uppercase tracking-wide text-green-700">Added</span>}
                      </div>
                      <p className="mt-0.5 text-[10px] text-slate-400">{site.location}{site.type ? ` · ${SITE_TYPES[site.type]?.label}` : ''}{site.authority ? ` · ${site.authority}` : ''}</p>
                    </td>
                    <td className="px-3 py-3"><Badge tone={statusInfo.tone} className="px-2 py-0.5 text-[10px]">{statusInfo.label}</Badge></td>
                    <td className="px-3 py-3 text-right tabular-nums text-slate-600">{site.area}</td>
                    <td className="px-3 py-3 text-right tabular-nums text-slate-700">{site.openReports}</td>
                    <td className="px-3 py-3 text-right tabular-nums text-slate-700">{openTasks}</td>
                    <td className="px-3 py-3 text-right tabular-nums">
                      <span className={cn('font-semibold', budget?.overBudget ? 'text-amber-700' : 'text-slate-700')}>{formatBdt(budget?.actual)}</span>
                      <span className="text-slate-400"> / {formatBdt(budget?.planned)}</span>
                    </td>
                    <td className="px-3 py-3">
                      {nextVisit ? <Link to={`/schedule?meeting=${nextVisit.id}`} className="font-medium text-slate-700 hover:text-brand-700">{formatDateLabel(nextVisit.date)}<span className="text-slate-400"> · {nextVisit.startTime}</span></Link> : <span className="text-slate-400">Not scheduled</span>}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-1">
                        {canSchedule && (
                          <Link
                            to={buildScheduleLink({ new: 'field_visit', site: site.id, title: `${site.name} field verification visit` })}
                            title="Schedule field visit"
                            aria-label={`Schedule field visit to ${site.name}`}
                            className="grid size-8 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                          >
                            <CalendarPlus size={15} />
                          </Link>
                        )}
                        <Link to={`/sites/${site.id}`} className="inline-flex h-8 items-center gap-1 rounded-lg px-2.5 text-[11px] font-semibold text-brand-700 hover:bg-brand-50">Open <ArrowRight size={13} className="text-slate-500" /></Link>
                      </div>
                    </td>
                  </tr>
                )
              })}
              {!filtered.length && <tr><td colSpan={8} className="px-5 py-10 text-center text-xs text-slate-500">No sites match the current filters.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      {adding && <SiteFormModal onClose={() => setAdding(false)} onCreated={(id) => { setAdding(false); setStatus('all'); setAddedId(id) }} />}
    </div>
  )
}

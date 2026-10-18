import { ChevronRight, RotateCcw, Search, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { SITE_GROUP, SITE_STATUS, siteGroup } from '../../constants/status'
import { cn } from '../../utils/cn'
import { ReportCard } from '../community/ReportCard'
import { ReportDetail } from '../community/ReportDetail'
import { SiteDetailsPanel } from './SiteDetailsPanel'
import { WetlandMap } from './WetlandMap'

function WaterBodiesTab({ sites, allSites, reports, allSitesForNames, selectedId, query, status, simple, onQueryChange, onStatusChange, onSelectSite, onSelectReport }) {
  const filters = [
    { id: 'all', label: 'All', count: allSites.length },
    ...(simple
      ? Object.entries(SITE_GROUP).map(([id, config]) => ({ id, label: config.label, color: config.color, count: allSites.filter((site) => siteGroup(site.status) === id).length }))
      : Object.entries(SITE_STATUS).map(([id, config]) => ({ id, label: config.label, color: config.color, count: allSites.filter((site) => site.status === id).length })))
      .filter((filter) => filter.count > 0 || filter.id === status),
  ]
  const dotColor = (site) => (simple ? SITE_GROUP[siteGroup(site.status)].color : SITE_STATUS[site.status].color)

  return (
    <>
      <div className="space-y-2.5 border-b border-slate-100 p-3">
        <label className="relative block">
          <span className="sr-only">Search water bodies</span>
          <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input type="search" value={query} onChange={(event) => onQueryChange(event.target.value)} placeholder="Search by name or area" className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-xs text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-brand-400 focus:bg-white" />
        </label>
        <div className="flex flex-wrap items-center gap-1.5">
          {filters.map((filter) => {
            const active = status === filter.id
            return (
              <button key={filter.id} type="button" onClick={() => onStatusChange(filter.id)} aria-pressed={active} className={cn('inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold transition', active ? 'border-brand-700 bg-brand-700 text-white' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300')}>
                {filter.color && <span className="size-1.5 rounded-sm" style={{ backgroundColor: filter.color }} />}{filter.label}<span className="opacity-65">{filter.count}</span>
              </button>
            )
          })}
          {(query || status !== 'all') && <button type="button" onClick={() => { onQueryChange(''); onStatusChange('all') }} className="ml-auto inline-flex items-center gap-1 text-[10px] font-semibold text-brand-700"><RotateCcw size={11} />Reset</button>}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
       <div className="divide-y divide-slate-100">
        {sites.map((site) => {
          const active = selectedId === site.id
          return (
            <button key={site.id} type="button" onClick={() => onSelectSite(site.id)} className={cn('group flex w-full items-center gap-3 px-3 py-2.5 text-left transition hover:bg-slate-50', active && 'bg-brand-50/60')}>
              <span className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                <img src={site.image} alt="" loading="lazy" className="size-full object-cover" />
                <span className="absolute bottom-1 right-1 size-2.5 rounded-sm border-2 border-white" style={{ backgroundColor: dotColor(site) }} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center justify-between gap-2"><span className="truncate text-xs font-semibold text-slate-800">{site.name}</span><span className="shrink-0 text-[10px] font-medium text-slate-500">{site.area}</span></span>
                <span className="mt-0.5 block truncate text-[10px] text-slate-500">{SITE_STATUS[site.status].label}{site.openReports ? ` · ${site.openReports} open report${site.openReports > 1 ? 's' : ''}` : ''}</span>
                <span className="block truncate text-[10px] text-slate-400">{site.location}</span>
              </span>
              <ChevronRight size={14} className={active ? 'text-slate-700' : 'text-slate-300 group-hover:text-slate-600'} />
            </button>
          )
        })}
        {!sites.length && <div className="px-6 py-10 text-center"><Search size={20} className="mx-auto text-slate-400" /><p className="mt-3 text-xs font-semibold text-slate-700">No matching water bodies</p><p className="mt-1 text-[11px] leading-5 text-slate-400">Adjust the search or status filter.</p></div>}
       </div>
        {reports.length > 0 && (
          <div className="border-t-4 border-slate-100">
            <p className="px-3 pb-1 pt-3 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">Latest reports</p>
            <div className="divide-y divide-slate-100">{reports.slice(0, 3).map((report) => <ReportCard key={report.id} report={report} siteName={allSitesForNames.find((site) => site.id === report.siteId)?.name} onSelect={onSelectReport} />)}</div>
          </div>
        )}
      </div>
    </>
  )
}

function ReportsTab({ reports, sites, selectedReportId, mineEmail, onSelectReport }) {
  const [filter, setFilter] = useState('all')
  const chips = [['all', 'All'], ['open', 'Open'], ['resolved', 'Resolved'], ...(mineEmail ? [['mine', 'Mine']] : [])]
  const shown = reports.filter((report) => {
    if (filter === 'open') return !report.resolved
    if (filter === 'resolved') return report.resolved
    if (filter === 'mine') return report.reporter.email === mineEmail
    return true
  })

  return (
    <>
      <div className="flex flex-wrap items-center gap-1.5 border-b border-slate-100 p-3">
        {chips.map(([id, label]) => <button key={id} type="button" aria-pressed={filter === id} onClick={() => setFilter(id)} className={cn('rounded-full border px-2.5 py-1 text-[10px] font-semibold transition', filter === id ? 'border-brand-700 bg-brand-700 text-white' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300')}>{label}</button>)}
        <span className="ml-auto text-[10px] text-slate-400">{shown.length} shown</span>
      </div>
      <div className="min-h-0 flex-1 divide-y divide-slate-100 overflow-y-auto">
        {shown.map((report) => <ReportCard key={report.id} report={report} siteName={sites.find((site) => site.id === report.siteId)?.name} active={report.id === selectedReportId} onSelect={onSelectReport} />)}
        {!shown.length && <p className="px-6 py-10 text-center text-xs text-slate-500">No reports match this filter.</p>}
      </div>
    </>
  )
}

function ReportPanel({ report, siteName, publicView, mine, canOpenQueue, onClose }) {
  return (
    <article className="max-h-full overflow-y-auto rounded-xl border border-white/80 bg-white/95 p-4 shadow-pop backdrop-blur">
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">Community report</p>
        <button type="button" onClick={onClose} aria-label="Close report" className="grid size-8 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900"><X size={16} /></button>
      </div>
      <ReportDetail report={report} siteName={siteName} ownReport={mine} />
      {!publicView && canOpenQueue && <Link to={`/community?report=${report.id}`} className="mt-4 inline-flex text-xs font-semibold text-brand-700 hover:text-brand-900">Open in community reports</Link>}
    </article>
  )
}

/**
 * Directory, satellite map and detail panel shared by the staff workspace and the public explorer.
 * The side list has two tabs: water bodies and reports. Rejected reports are never shown.
 */
export function MonitoringExplorer({
  sites,
  reports,
  publicView = false,
  initialSiteId = null,
  initialReportId = null,
  mineEmail = null,
  canOpenQueue = true,
  heightClass = 'lg:h-[calc(100vh-13.5rem)] lg:min-h-[540px]',
}) {
  const [tab, setTab] = useState(initialReportId ? 'reports' : 'sites')
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('all')
  const [selectedId, setSelectedId] = useState(initialSiteId)
  const [selectedReportId, setSelectedReportId] = useState(initialReportId)

  const visibleSites = useMemo(() => {
    const search = query.trim().toLowerCase()
    return sites.filter((site) => (status === 'all' || (publicView ? siteGroup(site.status) === status : site.status === status)) && (!search || `${site.name} ${site.location}`.toLowerCase().includes(search)))
  }, [publicView, query, sites, status])

  const liveReports = useMemo(
    () => reports.filter((report) => report.status !== 'rejected').sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [reports],
  )
  const mapReports = useMemo(
    () => liveReports.filter((report) => !report.siteId || visibleSites.some((site) => site.id === report.siteId)),
    [liveReports, visibleSites],
  )
  const selectedSite = visibleSites.find((site) => site.id === selectedId) ?? null
  const selectedReport = mapReports.find((report) => report.id === selectedReportId) ?? null
  const reportSiteName = selectedReport ? sites.find((site) => site.id === selectedReport.siteId)?.name : undefined

  function selectSite(id) {
    setSelectedId(id)
    setSelectedReportId(null)
  }

  function selectReport(id) {
    setSelectedReportId(id)
    setSelectedId(null)
  }

  const panel = selectedReport
    ? <ReportPanel report={selectedReport} siteName={reportSiteName} publicView={publicView} canOpenQueue={canOpenQueue} mine={Boolean(mineEmail) && selectedReport.reporter.email === mineEmail} onClose={() => setSelectedReportId(null)} />
    : selectedSite
      ? <SiteDetailsPanel site={selectedSite} publicView={publicView} showReportsLink={canOpenQueue} onClose={() => setSelectedId(null)} />
      : null

  const tabs = [['sites', 'Water bodies', sites.length], ['reports', 'Reports', liveReports.length]]

  return (
    <section className={cn('grid overflow-hidden rounded-xl border border-slate-200 bg-white shadow-card lg:grid-cols-[340px_minmax(0,1fr)]', heightClass)}>
      <div className="relative order-1 min-w-0 lg:order-2">
        <WetlandMap sites={visibleSites} reports={mapReports} selectedSite={selectedSite} selectedReportId={selectedReport?.id} onSelectSite={selectSite} onSelectReport={selectReport} simple={publicView} className="h-[400px] lg:h-full" />
        {panel && <div className="absolute right-14 top-4 z-[500] hidden max-h-[calc(100%-2rem)] w-[310px] overflow-y-auto rounded-xl shadow-pop lg:block">{panel}</div>}
        {!panel && visibleSites.length > 0 && (
          <div className="pointer-events-none absolute left-1/2 top-3 z-[500] hidden -translate-x-1/2 rounded-lg border border-white/80 bg-white/95 px-3 py-1.5 text-center text-[10px] font-medium text-slate-600 shadow-card backdrop-blur sm:block">
            Select a water body or a diamond marker to see its record
          </div>
        )}
      </div>

      <aside className="order-2 flex min-h-0 flex-col border-t border-slate-200 lg:order-1 lg:border-r lg:border-t-0">
        <div role="tablist" aria-label="Map list" className="grid grid-cols-2 border-b border-slate-200 bg-slate-50/70">
          {tabs.map(([id, label, count]) => (
            <button key={id} type="button" role="tab" aria-selected={tab === id} onClick={() => setTab(id)} className={cn('flex items-center justify-center gap-2 border-b-2 px-3 py-2.5 text-xs font-semibold transition', tab === id ? 'border-brand-600 bg-white text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-800')}>
              {label}<span className="rounded-full bg-slate-200/70 px-1.5 py-0.5 text-[10px] text-slate-600">{count}</span>
            </button>
          ))}
        </div>
        <div className="flex max-h-[420px] min-h-0 flex-1 flex-col lg:max-h-none">
          {tab === 'sites'
            ? <WaterBodiesTab sites={visibleSites} allSites={sites} reports={liveReports} allSitesForNames={sites} simple={publicView} onSelectReport={selectReport} selectedId={selectedSite?.id} query={query} status={status} onQueryChange={setQuery} onStatusChange={setStatus} onSelectSite={selectSite} />
            : <ReportsTab reports={liveReports} sites={sites} selectedReportId={selectedReport?.id} mineEmail={mineEmail} onSelectReport={selectReport} />}
        </div>
      </aside>

      {panel && <div className="order-3 border-t border-slate-200 p-3 lg:hidden">{panel}</div>}
    </section>
  )
}

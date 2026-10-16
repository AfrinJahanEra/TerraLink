import { ArrowLeft, Camera, Layers, MapPin, Ruler, ShieldQuestion } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ReportCard } from '../components/community/ReportCard'
import { ReportDetail } from '../components/community/ReportDetail'
import { WetlandMap } from '../components/map/WetlandMap'
import { MeasuredComparison } from '../components/site/MeasuredComparison'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { StatTile } from '../components/ui/StatTile'
import { VERDICT } from '../constants/observations'
import { SITE_GROUP, SITE_STATUS, siteGroup } from '../constants/status'
import { useApp } from '../hooks/useApp'

export function PublicPondPage() {
  const { siteId } = useParams()
  const { role, sites, communityReports } = useApp()
  const [reportId, setReportId] = useState(null)
  const site = sites.find((item) => item.id === siteId)
  const siteList = useMemo(() => (site ? [site] : []), [site])

  if (!site) {
    return (
      <div className="grid min-h-[50vh] place-items-center text-center">
        <div><MapPin size={28} className="mx-auto text-slate-500" /><h1 className="mt-4 text-lg font-semibold text-slate-900">Water body not found</h1><p className="mt-2 text-sm text-slate-500">This page is not one of the five monitored water bodies.</p><Button as={Link} to="/explore" className="mt-5"><ArrowLeft size={15} />Back to the map</Button></div>
      </div>
    )
  }

  const status = SITE_STATUS[site.status]
  const reports = communityReports.filter((report) => report.siteId === site.id && report.status !== 'rejected').sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  const selected = reports.find((report) => report.id === reportId) ?? null
  const isUser = role?.id === 'user'
  const reportTarget = `/report?site=${site.id}`

  return (
    <div className="animate-fade-in space-y-3">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <Link to="/explore" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900"><ArrowLeft size={13} />All water bodies</Link>
          <div className="mt-1 flex flex-wrap items-center gap-2.5"><h1 className="text-xl font-bold tracking-tight text-slate-950">{site.name}</h1><Badge tone={SITE_GROUP[siteGroup(site.status)].tone}>{status.label}</Badge></div>
          <p className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-500"><MapPin size={13} />{site.location}</p>
        </div>
        <Button as={Link} to={role ? reportTarget : `/login?role=user&next=${encodeURIComponent(reportTarget)}`}><Camera size={16} />{role ? 'Report a problem here' : 'Sign in to report'}</Button>
      </header>

      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        <StatTile icon={Ruler} value={site.area} label="Mapped area" hint="From the outline" />
        <StatTile icon={Camera} value={site.openReports} label="Open reports" hint={`${reports.length} not rejected`} />
        <StatTile icon={Layers} value={site.measured ? VERDICT[site.measured.result.verdict].label : 'Not measured'} label="Water-area change" hint={site.measured ? 'Saved Sentinel-2 comparison' : 'No saved comparison'} />
        <StatTile icon={ShieldQuestion} value="Unverified" label="Boundary" hint="OpenStreetMap" />
      </div>

      <div className="grid grid-cols-1 items-start gap-3 xl:grid-cols-[minmax(0,1.55fr)_minmax(340px,1fr)]">
        <div className="min-w-0 space-y-3">
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-card">
            <WetlandMap sites={siteList} reports={reports} selectedSite={site} selectedReportId={selected?.id} onSelectSite={() => {}} onSelectReport={setReportId} simple className="h-[420px]" />
            <p className="border-t border-slate-100 px-4 py-2.5 text-xs leading-5 text-slate-500">{site.reviewNote}</p>
          </div>
          <MeasuredComparison site={site} showActions={false} />
        </div>

        <div className="min-w-0 space-y-3">
          <section aria-labelledby="pond-reports" className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-card">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3"><h2 id="pond-reports" className="text-[13px] font-semibold text-slate-900">Community reports</h2><span className="text-[11px] text-slate-400">{reports.length}</span></div>
            {reports.length ? (
              <div className="max-h-[360px] divide-y divide-slate-100 overflow-y-auto">{reports.map((report) => <ReportCard key={report.id} report={report} siteName={site.name} active={report.id === reportId} onSelect={setReportId} />)}</div>
            ) : (
              <div className="px-5 py-10 text-center"><p className="text-xs font-semibold text-slate-700">No reports for this water body yet</p><p className="mt-1 text-[11px] text-slate-400">If you see a problem here, report it.</p></div>
            )}
            {selected && <div className="border-t border-slate-100 p-4"><ReportDetail report={selected} siteName={site.name} ownReport={isUser && selected.reporter.email === role.user.email} /></div>}
          </section>
          <section aria-labelledby="pond-about" className="rounded-xl border border-slate-200 bg-white shadow-card">
            <h2 id="pond-about" className="border-b border-slate-100 px-4 py-3 text-[13px] font-semibold text-slate-900">About this record</h2>
            <dl className="divide-y divide-slate-100 px-4 text-xs">
              <div className="flex justify-between gap-4 py-2.5"><dt className="text-slate-400">Status</dt><dd className="text-right font-medium text-slate-700">{status.label}</dd></div>
              <div className="flex justify-between gap-4 py-2.5"><dt className="text-slate-400">Mapped area</dt><dd className="text-right font-medium text-slate-700">{site.area}</dd></div>
              <div className="flex justify-between gap-4 py-2.5"><dt className="text-slate-400">Boundary</dt><dd className="text-right font-medium text-slate-700">OpenStreetMap, not surveyed</dd></div>
              <div className="flex justify-between gap-4 py-2.5"><dt className="text-slate-400">Imagery</dt><dd className="text-right font-medium text-slate-700">Esri World Imagery, Sentinel-2</dd></div>
            </dl>
            <p className="border-t border-slate-100 px-4 py-3 text-[11px] leading-5 text-slate-500">A report is evidence for a reviewer to check. It is not a finding about the whole water body, and a satellite comparison shows where to look, not what caused a change.</p>
          </section>
        </div>
      </div>
    </div>
  )
}

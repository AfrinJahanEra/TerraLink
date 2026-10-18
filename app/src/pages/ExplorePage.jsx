import { Camera, CircleCheck, Droplets, LogIn, ShieldCheck } from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'
import { MonitoringExplorer } from '../components/map/MonitoringExplorer'
import { Button } from '../components/ui/Button'
import { StatTile } from '../components/ui/StatTile'
import { useApp } from '../hooks/useApp'

export function ExplorePage() {
  const { role, sites, communityReports } = useApp()
  const [searchParams] = useSearchParams()
  const reportId = searchParams.get('report')
  const siteId = searchParams.get('site')
  const isUser = role?.id === 'user'

  const live = communityReports.filter((report) => report.status !== 'rejected')
  const mine = isUser ? communityReports.filter((report) => report.reporter.email === role.user.email) : []
  const waiting = mine.filter((report) => report.status === 'pending' || report.status === 'under_review').length

  return (
    <div className="animate-fade-in space-y-3">
      <header className="flex flex-col gap-3 xl:flex-row xl:items-center">
        <div className="min-w-0 xl:w-[340px] xl:shrink-0">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-brand-700">Dhaka water bodies</p>
          <h1 className="mt-0.5 text-xl font-bold tracking-tight text-slate-950">Monitoring map</h1>
          <p className="mt-1 text-xs leading-5 text-slate-500">Mapped shorelines on satellite imagery. Diamond markers are reports from users.</p>
        </div>

        <div className="grid flex-1 grid-cols-2 gap-2 sm:grid-cols-4">
          <StatTile icon={Droplets} value={sites.length} label="Water bodies" />
          <StatTile icon={Camera} value={live.filter((report) => !report.resolved).length} label="Open reports" />
          <StatTile icon={ShieldCheck} value={live.filter((report) => report.status === 'verified').length} label="Verified reports" />
          <StatTile icon={CircleCheck} value={live.filter((report) => report.resolved).length} label="Resolved" />
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2 xl:justify-end">
          {isUser && mine.length > 0 && <Link to="/my-reports" className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-card transition hover:bg-slate-50">Your reports: {mine.length}{waiting ? `, ${waiting} awaiting review` : ''}</Link>}
          {isUser
            ? <Button as={Link} to="/report"><Camera size={16} />Report a problem</Button>
            : <Button as={Link} to={role ? '/report' : '/login?role=user&next=%2Freport'}>{role ? <Camera size={16} /> : <LogIn size={16} />}{role ? 'Report a problem' : 'Sign in to report'}</Button>}
        </div>
      </header>

      <MonitoringExplorer key={`${siteId}-${reportId}`} sites={sites} reports={communityReports} publicView initialSiteId={siteId} initialReportId={reportId} mineEmail={isUser ? role.user.email : null} />
    </div>
  )
}

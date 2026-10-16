import { useSearchParams } from 'react-router-dom'
import { MonitoringExplorer } from '../components/map/MonitoringExplorer'
import { PageHeader } from '../components/ui/PageHeader'
import { SummaryStrip } from '../components/ui/SummaryStrip'
import { OPEN_REPORT_STATUSES } from '../constants/reports'
import { useApp } from '../hooks/useApp'

export function MapPage() {
  const { role, can, scope } = useApp()
  const { sites, communityReports } = scope
  const [searchParams] = useSearchParams()
  const openReports = communityReports.filter((report) => OPEN_REPORT_STATUSES.includes(report.status)).length

  return (
    <div className="animate-fade-in space-y-5 pb-8">
      <PageHeader
        eyebrow="Monitoring network"
        description={role.id === 'coordinator' ? 'The water bodies you have tasks at, drawn from their mapped outlines on satellite imagery. Select an outline to open its record.' : 'Five water bodies in Dhaka, drawn from their mapped outlines on satellite imagery. Select an outline to open its record, or a diamond marker to read a community report.'}
      />

      <SummaryStrip
        items={role.id === 'coordinator' ? [
          { label: 'of your water bodies', value: sites.length },
          { label: 'of your tasks are open', value: scope.tasks.filter((task) => task.status !== 'completed' && task.status !== 'cancelled').length },
        ] : [
          { label: 'water bodies monitored', value: sites.length },
          { label: 'need review', value: sites.filter((site) => site.status === 'needs_review').length },
          { label: 'with a reported issue', value: sites.filter((site) => site.status === 'reported_issue').length, tone: 'rose' },
          { label: 'open community reports', value: openReports },
        ]}
      />

      <MonitoringExplorer
        sites={sites}
        reports={communityReports}
        initialSiteId={searchParams.get('site')}
        initialReportId={searchParams.get('report')}
        canOpenQueue={can('community.view')}
      />

      <p className="text-[10px] leading-5 text-slate-400">Satellite tiles: Esri World Imagery and its data partners. Street tiles and water-body outlines: OpenStreetMap contributors (ODbL). Site classifications are sample data; water-area change has not been measured.</p>
    </div>
  )
}

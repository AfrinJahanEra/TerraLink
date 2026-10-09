import { CalendarPlus, Eye, FileDown, FileText, Mail, RefreshCw } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ReportPreview } from '../components/reports/ReportPreview'
import { ShareReportModal } from '../components/reports/ShareReportModal'
import { Button } from '../components/ui/Button'
import { PageHeader } from '../components/ui/PageHeader'
import { Toast } from '../components/ui/Toast'
import { useApp } from '../hooks/useApp'
import { useNotice } from '../hooks/useNotice'
import { describeEmailResult } from '../utils/communications'
import { buildReportData, buildReportEmailSummary } from '../utils/report'
import { buildScheduleLink } from '../utils/schedule'

const secondaryLinkClass = 'inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 shadow-card hover:bg-slate-50'

export function ReportPage() {
  const { role, sites, tasks, decisions, expenses, siteBudgets, teamMembers, shareReport } = useApp()
  const [siteId, setSiteId] = useState('pond-a')
  const [from, setFrom] = useState('2026-09-01')
  const [to, setTo] = useState('2026-10-31')
  const [generated, setGenerated] = useState(null)
  const [shareOpen, setShareOpen] = useState(false)
  const [shareVersion, setShareVersion] = useState(0)
  const [notice, showNotice] = useNotice(3500)
  const canGenerate = Boolean(siteId && from && to && from <= to)
  const canSchedule = role.id === 'manager' || role.id === 'operator'

  const currentReport = useMemo(() => generated ? buildReportData({
    sites, tasks, decisions, expenses, siteBudgets, ...generated,
  }) : null, [decisions, expenses, generated, siteBudgets, sites, tasks])

  const scope = currentReport ? (currentReport.siteId === 'all' ? 'All monitored wetlands' : currentReport.sites[0]?.name ?? 'Selected site') : ''
  const reportTitle = currentReport ? `${scope}, ${currentReport.from} to ${currentReport.to}` : ''
  const reportSummary = useMemo(() => currentReport ? buildReportEmailSummary(currentReport) : '', [currentReport])
  const defaultRecipientIds = teamMembers.filter((member) => member.id === 'member-nusrat' && member.name !== role.user.name).map((member) => member.id)

  function generateReport() {
    if (!canGenerate) {
      showNotice('Choose a valid site and date range.')
      return
    }
    setGenerated({ siteId, from, to })
    window.setTimeout(() => document.getElementById('report-preview')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80)
    showNotice('Report preview generated from the current workspace state.')
  }

  function openShare() {
    setShareVersion((version) => version + 1)
    setShareOpen(true)
  }

  async function handleShare({ recipientIds, note }) {
    const logs = await shareReport({ recipientIds, title: reportTitle, summary: reportSummary, note })
    setShareOpen(false)
    showNotice(describeEmailResult(logs, 'report email'))
  }

  const briefingLink = currentReport ? buildScheduleLink({
    new: 'report_briefing',
    site: currentReport.siteId === 'all' ? '' : currentReport.siteId,
    title: `Report briefing: ${scope}`,
    agenda: `Walk through the ${reportTitle} report and agree follow-up actions.`,
  }) : ''

  return (
    <div className="report-page animate-fade-in space-y-6 pb-8">
      <PageHeader
        className="print-hidden"
        eyebrow="Accountability"
        title="Reports"
        description="Generate an A4-ready record from current observations, decisions, tasks, and costs, then share it or schedule a briefing."
        actions={currentReport && (
          <>
            {canSchedule && <Link to={briefingLink} className={secondaryLinkClass}><CalendarPlus size={15} className="text-slate-500" />Schedule briefing</Link>}
            <Button type="button" variant="secondary" onClick={openShare}><Mail size={15} />Share by email</Button>
            <Button type="button" onClick={() => window.print()}><FileDown size={15} />Print / Save as PDF</Button>
          </>
        )}
      />

      <section className="print-hidden rounded-xl border border-slate-200 bg-white p-5 shadow-card">
        <div className="grid gap-4 lg:grid-cols-[minmax(180px,1fr)_minmax(150px,0.65fr)_minmax(150px,0.65fr)_auto] lg:items-end">
          <label><span className="text-xs font-semibold text-slate-700">Site scope</span><select value={siteId} onChange={(event) => setSiteId(event.target.value)} className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-700 outline-none focus:border-brand-400"><option value="all">All monitored sites</option>{sites.map((site) => <option key={site.id} value={site.id}>{site.name} · {site.location}</option>)}</select></label>
          <label><span className="text-xs font-semibold text-slate-700">From</span><input type="date" value={from} onChange={(event) => setFrom(event.target.value)} className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 px-3 text-xs text-slate-700 outline-none focus:border-brand-400" /></label>
          <label><span className="text-xs font-semibold text-slate-700">To</span><input type="date" value={to} min={from} onChange={(event) => setTo(event.target.value)} className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 px-3 text-xs text-slate-700 outline-none focus:border-brand-400" /></label>
          <Button type="button" onClick={generateReport} disabled={!canGenerate}>{currentReport ? <RefreshCw size={15} /> : <Eye size={15} />}{currentReport ? 'Refresh preview' : 'Generate preview'}</Button>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-slate-100 pt-3 text-[10px] text-slate-400"><span>Current browser state</span><span>Sample measurements</span><span>Native A4 print output</span></div>
      </section>

      {currentReport ? <ReportPreview report={currentReport} /> : (
        <section className="print-hidden grid min-h-[360px] place-items-center rounded-xl border border-dashed border-slate-300 bg-white px-6 text-center"><div><FileText size={30} className="mx-auto text-slate-400" /><h2 className="mt-4 text-sm font-semibold text-slate-800">Build a current-state report</h2><p className="mx-auto mt-1 max-w-md text-xs leading-5 text-slate-500">Choose a site and reporting period, then generate a preview before printing, sharing, or scheduling a briefing.</p></div></section>
      )}

      <ShareReportModal
        key={shareVersion}
        open={shareOpen && Boolean(currentReport)}
        title={reportTitle}
        summary={reportSummary}
        members={teamMembers}
        defaultRecipientIds={defaultRecipientIds}
        onClose={() => setShareOpen(false)}
        onSend={handleShare}
      />
      <Toast message={notice} className="print-hidden" />
    </div>
  )
}

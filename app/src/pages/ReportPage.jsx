import { addDays, todayInDhaka } from '../utils/reports'
import { CalendarPlus, Download, Eye, FileText, LoaderCircle, RefreshCw, Send } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { ReportPreview } from '../components/reports/ReportPreview'
import { ShareReportModal } from '../components/reports/ShareReportModal'
import { Button } from '../components/ui/Button'
import { PageHeader } from '../components/ui/PageHeader'
import { Toast } from '../components/ui/Toast'
import { useApp } from '../hooks/useApp'
import { useNotice } from '../hooks/useNotice'
import { resolveEmailSetup } from '../services/email'
import { getReportsLink } from '../services/links'
import { downloadReportPdf, reportPdfAttachment } from '../services/reportPdf'
import { buildReportData, buildReportEmailSummary } from '../utils/report'
import { reportPeriod, reportScope } from '../utils/reportDocument'
import { buildReportEmailHtml, reportEmailSubject } from '../utils/reportEmail'
import { useMeeting } from '../hooks/useMeeting'

const secondaryLinkClass = 'inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 shadow-card hover:bg-slate-50'

export function ReportPage() {
  const { role, can, sites, tasks, decisions, expenses, siteBudgets, communityReports, teamMembers, shareReport } = useApp()
  const [siteId, setSiteId] = useState('gulshan-baridhara-lake')
  const [from, setFrom] = useState(addDays(todayInDhaka(), -45))
  const [to, setTo] = useState(addDays(todayInDhaka(), 30))
  const [generated, setGenerated] = useState(null)
  const [sendOpen, setSendOpen] = useState(false)
  const [sendVersion, setSendVersion] = useState(0)
  const [attachment, setAttachment] = useState(null)
  const [attachmentError, setAttachmentError] = useState('')
  const [downloading, setDownloading] = useState(false)
  const [notice, showNotice] = useNotice(3500)
  const [emailSetup, setEmailSetup] = useState({ configured: false, checking: true, missing: [] })
  useEffect(() => {
    let active = true
    resolveEmailSetup().then((setup) => { if (active) setEmailSetup(setup) })
    return () => { active = false }
  }, [])

  const canGenerate = Boolean(siteId && from && to && from <= to)
  const canSchedule = can('schedule.manage')

  const currentReport = useMemo(() => generated ? buildReportData({
    sites, tasks, decisions, expenses, siteBudgets, communityReports, ...generated,
  }) : null, [communityReports, decisions, expenses, generated, siteBudgets, sites, tasks])

  const scope = currentReport ? reportScope(currentReport) : ''
  const reportTitle = currentReport ? `${scope}, ${reportPeriod(currentReport)}` : ''
  const reportSummary = useMemo(() => currentReport ? buildReportEmailSummary(currentReport) : '', [currentReport])

  function generateReport() {
    if (!canGenerate) {
      showNotice('Choose a valid site and date range.')
      return
    }
    setGenerated({ siteId, from, to })
    window.setTimeout(() => document.getElementById('report-preview')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80)
    showNotice('Report generated from the current workspace.')
  }

  async function handleDownload() {
    setDownloading(true)
    try {
      const filename = await downloadReportPdf(currentReport)
      showNotice(`Saved ${filename}`)
    } catch (error) {
      showNotice(error instanceof Error ? `The PDF could not be created: ${error.message}` : 'The PDF could not be created.')
    } finally {
      setDownloading(false)
    }
  }

  async function openSend() {
    setSendVersion((version) => version + 1)
    setAttachment(null)
    setAttachmentError('')
    setSendOpen(true)
    try {
      setAttachment(await reportPdfAttachment(currentReport))
    } catch (error) {
      setAttachmentError(error instanceof Error ? `The PDF could not be created: ${error.message}` : 'The PDF could not be created.')
    }
  }

  async function handleSend(recipient, note) {
    const [log] = await shareReport({
      recipients: [recipient],
      title: reportTitle,
      subject: reportEmailSubject(currentReport),
      summary: reportSummary,
      note,
      attachment,
      html: (member) => buildReportEmailHtml({ report: currentReport, recipientName: member.name.includes('@') ? '' : member.name, note, filename: attachment.filename, link: getReportsLink() }),
    })
    return log
  }

  const { openMeeting } = useMeeting()
  const briefing = () => openMeeting({
    siteId: currentReport.siteId === 'all' ? '' : currentReport.siteId,
    title: `Report briefing: ${scope}`,
    agenda: `Walk through the ${reportTitle} report and agree follow-up actions.`,
  })

  return (
    <div className="animate-fade-in space-y-6 pb-8">
      <PageHeader
        eyebrow="Accountability"
        title="Reports"
        description="Generate a report from current observations, decisions, tasks and costs. Download it as a PDF, or email it with the PDF attached."
        actions={currentReport && (
          <>
            {canSchedule && <button type="button" onClick={briefing} className={secondaryLinkClass}><CalendarPlus size={15} className="text-slate-500" />Schedule briefing</button>}
            <Button type="button" variant="secondary" onClick={handleDownload} disabled={downloading}>{downloading ? <LoaderCircle size={15} className="animate-spin" /> : <Download size={15} />}{downloading ? 'Preparing…' : 'Download PDF'}</Button>
            {can('reports.share') && <Button type="button" onClick={openSend}><Send size={15} />Send</Button>}
          </>
        )}
      />

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-card">
        <div className="grid gap-4 lg:grid-cols-[minmax(180px,1fr)_minmax(150px,0.65fr)_minmax(150px,0.65fr)_auto] lg:items-end">
          <label><span className="text-xs font-semibold text-slate-700">Site scope</span><select value={siteId} onChange={(event) => setSiteId(event.target.value)} className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-700 outline-none focus:border-brand-400"><option value="all">All monitored sites</option>{sites.map((site) => <option key={site.id} value={site.id}>{site.name} · {site.location}</option>)}</select></label>
          <label><span className="text-xs font-semibold text-slate-700">From</span><input type="date" value={from} onChange={(event) => setFrom(event.target.value)} className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 px-3 text-xs text-slate-700 outline-none focus:border-brand-400" /></label>
          <label><span className="text-xs font-semibold text-slate-700">To</span><input type="date" value={to} min={from} onChange={(event) => setTo(event.target.value)} className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 px-3 text-xs text-slate-700 outline-none focus:border-brand-400" /></label>
          <Button type="button" onClick={generateReport} disabled={!canGenerate}>{currentReport ? <RefreshCw size={15} /> : <Eye size={15} />}{currentReport ? 'Refresh report' : 'Generate report'}</Button>
        </div>
      </section>

      {currentReport ? <ReportPreview report={currentReport} /> : (
        <section className="grid min-h-[360px] place-items-center rounded-xl border border-dashed border-slate-300 bg-white px-6 text-center"><div><FileText size={30} className="mx-auto text-slate-400" /><h2 className="mt-4 text-sm font-semibold text-slate-800">Build a current-state report</h2><p className="mx-auto mt-1 max-w-md text-xs leading-5 text-slate-500">Choose a site and reporting period, then generate the report. You can then download it as a PDF or email it to your team.</p></div></section>
      )}

      <ShareReportModal
        key={sendVersion}
        open={sendOpen && Boolean(currentReport)}
        title={reportTitle}
        subject={currentReport ? reportEmailSubject(currentReport) : ''}
        attachment={attachment}
        attachmentError={attachmentError}
        emailSetup={emailSetup}
        members={teamMembers}
        currentUserEmail={role.user.email}
        onClose={() => setSendOpen(false)}
        onSend={handleSend}
      />
      <Toast message={notice} />
    </div>
  )
}

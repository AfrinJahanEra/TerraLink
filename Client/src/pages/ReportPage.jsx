import { Eye, FileDown, FileText, Mail, RefreshCw } from 'lucide-react'
import { useMemo, useState } from 'react'
import { ReportPreview } from '../components/reports/ReportPreview'
import { Button } from '../components/ui/Button'
import { useApp } from '../hooks/useApp'
import { buildReportData, buildReportEmailSummary } from '../utils/report'

export function ReportPage() {
  const { sites, tasks, decisions, expenses, siteBudgets, emailReportSummary } = useApp()
  const [siteId, setSiteId] = useState('pond-a')
  const [from, setFrom] = useState('2026-09-01')
  const [to, setTo] = useState('2026-10-31')
  const [generated, setGenerated] = useState(null)
  const [sending, setSending] = useState(false)
  const [notice, setNotice] = useState('')
  const canGenerate = Boolean(siteId && from && to && from <= to)

  const currentReport = useMemo(() => generated ? buildReportData({
    sites, tasks, decisions, expenses, siteBudgets, ...generated,
  }) : null, [decisions, expenses, generated, siteBudgets, sites, tasks])

  function showNotice(message) {
    setNotice(message)
    window.setTimeout(() => setNotice(''), 3200)
  }

  function generateReport() {
    if (!canGenerate) {
      showNotice('Choose a valid site and date range.')
      return
    }
    setGenerated({ siteId, from, to })
    window.setTimeout(() => document.getElementById('report-preview')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80)
    showNotice('Report preview generated from the current workspace state.')
  }

  async function emailReport() {
    if (!currentReport) return
    setSending(true)
    const scope = currentReport.siteId === 'all' ? 'All monitored wetlands' : currentReport.sites[0]?.name
    try {
      const result = await emailReportSummary(
        `${scope}, ${currentReport.from} to ${currentReport.to}`,
        buildReportEmailSummary(currentReport),
      )
      showNotice(result.status === 'Failed' ? 'Email delivery failed. See Integrations for details.' : 'Report summary email sent.')
    } catch (error) {
      showNotice(error instanceof Error ? error.message : 'Report email could not be sent.')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="report-page animate-fade-in space-y-6 pb-8">
      <header className="print-hidden flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div><p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-700">Accountability</p><h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">Reports</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">Generate an A4-ready record from the current observations, decisions, tasks, and costs.</p></div>
        {currentReport && <div className="flex flex-wrap gap-2"><Button type="button" variant="secondary" onClick={emailReport} disabled={sending}><Mail size={15} />{sending ? 'Sending...' : 'Email this report'}</Button><Button type="button" onClick={() => window.print()}><FileDown size={15} />Print / Save as PDF</Button></div>}
      </header>

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
        <section className="print-hidden grid min-h-[360px] place-items-center rounded-xl border border-dashed border-slate-300 bg-white px-6 text-center"><div><FileText size={30} className="mx-auto text-slate-400" /><h2 className="mt-4 text-sm font-semibold text-slate-800">Build a current-state report</h2><p className="mx-auto mt-1 max-w-md text-xs leading-5 text-slate-500">Choose a site and reporting period, then generate a preview before printing or saving it as PDF.</p></div></section>
      )}

      {notice && <div role="status" className="print-hidden fixed bottom-5 right-5 z-[1100] max-w-sm rounded-lg border border-slate-200 bg-white px-4 py-3 text-xs font-semibold text-slate-700 shadow-pop">{notice}</div>}
    </div>
  )
}

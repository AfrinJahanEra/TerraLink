import { ClipboardPlus, ShieldCheck } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ReportCard } from '../components/community/ReportCard'
import { ReportDetail } from '../components/community/ReportDetail'
import { Button } from '../components/ui/Button'
import { PageHeader } from '../components/ui/PageHeader'
import { SummaryStrip } from '../components/ui/SummaryStrip'
import { REPORT_STATUS } from '../constants/reports'
import { useApp } from '../hooks/useApp'
import { cn } from '../utils/cn'

/** Which review steps a report can take from its current status. */
const NEXT_STEPS = {
  pending: [
    { to: 'under_review', label: 'Start review', variant: 'secondary' },
    { to: 'verified', label: 'Verify', variant: 'primary' },
    { to: 'rejected', label: 'Reject', variant: 'secondary', needsReason: true },
  ],
  under_review: [
    { to: 'verified', label: 'Verify', variant: 'primary' },
    { to: 'rejected', label: 'Reject', variant: 'secondary', needsReason: true },
  ],
  verified: [{ to: 'under_review', label: 'Reopen review', variant: 'secondary' }],
  rejected: [{ to: 'under_review', label: 'Reopen review', variant: 'secondary' }],
}

function ReviewActions({ report, canReview, onReview }) {
  const [note, setNote] = useState('')
  const [error, setError] = useState('')

  if (!canReview) {
    return <p className="mt-5 flex items-start gap-2 rounded-lg bg-slate-50 px-3 py-2.5 text-[11px] leading-5 text-slate-500"><ShieldCheck size={14} className="mt-0.5 shrink-0" />Only the project manager can change the review status of a report.</p>
  }

  function apply(step) {
    if (step.needsReason && note.trim().length < 5) {
      setError('Give a short reason so the reporter and the audit trail show why.')
      return
    }
    onReview(report.id, step.to, note.trim() || (step.to === 'under_review' ? 'Review started' : 'Evidence accepted'))
    setNote('')
    setError('')
  }

  return (
    <section aria-label="Review actions" className="mt-5 border-t border-slate-100 pt-5">
      <label className="block">
        <span className="text-xs font-semibold text-slate-700">Reviewer note</span>
        <textarea value={note} onChange={(event) => { setNote(event.target.value); setError('') }} rows={3} placeholder="What did you check? A reason is required to reject." className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs leading-5 text-slate-700 outline-none focus:border-brand-400" />
      </label>
      {error && <p role="alert" className="mt-1.5 text-[11px] font-medium text-rose-600">{error}</p>}
      <div className="mt-3 flex flex-wrap gap-2">
        {NEXT_STEPS[report.status].map((step) => <Button key={step.to} type="button" variant={step.variant} onClick={() => apply(step)} className="min-h-9 px-3 text-xs">{step.label}</Button>)}
        {report.status === 'verified' && report.siteId && (
          <Button as={Link} to={`/tasks?new=task&site=${report.siteId}&report=${report.id}`} variant="secondary" className="min-h-9 px-3 text-xs"><ClipboardPlus size={14} className="text-slate-600" />{report.tasks.length ? 'Create another task' : 'Create field task'}</Button>
        )}
      </div>
    </section>
  )
}

export function CommunityReportsPage() {
  const { can, sites, communityReports, reviewReport } = useApp()
  const [searchParams, setSearchParams] = useSearchParams()
  const [statusFilter, setStatusFilter] = useState('all')
  const siteFilter = searchParams.get('site') ?? 'all'
  const selectedId = searchParams.get('report')
  const canReview = can('community.review')
  const siteName = (id) => sites.find((site) => site.id === id)?.name

  const counts = useMemo(() => Object.fromEntries(Object.keys(REPORT_STATUS).map((status) => [status, communityReports.filter((report) => report.status === status).length])), [communityReports])
  const visible = useMemo(
    () => communityReports
      .filter((report) => (statusFilter === 'all' || report.status === statusFilter) && (siteFilter === 'all' || report.siteId === siteFilter))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [communityReports, siteFilter, statusFilter],
  )
  const selected = communityReports.find((report) => report.id === selectedId) ?? null

  function setParam(key, value) {
    const next = new URLSearchParams(searchParams)
    if (value && value !== 'all') next.set(key, value)
    else next.delete(key)
    setSearchParams(next, { replace: true })
  }

  return (
    <div className="animate-fade-in space-y-5 pb-8">
      <PageHeader
        eyebrow="Monitoring"
        description="Photo reports from residents. Check each one against its evidence, then verify or reject it. A verified report supports a field task but does not by itself prove harm to the water body."
        actions={<Button as={Link} to="/report" variant="secondary" className="min-h-9 text-xs">Open public report form</Button>}
      />

      <SummaryStrip
        items={[
          { label: 'pending', value: counts.pending, tone: counts.pending ? 'amber' : undefined },
          { label: 'under review', value: counts.under_review },
          { label: 'verified', value: counts.verified },
          { label: 'rejected', value: counts.rejected },
        ]}
        note={canReview ? undefined : 'Read-only for your role'}
      />

      <div className="flex flex-wrap items-center gap-2">
        {[['all', 'All'], ...Object.entries(REPORT_STATUS).map(([id, item]) => [id, item.label])].map(([id, label]) => (
          <button key={id} type="button" aria-pressed={statusFilter === id} onClick={() => setStatusFilter(id)} className={cn('rounded-full border px-3 py-1.5 text-[11px] font-semibold transition', statusFilter === id ? 'border-slate-700 bg-slate-800 text-white' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300')}>{label}</button>
        ))}
        <label className="ml-auto flex items-center gap-2 text-[11px] font-semibold text-slate-500">
          Water body
          <select value={siteFilter} onChange={(event) => setParam('site', event.target.value)} className="h-9 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-700 outline-none focus:border-brand-400">
            <option value="all">All water bodies</option>
            {sites.map((site) => <option key={site.id} value={site.id}>{site.name}</option>)}
          </select>
        </label>
      </div>

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(380px,0.8fr)]">
        <section aria-label="Reports" className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-card">
          {visible.length ? (
            <div className="divide-y divide-slate-100">
              {visible.map((report) => <ReportCard key={report.id} report={report} siteName={siteName(report.siteId)} active={report.id === selectedId} onSelect={(id) => setParam('report', id)} />)}
            </div>
          ) : (
            <p className="px-5 py-12 text-center text-xs text-slate-500">No reports match these filters.</p>
          )}
        </section>

        <section aria-label="Report detail" className="rounded-xl border border-slate-200 bg-white p-5 shadow-card xl:sticky xl:top-4">
          {selected ? (
            <ReportDetail report={selected} siteName={siteName(selected.siteId)} showPrivate>
              <ReviewActions key={`${selected.id}-${selected.status}`} report={selected} canReview={canReview} onReview={reviewReport} />
            </ReportDetail>
          ) : (
            <p className="py-10 text-center text-xs text-slate-500">Select a report to see its evidence and review history.</p>
          )}
        </section>
      </div>
    </div>
  )
}

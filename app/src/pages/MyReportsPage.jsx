import { Camera, CircleCheck, FileText, Hourglass, LogIn, ShieldCheck } from 'lucide-react'
import { REPORT_STATUS } from '../constants/reports'
import { formatDateTime } from '../utils/reports'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ReportCard } from '../components/community/ReportCard'
import { ReportDetail } from '../components/community/ReportDetail'
import { Button } from '../components/ui/Button'
import { StatTile } from '../components/ui/StatTile'
import { useApp } from '../hooks/useApp'
import { cn } from '../utils/cn'

const FILTERS = [
  ['all', 'All', () => true],
  ['waiting', 'Awaiting review', (report) => report.status === 'pending' || report.status === 'under_review'],
  ['verified', 'Verified', (report) => report.status === 'verified' && !report.resolved],
  ['resolved', 'Resolved', (report) => report.resolved],
  ['rejected', 'Rejected', (report) => report.status === 'rejected'],
]

export function MyReportsPage() {
  const { role, sites, communityReports } = useApp()
  const [selectedId, setSelectedId] = useState(null)
  const [filter, setFilter] = useState('all')
  const siteName = (id) => sites.find((site) => site.id === id)?.name

  const mine = useMemo(
    () => role ? communityReports.filter((report) => report.reporter.email === role.user.email).sort((a, b) => b.createdAt.localeCompare(a.createdAt)) : [],
    [communityReports, role],
  )
  const count = (id) => mine.filter(FILTERS.find(([key]) => key === id)[2]).length
  const shown = mine.filter(FILTERS.find(([key]) => key === filter)[2])
  // Decisions made by reviewers on this user's reports, newest first.
  const updates = mine
    .flatMap((report) => report.history.filter((entry) => entry.status !== 'pending').map((entry) => ({ ...entry, reportId: report.id })))
    .sort((a, b) => b.at.localeCompare(a.at))
    .slice(0, 5)
  const selected = shown.find((report) => report.id === selectedId) ?? shown[0] ?? null

  if (role?.id !== 'user') {
    return (
      <div className="mx-auto mt-6 max-w-xl rounded-xl border border-slate-200 bg-white p-6 text-center shadow-card">
        <span className="mx-auto grid size-11 place-items-center rounded-full bg-brand-50 text-brand-700"><LogIn size={22} /></span>
        <h1 className="mt-4 text-lg font-bold tracking-tight text-slate-950">My reports</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">{role ? 'This page follows the reports of a signed-in user. Staff can review all reports in the community reports queue.' : 'Sign in as a user to follow the reports you have sent.'}</p>
        <Button as={Link} to={role ? '/community' : '/login?role=user&next=%2Fmy-reports'} className="mt-5">{role ? 'Open community reports' : 'Log in as a user'}</Button>
      </div>
    )
  }

  return (
    <div className="animate-fade-in space-y-3">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-brand-700">Signed in as {role.user.name}</p>
          <h1 className="mt-0.5 text-xl font-bold tracking-tight text-slate-950">My reports</h1>
          <p className="mt-1 text-xs leading-5 text-slate-500">Follow each report from submission to a reviewer’s decision and any action taken.</p>
        </div>
        <Button as={Link} to="/report"><Camera size={16} />Report a problem</Button>
      </header>

      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
        <StatTile icon={FileText} value={mine.length} label="Reports sent" />
        <StatTile icon={Hourglass} value={count('waiting')} label="Awaiting review" />
        <StatTile icon={ShieldCheck} value={count('verified')} label="Verified" />
        <StatTile icon={CircleCheck} value={count('resolved')} label="Resolved" />
      </div>

      {mine.length ? (
        <div className="grid grid-cols-1 items-start gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(380px,0.85fr)]">
          <div className="min-w-0 space-y-3">
          <section aria-label="My reports" className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-card">
            <div className="flex flex-wrap items-center gap-1.5 border-b border-slate-100 px-3 py-2.5">
              {FILTERS.map(([id, label]) => (
                <button key={id} type="button" aria-pressed={filter === id} onClick={() => setFilter(id)} className={cn('inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold transition', filter === id ? 'border-brand-700 bg-brand-700 text-white' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300')}>{label}<span className="opacity-65">{count(id)}</span></button>
              ))}
            </div>
            <div className="divide-y divide-slate-100">
              {shown.map((report) => <ReportCard key={report.id} report={report} siteName={siteName(report.siteId)} active={report.id === selected?.id} onSelect={setSelectedId} />)}
              {!shown.length && <p className="px-5 py-10 text-center text-xs text-slate-500">No reports in this group.</p>}
            </div>
          </section>
          <section aria-label="Updates" className="rounded-xl border border-slate-200 bg-white shadow-card">
            <h2 className="border-b border-slate-100 px-4 py-2.5 text-[13px] font-semibold text-slate-900">Updates from reviewers</h2>
            {updates.length ? (
              <ul className="divide-y divide-slate-100">
                {updates.map((entry) => (
                  <li key={entry.id} className="flex items-start gap-3 px-4 py-2.5">
                    <span className="mt-1.5 size-2 shrink-0 rounded-full" style={{ backgroundColor: REPORT_STATUS[entry.status].color }} />
                    <div className="min-w-0 flex-1"><p className="text-xs font-semibold text-slate-800">{entry.reportId} moved to {REPORT_STATUS[entry.status].label.toLowerCase()}</p>{entry.note && <p className="mt-0.5 text-[11px] leading-4 text-slate-500">{entry.note}</p>}</div>
                    <span className="shrink-0 text-[10px] text-slate-400">{entry.by} · {formatDateTime(entry.at)}</span>
                  </li>
                ))}
              </ul>
            ) : <p className="px-4 py-5 text-center text-[11px] text-slate-400">Nothing has changed yet. A reviewer will update you here.</p>}
          </section>
        </div>
          <section aria-label="Report detail" className="rounded-xl border border-slate-200 bg-white p-4 shadow-card lg:sticky lg:top-[4.5rem]">
            {selected ? <ReportDetail report={selected} siteName={siteName(selected.siteId)} ownReport /> : <p className="py-10 text-center text-xs text-slate-500">Select a report to see its progress.</p>}
          </section>
        </div>
      ) : (
        <section className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
          <Camera size={28} className="mx-auto text-slate-400" />
          <h2 className="mt-3 text-sm font-semibold text-slate-900">You have not sent a report yet</h2>
          <p className="mt-1 text-xs text-slate-500">If you see waste, pollution or filling at a water body, a photo and a pin is all it takes.</p>
          <Button as={Link} to="/report" className="mt-4">Report a problem</Button>
        </section>
      )}
    </div>
  )
}

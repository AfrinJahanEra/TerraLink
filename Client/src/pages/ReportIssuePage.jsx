import { Check, CircleCheck, Clock3, LogIn, ShieldAlert } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { ReportForm } from '../components/community/ReportForm'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { REPORT_STATUS } from '../constants/reports'
import { useApp } from '../hooks/useApp'
import { formatShortDate } from '../utils/reports'

const STEPS = [
  ['Send the report', 'Photo, place and a short description.'],
  ['A reviewer checks it', 'The evidence is verified or rejected, with a reason.'],
  ['The team acts', 'A verified report can become a field task, and you see the outcome.'],
]

const CHECKLIST = [
  'A clear photo of the problem itself',
  'A wider shot that shows where it is',
  'The pin on the exact spot, not the lake centre',
  'What you saw, not guesses about the cause',
]

function Aside({ mine }) {
  return (
    <aside className="space-y-3 xl:sticky xl:top-[4.5rem] xl:self-start" aria-label="Reporting guide">
      <section className="rounded-xl border border-slate-200 bg-white shadow-card">
        <h2 className="border-b border-slate-100 px-4 py-2.5 text-[13px] font-semibold text-slate-900">What happens next</h2>
        <ol className="space-y-3 p-4">
          {STEPS.map(([title, text], index) => (
            <li key={title} className="flex gap-3">
              <span className="grid size-6 shrink-0 place-items-center rounded-full bg-brand-100 text-[11px] font-bold text-brand-800">{index + 1}</span>
              <div><p className="text-xs font-semibold text-slate-800">{title}</p><p className="mt-0.5 text-[11px] leading-4 text-slate-500">{text}</p></div>
            </li>
          ))}
        </ol>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white shadow-card">
        <h2 className="border-b border-slate-100 px-4 py-2.5 text-[13px] font-semibold text-slate-900">A report reviewers can act on</h2>
        <ul className="space-y-2 p-4">
          {CHECKLIST.map((item) => <li key={item} className="flex items-start gap-2.5 text-xs leading-5 text-slate-600"><Check size={14} className="mt-0.5 shrink-0 text-brand-600" />{item}</li>)}
        </ul>
      </section>

      {mine && (
        <section className="rounded-xl border border-slate-200 bg-white shadow-card">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2.5"><h2 className="text-[13px] font-semibold text-slate-900">Your recent reports</h2><Link to="/my-reports" className="text-[11px] font-semibold text-brand-700 hover:text-brand-900">View all</Link></div>
          {mine.length ? (
            <ul className="divide-y divide-slate-100">
              {mine.slice(0, 3).map((report) => (
                <li key={report.id}>
                  <Link to="/my-reports" className="flex items-center gap-3 px-4 py-2.5 transition hover:bg-slate-50">
                    <div className="min-w-0 flex-1"><p className="truncate text-xs font-semibold text-slate-800">{report.id} · {formatShortDate(report.observedAt)}</p><p className="truncate text-[11px] text-slate-500">{report.description}</p></div>
                    <Badge tone={REPORT_STATUS[report.status].tone} className="px-2 py-0.5 text-[10px]">{REPORT_STATUS[report.status].label}</Badge>
                  </Link>
                </li>
              ))}
            </ul>
          ) : <p className="px-4 py-5 text-center text-[11px] text-slate-400">You have not sent a report yet.</p>}
        </section>
      )}
    </aside>
  )
}

function Confirmation({ report, siteName, onAnother }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-card" aria-live="polite">
      <div className="flex items-start gap-4">
        <span className="grid size-11 shrink-0 place-items-center rounded-full bg-brand-50 text-brand-700"><CircleCheck size={24} /></span>
        <div className="min-w-0">
          <h2 className="text-lg font-bold tracking-tight text-slate-950">Report received</h2>
          <p className="mt-1 text-sm leading-6 text-slate-600">Thank you. Your report for <strong className="font-semibold text-slate-800">{siteName ?? 'a location outside the monitored water bodies'}</strong> has been saved and is waiting for a reviewer.</p>
        </div>
      </div>
      <dl className="mt-5 grid gap-px overflow-hidden rounded-lg border border-slate-200 bg-slate-200 text-xs sm:grid-cols-3">
        <div className="bg-white px-4 py-3"><dt className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">Report ID</dt><dd className="mt-1 text-base font-bold text-slate-900">{report.id}</dd></div>
        <div className="bg-white px-4 py-3"><dt className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">Status</dt><dd className="mt-1"><Badge tone="neutral">Pending review</Badge></dd></div>
        <div className="bg-white px-4 py-3"><dt className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">Photos</dt><dd className="mt-1 text-base font-bold text-slate-900">{report.photos.length}</dd></div>
      </dl>
      <div className="mt-5 flex flex-col gap-2 sm:flex-row">
        <Button as={Link} to="/my-reports">Track this report</Button>
        <Button as={Link} to={`/explore?report=${report.id}`} variant="secondary">See it on the map</Button>
        <Button type="button" variant="ghost" onClick={onAnother}>Report another problem</Button>
      </div>
    </section>
  )
}

/** Shown instead of the form until a User is signed in. */
function ReportGate({ role, returnTo }) {
  const { signOut } = useApp()
  const navigate = useNavigate()
  const next = encodeURIComponent(returnTo)

  if (!role) {
    return (
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-card">
        <span className="grid size-11 place-items-center rounded-full bg-brand-50 text-brand-700"><LogIn size={22} /></span>
        <h2 className="mt-4 text-lg font-bold tracking-tight text-slate-950">Sign in as a user to report</h2>
        <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600">Reports are tied to a user account so a reviewer knows who to ask for more detail, and so you can follow your report to a decision. You can still explore the map without signing in.</p>
        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
          <Button as={Link} to={`/login?role=user&next=${next}`}>Log in as a user</Button>
          <Button as={Link} to={`/register?role=user&next=${next}`} variant="secondary">Create a user account</Button>
        </div>
      </section>
    )
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-card">
      <span className="grid size-11 place-items-center rounded-full bg-slate-100 text-slate-600"><ShieldAlert size={22} /></span>
      <h2 className="mt-4 text-lg font-bold tracking-tight text-slate-950">Reports come from users</h2>
      <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600">You are signed in as <strong className="font-semibold text-slate-800">{role.label}</strong>. Staff review reports and do not submit them. To send a report, sign out and sign in with the User role.</p>
      <div className="mt-5 flex flex-col gap-2 sm:flex-row">
        <Button as={Link} to="/community">Open community reports</Button>
        <Button type="button" variant="secondary" onClick={() => { signOut(); navigate(`/login?role=user&next=${next}`) }}>Sign out and sign in as a user</Button>
      </div>
    </section>
  )
}

export function ReportIssuePage() {
  const { role, sites, communityReports } = useApp()
  const [searchParams] = useSearchParams()
  const [submitted, setSubmitted] = useState(null)
  const [formKey, setFormKey] = useState(0)
  const returnTo = searchParams.get('site') ? `/report?site=${searchParams.get('site')}` : '/report'
  const isUser = role?.id === 'user'
  const mine = isUser ? communityReports.filter((report) => report.reporter.email === role.user.email).sort((a, b) => b.createdAt.localeCompare(a.createdAt)) : null

  return (
    <div className="animate-fade-in space-y-3">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-brand-700">Community reporting</p>
          <h1 className="mt-0.5 text-xl font-bold tracking-tight text-slate-950">Report a problem at a water body</h1>
          <p className="mt-1 text-xs leading-5 text-slate-500">Waste dumping, pollution, filling or a shrinking shoreline. Add a photo, mark the spot, describe what you saw.</p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-600 shadow-card"><Clock3 size={13} />About a minute</span>
      </header>

      <div className="grid grid-cols-1 items-start gap-3 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0">
          {!isUser ? (
            <ReportGate role={role} returnTo={returnTo} />
          ) : submitted ? (
            <Confirmation report={submitted} siteName={sites.find((site) => site.id === submitted.siteId)?.name} onAnother={() => { setSubmitted(null); setFormKey((key) => key + 1) }} />
          ) : (
            <ReportForm key={formKey} initialSiteId={searchParams.get('site') ?? ''} onSubmitted={setSubmitted} />
          )}
        </div>
        <Aside mine={mine} />
      </div>
    </div>
  )
}

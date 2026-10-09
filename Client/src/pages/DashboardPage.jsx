import { ArrowRight, CalendarClock, CircleAlert, Droplets, ListChecks, WalletCards } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { useApp } from '../hooks/useApp'

const metrics = [
  { label: 'Monitored sites', value: '5', helper: 'Dhaka–Gazipur area', icon: Droplets },
  { label: 'Needs review', value: '2', helper: '1 newly flagged', icon: CircleAlert },
  { label: 'Open tasks', value: '4', helper: '1 due this week', icon: ListChecks },
  { label: 'Planned budget', value: '৳45,000', helper: '৳18,200 recorded', icon: WalletCards },
]

export function DashboardPage() {
  const { role } = useApp()

  return (
    <div className="animate-fade-in space-y-7">
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card">
        <div className="flex flex-col justify-between gap-6 px-5 py-6 sm:px-7 lg:flex-row lg:items-center">
          <div>
            <p className="text-sm font-medium text-brand-700">Friday, 09 October</p>
            <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-950">Good morning, {role.user.name.split(' ')[0]}.</h2>
            <p className="mt-2 text-sm text-slate-500">Here is the current picture across your wetland programme.</p>
          </div>
          <Button as={Link} to="/map">Open wetland map <ArrowRight size={17} /></Button>
        </div>

        <div className="grid border-t border-slate-100 sm:grid-cols-2 xl:grid-cols-4">
          {metrics.map(({ label, value, helper, icon: Icon }, index) => (
            <div key={label} className={`flex items-start gap-3 px-5 py-5 sm:px-7 ${index > 0 ? 'sm:border-l sm:border-slate-100' : ''} ${index > 1 ? 'sm:border-t xl:border-t-0' : ''}`}>
              <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-500"><Icon size={18} /></span>
              <div><p className="text-xs font-medium text-slate-500">{label}</p><p className="mt-0.5 text-xl font-bold tracking-tight text-slate-900">{value}</p><p className="mt-1 text-[11px] text-slate-400">{helper}</p></div>
            </div>
          ))}
        </div>
      </section>

      <div className="grid gap-7 xl:grid-cols-[minmax(0,1.5fr)_minmax(320px,0.7fr)]">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card sm:p-7">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div><div className="flex items-center gap-2"><h3 className="font-semibold text-slate-900">Priority observation</h3><Badge tone="amber">Needs review</Badge></div><p className="mt-1 text-xs text-slate-400">Illustrative prototype record</p></div>
            <span className="text-xs font-medium text-slate-400">OBS-001</span>
          </div>

          <div className="mt-6 grid gap-5 md:grid-cols-[150px_1fr]">
            <div className="relative h-36 overflow-hidden rounded-xl bg-gradient-to-br from-emerald-100 via-brand-100 to-sky-200">
              <div className="absolute -left-7 top-7 h-20 w-40 -rotate-12 rounded-[50%] bg-brand-600/80" />
              <div className="absolute bottom-2 right-2 rounded bg-white/90 px-2 py-1 text-[10px] font-semibold text-slate-600">Sample visual</div>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-brand-700">Pond A · Gazipur</p>
              <h4 className="mt-2 text-xl font-semibold tracking-tight text-slate-900">Visible water area may have decreased</h4>
              <p className="mt-2 text-sm leading-6 text-slate-500">A same-season comparison indicates a possible change from 12.0 ha to 9.5 ha. Review image quality before deciding on follow-up.</p>
              <div className="mt-5 flex flex-wrap gap-3"><Button as={Link} to="/sites/pond-a">Inspect observation <ArrowRight size={16} /></Button><Button as={Link} to="/tasks" variant="secondary">Open review queue</Button></div>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card sm:p-7">
          <div className="flex items-center justify-between"><h3 className="font-semibold text-slate-900">Upcoming work</h3><Link to="/tasks" className="text-xs font-semibold text-brand-700 hover:text-brand-800">View all</Link></div>
          <div className="mt-5 divide-y divide-slate-100">
            {[['Verify Pond A observation', 'Due 15 Oct', 'Review'], ['Collect inspection notes', 'Due 18 Oct', 'Field'], ['Prepare monthly summary', 'Due 22 Oct', 'Report']].map(([title, date, type]) => (
              <div key={title} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"><span className="grid size-9 place-items-center rounded-lg bg-slate-50 text-slate-400"><CalendarClock size={17} /></span><span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium text-slate-800">{title}</span><span className="text-xs text-slate-400">{date}</span></span><span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{type}</span></div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}

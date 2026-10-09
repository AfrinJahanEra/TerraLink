import {
  ArrowRight,
  CalendarRange,
  CircleAlert,
  ClipboardCheck,
  Droplets,
  RefreshCw,
  WalletCards,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ActivityTimeline } from '../components/dashboard/ActivityTimeline'
import { AssistantPrompt } from '../components/dashboard/AssistantPrompt'
import { BudgetCard, MonitoringTrend } from '../components/dashboard/InsightsPanel'
import { IntegrationStrip } from '../components/dashboard/IntegrationStrip'
import { KpiCard } from '../components/dashboard/KpiCard'
import { MapPreview } from '../components/dashboard/MapPreview'
import { SiteSnapshot } from '../components/dashboard/SiteSnapshot'
import { TaskList } from '../components/dashboard/TaskList'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import {
  budgetSummary,
  dashboardActivities,
  dashboardSites,
  dashboardTasks,
  integrationStatus,
  trendData,
} from '../data/dashboard'
import { useApp } from '../hooks/useApp'
import { useLocalStorage } from '../hooks/useLocalStorage'

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

function formatToday() {
  return new Intl.DateTimeFormat('en-GB', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date())
}

function PriorityObservation({ site }) {
  return (
    <section className="overflow-hidden rounded-xl border border-amber-200 bg-white shadow-card">
      <div className="flex flex-col gap-4 border-b border-amber-100 bg-amber-50/60 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-amber-100 text-amber-700"><CircleAlert size={18} /></span>
          <div><div className="flex flex-wrap items-center gap-2"><h2 className="text-sm font-semibold text-slate-900">Priority review</h2><Badge tone="amber">Needs review</Badge></div><p className="mt-0.5 text-xs text-slate-500">A possible water-area change needs human verification.</p></div>
        </div>
        <Button as={Link} to={`/sites/${site.id}`} className="min-h-9 self-start px-3 text-xs sm:self-auto">Review finding <ArrowRight size={14} /></Button>
      </div>

      <div className="grid gap-6 p-5 lg:grid-cols-[minmax(280px,0.9fr)_minmax(0,1.1fr)]">
        <div className="grid grid-cols-2 gap-2">
          {[['March 2022', dashboardSites[1].image], ['March 2024', site.image]].map(([label, image]) => (
            <figure key={label} className="relative overflow-hidden rounded-lg bg-slate-100">
              <img src={image} alt={`Illustrative overhead wetland view for ${label}`} className="h-36 w-full object-cover sm:h-44" />
              <figcaption className="absolute inset-x-2 bottom-2 flex items-center justify-between rounded-md bg-slate-950/70 px-2 py-1 text-[9px] text-white backdrop-blur-sm"><span>{label}</span><span>Sample</span></figcaption>
            </figure>
          ))}
        </div>
        <div className="flex flex-col justify-center">
          <p className="text-xs font-semibold uppercase tracking-[0.13em] text-brand-700">{site.name} · {site.location}</p>
          <h3 className="mt-2 text-xl font-semibold tracking-tight text-slate-950">Visible water area may have decreased</h3>
          <div className="mt-5 grid grid-cols-3 divide-x divide-slate-100 rounded-lg border border-slate-100 bg-slate-50/60 py-3">
            <div className="px-3"><p className="text-[10px] text-slate-400">Earlier</p><p className="mt-1 text-base font-bold text-slate-800">12.0 ha</p></div>
            <div className="px-3"><p className="text-[10px] text-slate-400">Later</p><p className="mt-1 text-base font-bold text-slate-800">9.5 ha</p></div>
            <div className="px-3"><p className="text-[10px] text-slate-400">Change</p><p className="mt-1 text-base font-bold text-rose-600">−20.8%</p></div>
          </div>
          <p className="mt-4 text-xs leading-5 text-slate-500"><strong className="font-semibold text-slate-700">Review context:</strong> 86% clear-pixel coverage. This is a reason to investigate—not proof of encroachment or permanent wetland loss.</p>
        </div>
      </div>
    </section>
  )
}

export function DashboardPage() {
  const { role } = useApp()
  const [chartRange, setChartRange] = useState('7 days')
  const [overviewRange, setOverviewRange] = useState('Last 30 days')
  const [activities, setActivities] = useLocalStorage('terralink.dashboard.activities', dashboardActivities)
  const [showAllActivity, setShowAllActivity] = useState(false)
  const [lastUpdated, setLastUpdated] = useState('Just now')

  const prioritySite = dashboardSites.find((site) => site.id === 'pond-a')
  const needsReview = dashboardSites.filter((site) => site.status === 'needs_review').length
  const kpis = useMemo(() => [
    { label: 'Monitored sites', value: dashboardSites.length, trend: 25, trendLabel: 'this quarter', tone: 'blue', icon: Droplets, to: '/map' },
    { label: 'Needs review', value: needsReview, trend: -33, trendLabel: 'vs. last week', tone: 'amber', icon: CircleAlert, to: '/tasks' },
    { label: 'Open tasks', value: dashboardTasks.length, trend: 14, trendLabel: 'this week', tone: 'purple', icon: ClipboardCheck, to: '/tasks' },
    { label: 'Budget spent', value: '৳18.2k', trend: 7.8, trendLabel: 'this month', tone: 'emerald', icon: WalletCards, to: '/budget' },
  ], [needsReview])

  function refreshDashboard() {
    setLastUpdated('Updated now')
    window.setTimeout(() => setLastUpdated('Just now'), 1800)
  }

  return (
    <div className="animate-fade-in space-y-6 pb-8">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-semibold text-brand-700">{formatToday()}</p>
          <h2 className="mt-1 text-2xl font-bold tracking-[-0.035em] text-slate-950 sm:text-[28px]">{getGreeting()}, {role.user.name.split(' ')[0]}.</h2>
          <p className="mt-1.5 text-sm text-slate-500">Here’s what needs attention across your wetland programme.</p>
        </div>
        <div className="flex items-center gap-2">
          <label className="relative flex items-center">
            <CalendarRange size={15} className="pointer-events-none absolute left-3 text-slate-400" />
            <select value={overviewRange} onChange={(event) => setOverviewRange(event.target.value)} aria-label="Dashboard time period" className="h-10 rounded-lg border border-slate-200 bg-white pl-9 pr-8 text-xs font-medium text-slate-600 outline-none hover:border-slate-300 focus:border-brand-400">
              <option>Last 7 days</option><option>Last 30 days</option><option>Last 90 days</option>
            </select>
          </label>
          <button type="button" onClick={refreshDashboard} title="Refresh dashboard" aria-label="Refresh dashboard" className="grid size-10 place-items-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:border-slate-300 hover:text-brand-700"><RefreshCw size={16} /></button>
        </div>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((metric) => <KpiCard key={metric.label} {...metric} />)}
      </div>

      <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-[11px] text-slate-500 shadow-card"><span>Showing {overviewRange.toLowerCase()} · All sample sites</span><span className="font-medium text-emerald-700">● {lastUpdated}</span></div>

      <IntegrationStrip integrations={integrationStatus} />

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.75fr)_minmax(300px,0.75fr)]">
        <div className="space-y-6">
          <PriorityObservation site={prioritySite} />
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(330px,0.85fr)]">
            <MapPreview sites={dashboardSites} />
            <SiteSnapshot sites={dashboardSites} />
          </div>
          <TaskList tasks={dashboardTasks} />
          <MonitoringTrend data={trendData[chartRange]} range={chartRange} onRangeChange={setChartRange} />
        </div>

        <aside className="space-y-6">
          <ActivityTimeline
            activities={activities}
            expanded={showAllActivity}
            onToggle={() => setShowAllActivity((value) => !value)}
            onMarkAll={() => setActivities((items) => items.map((item) => ({ ...item, unread: false })))}
          />
          <BudgetCard budget={budgetSummary} />
          <AssistantPrompt />
        </aside>
      </div>
    </div>
  )
}

import {
  ArrowRight,
  Camera,
  CircleAlert,
  ClipboardCheck,
  Droplets,
  FileClock,
  OctagonAlert,
  ReceiptText,
  RotateCcw,
  ShieldCheck,
  TriangleAlert,
  WalletCards,
} from 'lucide-react'
import { useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { KpiCard } from '../components/dashboard/KpiCard'
import { SiteOverview } from '../components/dashboard/SiteOverview'
import { UpcomingSchedule } from '../components/dashboard/UpcomingSchedule'
import { WetlandMap } from '../components/map/WetlandMap'
import { OPEN_REPORT_STATUSES, REPORT_CATEGORIES } from '../constants/reports'
import { useApp } from '../hooks/useApp'
import { buildSiteBudgetRows } from '../utils/budget'
import { formatBdt } from '../utils/currency'
import { isTaskOverdue } from '../utils/tasks'

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

function formatToday() {
  return new Intl.DateTimeFormat('en-GB', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' }).format(new Date())
}

/** Copy for each role's dashboard. */
const VIEWS = {
  manager: {
    mapTitle: 'Wetland monitoring map',
    mapHint: 'Select an outline for its record or a diamond for a community report',
    priorityTitle: 'Needs your decision',
    priorityLink: '/reviews',
    priorityLinkLabel: 'Review queue',
  },
  coordinator: {
    mapTitle: 'Map of my sites',
    mapHint: 'The water bodies you have tasks at',
    priorityTitle: 'Do next',
    priorityLink: '/tasks',
    priorityLinkLabel: 'My tasks',
  },
}

const sumAmount = (list) => list.reduce((total, expense) => total + Number(expense.amount || 0), 0)

function buildKpis(roleId, { scope, budgetSummary }) {
  const open = scope.tasks.filter((task) => task.status !== 'completed' && task.status !== 'cancelled')
  const pendingExpenses = scope.expenses.filter((expense) => expense.approvalStatus === 'pending')
  const awaitingReports = scope.communityReports.filter((report) => report.status === 'pending' || report.status === 'under_review').length

  if (roleId === 'coordinator') {
    return [
      { label: 'My open tasks', value: open.length, detail: 'Not yet completed', icon: ClipboardCheck, to: '/tasks' },
      { label: 'Due today or overdue', value: open.filter((task) => task.due === 'Today' || isTaskOverdue(task)).length, detail: 'Do these first', icon: FileClock, to: '/tasks' },
      { label: 'Awaiting verification', value: scope.tasks.filter((task) => task.status === 'awaiting_verification').length, detail: 'Waiting for the manager', icon: ShieldCheck, to: '/tasks' },
      { label: 'Expenses pending', value: formatBdt(sumAmount(pendingExpenses)), detail: `${pendingExpenses.length} awaiting approval`, icon: ReceiptText, to: '/expenses' },
    ]
  }
  return [
    { label: 'Water bodies monitored', value: scope.sites.length, detail: 'Dhaka pilot sites', icon: Droplets, to: '/sites' },
    { label: 'Reports awaiting review', value: awaitingReports, detail: 'Pending or under review', icon: Camera, to: '/community' },
    { label: 'Awaiting your verification', value: scope.tasks.filter((task) => task.status === 'awaiting_verification').length, detail: 'Completion evidence to check', icon: ShieldCheck, to: '/tasks' },
    { label: 'Budget spent', value: formatBdt(budgetSummary.spent), detail: 'Approved costs only', icon: WalletCards, to: '/budget' },
  ]
}

/** The short list of things each role should open next. */
function buildPriorities(roleId, { scope, siteName }) {
  const taskItem = (task, title, icon) => ({ id: `${task.id}-${title}`, title, detail: `${task.site} · ${task.assignee}`, to: `/tasks?task=${task.id}`, icon })

  if (roleId === 'coordinator') {
    const mine = scope.tasks
    return [
      ...mine.filter((task) => task.status === 'in_progress' && task.lastReturn).map((task) => taskItem(task, `${task.title}: returned for more work`, RotateCcw)),
      ...mine.filter((task) => task.status === 'blocked').map((task) => taskItem(task, `${task.title} is blocked`, OctagonAlert)),
      ...mine.filter(isTaskOverdue).map((task) => taskItem(task, `${task.title} is overdue`, TriangleAlert)),
      ...mine.filter((task) => task.due === 'Today' && !isTaskOverdue(task) && task.status !== 'awaiting_verification' && task.status !== 'completed').map((task) => taskItem(task, `${task.title} is due today`, FileClock)),
      ...mine.filter((task) => task.status === 'open' && !isTaskOverdue(task) && task.due !== 'Today').map((task) => taskItem(task, `Start: ${task.title}`, ClipboardCheck)),
    ].filter((item, index, list) => list.findIndex((other) => other.to === item.to) === index).slice(0, 5)
  }

  return [
    ...scope.communityReports.filter((report) => report.status === 'pending').slice(0, 3).map((report) => ({ id: report.id, title: `${REPORT_CATEGORIES[report.category].label} reported`, detail: `${siteName(report.siteId) ?? 'Other location'} · waiting for verification`, to: `/community?report=${report.id}`, icon: Camera })),
    ...scope.tasks.filter((task) => task.status === 'awaiting_verification').slice(0, 2).map((task) => taskItem(task, `${task.title} is awaiting verification`, ShieldCheck)),
    ...scope.tasks.filter(isTaskOverdue).slice(0, 2).map((task) => taskItem(task, `${task.title} is overdue`, TriangleAlert)),
    ...scope.sites.filter((site) => site.status === 'needs_review').slice(0, 2).map((site) => ({ id: site.id, title: `${site.name} needs a review decision`, detail: 'Compare satellite imagery and record a decision', to: `/sites/${site.id}`, icon: CircleAlert })),
  ].slice(0, 5)
}

function PriorityList({ view, items }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white shadow-card">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
        <h2 className="text-sm font-semibold text-slate-900">{view.priorityTitle}</h2>
        <Link to={view.priorityLink} className="flex items-center gap-1 text-xs font-semibold text-brand-700 hover:text-brand-900">{view.priorityLinkLabel} <ArrowRight size={14} className="text-slate-500" /></Link>
      </div>
      {items.length ? (
        <ul className="divide-y divide-slate-100">
          {items.map((item) => {
            const Icon = item.icon
            return (
              <li key={item.id}>
                <Link to={item.to} className="flex items-start gap-3 px-5 py-3.5 transition hover:bg-slate-50">
                  <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-600"><Icon size={15} /></span>
                  <span className="min-w-0"><span className="block text-xs font-semibold text-slate-800">{item.title}</span><span className="mt-0.5 block text-[11px] text-slate-400">{item.detail}</span></span>
                </Link>
              </li>
            )
          })}
        </ul>
      ) : (
        <p className="px-5 py-10 text-center text-xs text-slate-500">Nothing needs attention right now.</p>
      )}
    </section>
  )
}

export function DashboardPage() {
  const { role, can, scope, budgetSummary, siteBudgets } = useApp()
  const navigate = useNavigate()
  const view = VIEWS[role.id]

  const mapReports = useMemo(() => scope.communityReports.filter((report) => OPEN_REPORT_STATUSES.includes(report.status) && !report.resolved), [scope.communityReports])
  const kpis = useMemo(() => buildKpis(role.id, { scope, budgetSummary }), [budgetSummary, role.id, scope])
  // Budget figures only for roles that may see the budget.
  const budgetRows = useMemo(
    () => can('budget.view') ? buildSiteBudgetRows(scope.sites, scope.tasks, siteBudgets, scope.expenses) : null,
    [can, scope, siteBudgets],
  )
  const priorities = useMemo(
    () => buildPriorities(role.id, { scope, siteName: (id) => scope.sites.find((site) => site.id === id)?.name }),
    [role.id, scope],
  )

  return (
    <div className="animate-fade-in space-y-5 pb-8">
      <header>
        <p className="text-xs font-semibold text-brand-700">{formatToday()}</p>
        <h2 className="mt-1 text-2xl font-bold tracking-[-0.035em] text-slate-950">{getGreeting()}, {role.user.name.split(' ')[0]}.</h2>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((metric) => <KpiCard key={metric.label} {...metric} />)}
      </div>

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.9fr)_minmax(320px,0.9fr)]">
        <div className="space-y-5">
        {can('map.view') && <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-card">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <div><h2 className="text-sm font-semibold text-slate-900">{view.mapTitle}</h2><p className="mt-0.5 text-xs text-slate-400">{view.mapHint}</p></div>
            <Link to="/map" className="flex items-center gap-1 text-xs font-semibold text-brand-700 hover:text-brand-900">Open full map <ArrowRight size={14} className="text-slate-500" /></Link>
          </div>
          <WetlandMap
            sites={scope.sites}
            reports={mapReports}
            selectedSite={null}
            onSelectSite={(id) => navigate(`/sites/${id}`)}
            onSelectReport={can('community.view') ? (id) => navigate(`/community?report=${id}`) : undefined}
            className="h-[400px]"
          />
        </section>}
        <SiteOverview sites={scope.sites} tasks={scope.tasks} budgetRows={budgetRows} title={role.id === 'coordinator' ? 'My water bodies' : undefined} showRegister={can('sites.register')} limit={2} />
        </div>

        <aside className="space-y-5">
          <PriorityList view={view} items={priorities} />
          <UpcomingSchedule meetings={scope.meetings} maxItems={3} subtitle="Your next meetings and field visits" canSchedule={can('schedule.manage')} />
        </aside>
      </div>
    </div>
  )
}

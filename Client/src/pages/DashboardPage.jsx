import {
  ArrowRight,
  Camera,
  CircleAlert,
  ClipboardCheck,
  Droplets,
  FileClock,
  Files,
  OctagonAlert,
  ReceiptText,
  RotateCcw,
  ShieldCheck,
  TriangleAlert,
  WalletCards,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { BudgetCard } from '../components/dashboard/InsightsPanel'
import { KpiCard } from '../components/dashboard/KpiCard'
import { SiteSnapshot } from '../components/dashboard/SiteSnapshot'
import { TaskList } from '../components/dashboard/TaskList'
import { UpcomingSchedule } from '../components/dashboard/UpcomingSchedule'
import { AccessPanel } from '../components/layout/AccessPanel'
import { WetlandMap } from '../components/map/WetlandMap'
import { ROLE_ACCESS } from '../constants/access'
import { OPEN_REPORT_STATUSES, REPORT_CATEGORIES } from '../constants/reports'
import { useApp } from '../hooks/useApp'
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

/** What each role's dashboard is for. The copy matches the access table. */
const VIEWS = {
  manager: {
    guidance: 'Verify reports, review sites, assign work, approve what is finished, and watch the budget.',
    mapTitle: 'Wetland monitoring map',
    mapHint: 'Select an outline for its record or a diamond for a community report',
    taskTitle: 'Programme tasks',
    taskSubtitle: 'Work across every site',
    priorityTitle: 'Needs your decision',
    priorityLink: '/reviews',
    priorityLinkLabel: 'Review queue',
  },
  coordinator: {
    guidance: 'Your assigned tasks, the sites they are at, your schedule, and your expenses.',
    mapTitle: 'Map of my sites',
    mapHint: 'The water bodies you have tasks at',
    taskTitle: 'My assigned tasks',
    taskSubtitle: 'Only work assigned to you',
    priorityTitle: 'Needs your attention',
    priorityLink: '/tasks',
    priorityLinkLabel: 'My tasks',
  },
  operator: {
    guidance: 'Keep records complete: receipts, reports, schedules and team details. Read-only on decisions.',
    mapTitle: 'Wetland monitoring map',
    mapHint: 'Read-only overview of every water body',
    taskTitle: 'Tasks across the programme',
    taskSubtitle: 'Read-only; the manager assigns and closes them',
    priorityTitle: 'Records to follow up',
    priorityLink: '/expenses',
    priorityLinkLabel: 'Expenses',
  },
}

const hasReceipt = (expense) => Boolean(expense.receiptNote?.trim()) || Boolean(expense.receiptPhotos?.length)
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
  if (roleId === 'operator') {
    return [
      { label: 'Site records', value: scope.sites.length, detail: 'In the register', icon: Files, to: '/sites' },
      { label: 'Reports with the manager', value: awaitingReports, detail: 'Pending or under review', icon: Camera, to: '/community' },
      { label: 'Expenses pending', value: pendingExpenses.length, detail: 'Awaiting manager approval', icon: ReceiptText, to: '/expenses' },
      { label: 'Without a receipt', value: scope.expenses.filter((expense) => !hasReceipt(expense)).length, detail: 'Records to complete', icon: CircleAlert, to: '/expenses' },
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
    ].slice(0, 6)
  }

  if (roleId === 'operator') {
    return [
      ...scope.expenses.filter((expense) => expense.approvalStatus === 'pending').slice(0, 3).map((expense) => ({ id: expense.id, title: `${expense.id} is waiting for approval`, detail: `${formatBdt(expense.amount)} · ${expense.description}`, to: '/expenses', icon: ReceiptText })),
      ...scope.expenses.filter((expense) => !hasReceipt(expense)).slice(0, 3).map((expense) => ({ id: `${expense.id}-receipt`, title: `${expense.id} has no receipt`, detail: `${formatBdt(expense.amount)} · ${expense.description}`, to: '/expenses', icon: CircleAlert })),
      ...scope.tasks.filter(isTaskOverdue).slice(0, 2).map((task) => taskItem(task, `${task.title} is overdue`, TriangleAlert)),
    ].slice(0, 6)
  }

  return [
    ...scope.communityReports.filter((report) => report.status === 'pending').slice(0, 3).map((report) => ({ id: report.id, title: `${REPORT_CATEGORIES[report.category].label} reported`, detail: `${siteName(report.siteId) ?? 'Other location'} · waiting for verification`, to: `/community?report=${report.id}`, icon: Camera })),
    ...scope.tasks.filter((task) => task.status === 'awaiting_verification').slice(0, 2).map((task) => taskItem(task, `${task.title} is awaiting verification`, ShieldCheck)),
    ...scope.tasks.filter(isTaskOverdue).slice(0, 2).map((task) => taskItem(task, `${task.title} is overdue`, TriangleAlert)),
    ...scope.sites.filter((site) => site.status === 'needs_review').slice(0, 2).map((site) => ({ id: site.id, title: `${site.name} needs a review decision`, detail: 'Compare satellite imagery and record a decision', to: `/sites/${site.id}`, icon: CircleAlert })),
  ].slice(0, 6)
}

function PriorityList({ view, items }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white shadow-card">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
        <div><h2 className="text-sm font-semibold text-slate-900">{view.priorityTitle}</h2><p className="mt-0.5 text-xs text-slate-400">Open these first</p></div>
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

/** A coordinator's own money picture: what is approved, what is waiting, and what was rejected. */
function MyExpenses({ expenses }) {
  const by = (status) => expenses.filter((expense) => expense.approvalStatus === status)
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-card">
      <div className="flex items-center justify-between"><div><h2 className="text-sm font-semibold text-slate-900">My expenses</h2><p className="mt-0.5 text-xs text-slate-400">On your tasks only</p></div><Link to="/expenses" aria-label="Open expenses" className="grid size-8 place-items-center rounded-lg text-slate-500 hover:bg-slate-100"><ArrowRight size={16} /></Link></div>
      <dl className="mt-4 divide-y divide-slate-100 text-xs">
        <div className="flex justify-between gap-3 py-2.5"><dt className="text-slate-500">Approved</dt><dd className="font-semibold text-slate-900">{formatBdt(sumAmount(by('approved')))}</dd></div>
        <div className="flex justify-between gap-3 py-2.5"><dt className="text-slate-500">Waiting for approval</dt><dd className="font-semibold text-slate-900">{formatBdt(sumAmount(by('pending')))}</dd></div>
        <div className="flex justify-between gap-3 py-2.5"><dt className="text-slate-500">Rejected</dt><dd className="font-semibold text-slate-900">{by('rejected').length}</dd></div>
      </dl>
    </section>
  )
}

export function DashboardPage() {
  const { role, can, scope, budgetSummary } = useApp()
  const navigate = useNavigate()
  const [accessOpen, setAccessOpen] = useState(false)
  const view = VIEWS[role.id]
  const access = ROLE_ACCESS[role.id]

  const mapReports = useMemo(() => scope.communityReports.filter((report) => OPEN_REPORT_STATUSES.includes(report.status) && !report.resolved), [scope.communityReports])
  const kpis = useMemo(() => buildKpis(role.id, { scope, budgetSummary }), [budgetSummary, role.id, scope])
  const priorities = useMemo(
    () => buildPriorities(role.id, { scope, siteName: (id) => scope.sites.find((site) => site.id === id)?.name }),
    [role.id, scope],
  )

  return (
    <div className="animate-fade-in space-y-6 pb-8">
      <header className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <p className="text-xs font-semibold text-brand-700">{formatToday()}</p>
          <h2 className="mt-1 text-2xl font-bold tracking-[-0.035em] text-slate-950 sm:text-[28px]">{getGreeting()}, {role.user.name.split(' ')[0]}.</h2>
          <p className="mt-1.5 text-sm text-slate-500">{role.label} workspace. {view.guidance}</p>
        </div>
        <button type="button" onClick={() => setAccessOpen(true)} className="inline-flex items-center gap-2 self-start rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-card transition hover:bg-slate-50 lg:self-auto">
          <ShieldCheck size={15} className="text-brand-700" />
          <span className="text-left leading-4"><span className="block">My role and access</span><span className="block text-[10px] font-normal text-slate-400">{access.headline}</span></span>
        </button>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((metric) => <KpiCard key={metric.label} {...metric} />)}
      </div>

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.9fr)_minmax(320px,0.9fr)]">
        <div className="space-y-6">
          <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-card">
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
          </section>
          {role.id === 'coordinator' && <SiteSnapshot sites={scope.sites} title="My sites" registerLink={null} />}
          <TaskList tasks={scope.tasks} title={view.taskTitle} subtitle={view.taskSubtitle} />
        </div>

        <aside className="space-y-6">
          <PriorityList view={view} items={priorities} />
          <UpcomingSchedule meetings={scope.meetings} tasks={scope.tasks} canSchedule={can('schedule.manage')} />
          {role.id === 'coordinator' && <MyExpenses expenses={scope.expenses} />}
          {can('budget.view') && <BudgetCard budget={budgetSummary} title={role.id === 'operator' ? 'Budget position' : 'Budget overview'} subtitle={role.id === 'operator' ? 'Read-only, approved costs' : 'Current programme budget'} />}
        </aside>
      </div>
      <AccessPanel open={accessOpen} role={role} onClose={() => setAccessOpen(false)} />
    </div>
  )
}

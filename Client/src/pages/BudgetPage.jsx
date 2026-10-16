import { AlertTriangle, ArrowRight, CalendarPlus, Landmark, Pencil, Plus, ReceiptText } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { BudgetAllocationModal } from '../components/budget/BudgetAllocationModal'
import { PlannedActualChart } from '../components/budget/PlannedActualChart'
import { Button } from '../components/ui/Button'
import { PageHeader } from '../components/ui/PageHeader'
import { Toast } from '../components/ui/Toast'
import { useApp } from '../hooks/useApp'
import { useNotice } from '../hooks/useNotice'
import { buildSiteBudgetRows, buildTaskBudgetRows, calculateBudgetSummary } from '../utils/budget'
import { cn } from '../utils/cn'
import { formatBdt } from '../utils/currency'
import { buildScheduleLink } from '../utils/schedule'

function BudgetRows({ rows, groupBy, canPlan, onEdit }) {
  return (
    <section className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-card">
      <div className="grid min-w-[480px] grid-cols-[minmax(0,1fr)_84px_84px_84px_32px] gap-3 border-b border-slate-100 bg-slate-50/70 px-5 py-3 text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400"><span>{groupBy === 'site' ? 'Site' : 'Task'}</span><span className="text-right">Planned</span><span className="text-right">Actual</span><span className="text-right">Remaining</span><span /></div>
      <div className="divide-y divide-slate-100">
        {rows.map((row) => (
          <div key={row.id} className={cn('grid min-w-[620px] grid-cols-[minmax(0,1fr)_110px_110px_110px_36px] items-center gap-3 px-5 py-3.5 text-xs', row.overBudget && 'bg-slate-50')}>
            <div className="min-w-0"><p className="truncate font-semibold text-slate-800">{row.name}</p><p className="mt-0.5 truncate text-[10px] text-slate-400">{row.location}{groupBy === 'site' ? ` · ${row.taskCount} linked tasks` : ''}</p></div>
            <span className="text-right text-slate-600">{formatBdt(row.planned)}</span>
            <span className={cn('text-right font-semibold', row.overBudget ? 'text-amber-700' : 'text-slate-700')}>{formatBdt(row.actual)}</span>
            <span className={cn('text-right font-semibold', row.remaining < 0 ? 'text-amber-700' : 'text-slate-700')}>{formatBdt(row.remaining)}</span>
            <span>{canPlan && groupBy === 'site' && <button type="button" onClick={() => onEdit(row)} aria-label={`Edit ${row.name} budget`} className="grid size-8 place-items-center rounded-lg text-slate-500 hover:bg-slate-100"><Pencil size={14} /></button>}</span>
          </div>
        ))}
      </div>
    </section>
  )
}

export function BudgetPage() {
  const { can, sites, tasks, expenses, siteBudgets, setSiteBudget } = useApp()
  const [groupBy, setGroupBy] = useState('site')
  const [editingBudget, setEditingBudget] = useState(null)
  const [notice, showNotice] = useNotice(3000)
  const canPlan = can('budget.edit')
  const canSchedule = can('schedule.manage')

  // Only the project manager and office operator reach this page, and both see the whole programme.
  const visibleTasks = tasks
  const visibleSites = sites
  const visibleExpenses = expenses
  const siteRows = useMemo(() => buildSiteBudgetRows(visibleSites, visibleTasks, siteBudgets, visibleExpenses), [siteBudgets, visibleExpenses, visibleSites, visibleTasks])
  const taskRows = useMemo(() => buildTaskBudgetRows(visibleTasks), [visibleTasks])
  const rows = groupBy === 'site' ? siteRows : taskRows
  const summary = useMemo(() => calculateBudgetSummary(siteRows, visibleTasks), [siteRows, visibleTasks])
  const overBudgetRows = siteRows.filter((row) => row.overBudget)

  const budgetReviewLink = buildScheduleLink({
    new: 'budget_review',
    site: overBudgetRows.length === 1 ? overBudgetRows[0].id : '',
    title: overBudgetRows.length === 1 ? `${overBudgetRows[0].name} budget review` : 'Site budget variance review',
    agenda: `Review spending above plan: ${overBudgetRows.map((row) => `${row.name} (${formatBdt(Math.abs(row.remaining))} over)`).join(', ')}. Agree corrective action before approving further costs.`,
  })

  function saveAllocation(amount) {
    setSiteBudget(editingBudget.id, amount)
    setEditingBudget(null)
    showNotice(`${editingBudget.name} allocation updated to ${formatBdt(amount)}.`)
  }

  return (
    <div className="animate-fade-in space-y-5 pb-8">
      <PageHeader
        eyebrow="Finance"
        title="Budgets"
        description="Planned allocations against recorded costs by wetland site or operational task. Individual expense records are kept in the expense ledger."
        actions={(
          <>
            <Link to="/expenses" className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 shadow-card hover:bg-slate-50"><ReceiptText size={15} className="text-slate-500" />Expense ledger</Link>
            {!!visibleTasks.length && <Button as={Link} to="/expenses?new=1"><Plus size={16} />Add expense</Button>}
          </>
        )}
      />

      {overBudgetRows.length > 0 && (
        <div role="alert" className="flex flex-col gap-3 rounded-xl border border-slate-200 border-l-4 border-l-amber-500 bg-white px-4 py-3 text-xs text-slate-800 shadow-card sm:flex-row sm:items-center">
          <AlertTriangle size={17} className="shrink-0 text-slate-600" />
          <div className="min-w-0 flex-1"><p className="font-semibold">Budget attention required</p><p className="mt-1 text-slate-600">{overBudgetRows.length} {overBudgetRows.length === 1 ? 'site is' : 'sites are'} over the planned allocation: {overBudgetRows.map((row) => row.name).join(', ')}. Review the variance before approving more costs.</p></div>
          {canSchedule && <Link to={budgetReviewLink} className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-[11px] font-semibold text-slate-700 hover:bg-slate-50"><CalendarPlus size={14} className="text-slate-500" />Schedule budget review</Link>}
        </div>
      )}

      <section className="grid gap-4 rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-card sm:grid-cols-4">
        <div><p className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">Planned budget</p><p className="mt-1 text-xl font-semibold text-slate-900">{formatBdt(summary.total)}</p></div>
        <div className="border-slate-100 sm:border-l sm:pl-5"><p className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">Actual costs</p><p className="mt-1 text-xl font-semibold text-slate-900">{formatBdt(summary.spent)}</p><Link to="/expenses" className="mt-1 inline-flex items-center gap-1 text-[10px] font-semibold text-brand-700 hover:text-brand-900">{visibleExpenses.length} expense records <ArrowRight size={11} className="text-slate-500" /></Link></div>
        <div className="border-slate-100 sm:border-l sm:pl-5"><p className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">Remaining</p><p className={cn('mt-1 text-xl font-semibold', summary.remaining < 0 ? 'text-amber-700' : 'text-slate-900')}>{formatBdt(summary.remaining)}</p></div>
        <div className="border-slate-100 sm:border-l sm:pl-5"><p className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">Committed</p><p className="mt-1 text-xl font-semibold text-slate-900">{formatBdt(summary.pending)}</p></div>
      </section>

      <div className="flex items-center justify-between gap-3"><div className="inline-flex rounded-lg border border-slate-200 bg-white p-1 shadow-card"><button type="button" onClick={() => setGroupBy('site')} className={cn('h-8 rounded-md px-3 text-[11px] font-semibold', groupBy === 'site' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:bg-slate-50')}>By site</button><button type="button" onClick={() => setGroupBy('task')} className={cn('h-8 rounded-md px-3 text-[11px] font-semibold', groupBy === 'task' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:bg-slate-50')}>By task</button></div><p className="hidden items-center gap-1.5 text-[10px] text-slate-400 sm:flex"><Landmark size={13} className="text-slate-500" />Amounts shown in Bangladeshi taka</p></div>

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]"><PlannedActualChart rows={rows} /><BudgetRows rows={rows} groupBy={groupBy} canPlan={canPlan} onEdit={setEditingBudget} /></div>

      <BudgetAllocationModal key={editingBudget?.id ?? 'none'} open={Boolean(editingBudget)} site={editingBudget ? sites.find((site) => site.id === editingBudget.id) : null} planned={editingBudget?.planned} onClose={() => setEditingBudget(null)} onSave={saveAllocation} />
      <Toast message={notice} />
    </div>
  )
}

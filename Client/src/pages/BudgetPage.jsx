import { AlertTriangle, Check, Landmark, Pencil, Plus } from 'lucide-react'
import { useMemo, useState } from 'react'
import { BudgetAllocationModal } from '../components/budget/BudgetAllocationModal'
import { ExpenseFormModal } from '../components/budget/ExpenseFormModal'
import { ExpenseHistory } from '../components/budget/ExpenseHistory'
import { PlannedActualChart } from '../components/budget/PlannedActualChart'
import { Button } from '../components/ui/Button'
import { useApp } from '../hooks/useApp'
import { buildSiteBudgetRows, buildTaskBudgetRows, calculateBudgetSummary } from '../utils/budget'
import { formatBdt, formatBdtBangla } from '../utils/currency'
import { createActivity } from '../utils/tasks'
import { cn } from '../utils/cn'

function BudgetRows({ rows, groupBy, canPlan, onEdit }) {
  return (
    <section className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-card">
      <div className="grid min-w-[620px] grid-cols-[minmax(0,1fr)_110px_110px_110px_36px] gap-3 border-b border-slate-100 bg-slate-50/70 px-5 py-3 text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400"><span>{groupBy === 'site' ? 'Site' : 'Task'}</span><span className="text-right">Planned</span><span className="text-right">Actual</span><span className="text-right">Remaining</span><span /></div>
      <div className="divide-y divide-slate-100">
        {rows.map((row) => (
          <div key={row.id} className={cn('grid min-w-[620px] grid-cols-[minmax(0,1fr)_110px_110px_110px_36px] items-center gap-3 px-5 py-3.5 text-xs', row.overBudget && 'bg-rose-50/45')}>
            <div className="min-w-0"><p className="truncate font-semibold text-slate-800">{row.name}</p><p className="mt-0.5 truncate text-[10px] text-slate-400">{row.location}{groupBy === 'site' ? ` · ${row.taskCount} linked tasks` : ''}</p></div>
            <span className="text-right text-slate-600">{formatBdt(row.planned)}</span>
            <span className={cn('text-right font-semibold', row.overBudget ? 'text-rose-700' : 'text-slate-700')}>{formatBdt(row.actual)}</span>
            <span className={cn('text-right font-semibold', row.remaining < 0 ? 'text-rose-700' : 'text-emerald-700')}>{formatBdt(row.remaining)}</span>
            <span>{canPlan && groupBy === 'site' && <button type="button" onClick={() => onEdit(row)} aria-label={`Edit ${row.name} budget`} className="grid size-8 place-items-center rounded-lg text-slate-500 hover:bg-slate-100"><Pencil size={14} /></button>}</span>
          </div>
        ))}
      </div>
    </section>
  )
}

export function BudgetPage() {
  const { role, sites, tasks, expenses, siteBudgets, addExpense, setSiteBudget } = useApp()
  const [groupBy, setGroupBy] = useState('site')
  const [expenseOpen, setExpenseOpen] = useState(false)
  const [expenseVersion, setExpenseVersion] = useState(0)
  const [editingBudget, setEditingBudget] = useState(null)
  const [notice, setNotice] = useState('')
  const canPlan = role.id === 'manager'

  const visibleTasks = useMemo(() => role.id === 'coordinator' ? tasks.filter((task) => task.assignee === role.user.name) : tasks, [role, tasks])
  const visibleSiteIds = useMemo(() => role.id === 'coordinator' ? new Set(visibleTasks.map((task) => task.siteId)) : new Set(sites.map((site) => site.id)), [role.id, sites, visibleTasks])
  const visibleSites = useMemo(() => sites.filter((site) => visibleSiteIds.has(site.id)), [sites, visibleSiteIds])
  const visibleExpenses = useMemo(() => role.id === 'coordinator' ? expenses.filter((expense) => visibleTasks.some((task) => task.id === expense.taskId)) : expenses, [expenses, role.id, visibleTasks])
  const siteRows = useMemo(() => buildSiteBudgetRows(visibleSites, visibleTasks, siteBudgets, visibleExpenses), [siteBudgets, visibleExpenses, visibleSites, visibleTasks])
  const taskRows = useMemo(() => buildTaskBudgetRows(visibleTasks), [visibleTasks])
  const rows = groupBy === 'site' ? siteRows : taskRows
  const summary = useMemo(() => calculateBudgetSummary(siteRows, visibleTasks), [siteRows, visibleTasks])

  function showNotice(message) {
    setNotice(message)
    window.setTimeout(() => setNotice(''), 2800)
  }

  function openExpenseForm() {
    setExpenseVersion((value) => value + 1)
    setExpenseOpen(true)
  }

  function createExpense(expense) {
    const highestId = expenses.reduce((highest, item) => Math.max(highest, Number(item.id.replace('EXP-', '')) || 0), 0)
    const id = `EXP-${String(highestId + 1).padStart(3, '0')}`
    addExpense({ ...expense, id, createdBy: role.user.name, createdAt: new Date().toISOString() }, createActivity(`${formatBdt(expense.amount)} expense recorded`, role.user.name))
    setExpenseOpen(false)
    showNotice(`${formatBdt(expense.amount)} added to the task, site, and dashboard.`)
  }

  function saveAllocation(amount) {
    setSiteBudget(editingBudget.id, amount)
    setEditingBudget(null)
    showNotice(`${editingBudget.name} allocation updated to ${formatBdt(amount)}.`)
  }

  return (
    <div className="animate-fade-in space-y-5 pb-8">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div><p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-700">Financial control</p><h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">Budget & costs</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">Track planned allocations and verified costs by wetland site or operational task.</p></div>
        {!!visibleTasks.length && <Button type="button" onClick={openExpenseForm}><Plus size={16} />Add expense</Button>}
      </header>

      {summary.overBudgetCount > 0 && <div role="alert" className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-800"><AlertTriangle size={17} className="mt-0.5 shrink-0 text-slate-600" /><div><p className="font-semibold">Budget attention required</p><p className="mt-1 text-rose-700">{summary.overBudgetCount} {summary.overBudgetCount === 1 ? 'site is' : 'sites are'} over the planned allocation. Review the red variance before approving more costs.</p></div></div>}

      <section className="grid gap-4 rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-card sm:grid-cols-4">
        <div><p className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">Planned budget</p><p className="mt-1 text-xl font-semibold text-slate-900">{formatBdt(summary.total)}</p><p className="mt-1 text-[10px] text-slate-400">বাংলা: {formatBdtBangla(summary.total)}</p></div>
        <div className="border-slate-100 sm:border-l sm:pl-5"><p className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">Actual costs</p><p className="mt-1 text-xl font-semibold text-slate-900">{formatBdt(summary.spent)}</p></div>
        <div className="border-slate-100 sm:border-l sm:pl-5"><p className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">Remaining</p><p className={cn('mt-1 text-xl font-semibold', summary.remaining < 0 ? 'text-rose-700' : 'text-emerald-700')}>{formatBdt(summary.remaining)}</p></div>
        <div className="border-slate-100 sm:border-l sm:pl-5"><p className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">Committed</p><p className="mt-1 text-xl font-semibold text-slate-900">{formatBdt(summary.pending)}</p></div>
      </section>

      <div className="flex items-center justify-between gap-3"><div className="inline-flex rounded-lg border border-slate-200 bg-white p-1 shadow-card"><button type="button" onClick={() => setGroupBy('site')} className={cn('h-8 rounded-md px-3 text-[11px] font-semibold', groupBy === 'site' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:bg-slate-50')}>By site</button><button type="button" onClick={() => setGroupBy('task')} className={cn('h-8 rounded-md px-3 text-[11px] font-semibold', groupBy === 'task' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:bg-slate-50')}>By task</button></div><p className="hidden items-center gap-1.5 text-[10px] text-slate-400 sm:flex"><Landmark size={13} className="text-slate-500" />Amounts shown in Bangladeshi taka</p></div>

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.08fr)_minmax(420px,0.92fr)]"><PlannedActualChart rows={rows} /><BudgetRows rows={rows} groupBy={groupBy} canPlan={canPlan} onEdit={setEditingBudget} /></div>
      <ExpenseHistory expenses={visibleExpenses} tasks={tasks} sites={sites} />

      <ExpenseFormModal key={expenseVersion} open={expenseOpen} tasks={visibleTasks} onClose={() => setExpenseOpen(false)} onCreate={createExpense} />
      <BudgetAllocationModal key={editingBudget?.id ?? 'none'} open={Boolean(editingBudget)} site={editingBudget ? sites.find((site) => site.id === editingBudget.id) : null} planned={editingBudget?.planned} onClose={() => setEditingBudget(null)} onSave={saveAllocation} />
      {notice && <div role="status" className="fixed bottom-5 right-5 z-[1100] flex max-w-sm items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-3 text-xs font-semibold text-slate-700 shadow-pop"><Check size={15} className="text-slate-600" />{notice}</div>}
    </div>
  )
}

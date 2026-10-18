import { AlertTriangle, ArrowRight, BadgeCheck, CalendarPlus, Download, Landmark, Pencil, Plus, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { BudgetAllocationModal } from '../components/budget/BudgetAllocationModal'
import { ExpenseFormModal } from '../components/budget/ExpenseFormModal'
import { ExpenseHistory } from '../components/budget/ExpenseHistory'
import { PlannedActualChart } from '../components/budget/PlannedActualChart'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { PageHeader } from '../components/ui/PageHeader'
import { Toast } from '../components/ui/Toast'
import { useApp } from '../hooks/useApp'
import { useNotice } from '../hooks/useNotice'
import { EXPENSE_APPROVAL, EXPENSE_CATEGORIES } from '../constants/actions'
import { TASK_STATUS } from '../constants/status'
import { buildSiteBudgetRows, buildTaskBudgetRows, buildVerifiedWorkRows, calculateBudgetSummary, taskBudget } from '../utils/budget'
import { cn } from '../utils/cn'
import { formatBdt } from '../utils/currency'
import { formatReportDate } from '../utils/report'
import { useMeeting } from '../hooks/useMeeting'
import { csvDate, downloadCsv } from '../utils/csv'
import { todayKey } from '../utils/schedule'
import { createActivity } from '../utils/tasks'

const ledgerInput = 'h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-700 outline-none focus:border-slate-400'

/** Lakes whose work was assigned after a verified community report or a manager's site review. */
function VerifiedWork({ rows }) {
  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-card">
      <header className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-slate-100 px-5 py-3.5">
        <BadgeCheck size={16} className="text-brand-700" />
        <h2 className="text-sm font-semibold text-slate-900">Verified work by lake</h2>
        <p className="text-[11px] text-slate-500">Tasks assigned after a verified community report or a site review, and what they cost against each lake's allocation.</p>
      </header>
      {rows.length ? (
        <div className="divide-y divide-slate-100">
          {rows.map((row) => (
            <div key={row.site.id} className="px-5 py-4">
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <div><Link to={`/sites/${row.site.id}`} className="text-[13px] font-semibold text-slate-900 hover:text-brand-800">{row.site.name}</Link><span className="ml-2 text-[11px] text-slate-400">{row.site.location} · {row.jobs.length} verified {row.jobs.length === 1 ? 'job' : 'jobs'}</span></div>
                <p className="text-[11px] tabular-nums text-slate-500">Budget given <strong className="font-semibold text-slate-800">{formatBdt(row.estimated)}</strong> · Spent <strong className="font-semibold text-slate-800">{formatBdt(row.actual)}</strong>{row.pending > 0 && <> · Awaiting approval <strong className="font-semibold text-slate-800">{formatBdt(row.pending)}</strong></>} · of {formatBdt(row.planned)} allocated</p>
              </div>
              <div className="mt-2.5 overflow-x-auto">
                <table className="w-full min-w-[720px] text-left text-xs">
                  <thead className="text-[10px] uppercase tracking-wider text-slate-400"><tr><th className="py-1.5 pr-3 font-semibold">Task</th><th className="py-1.5 pr-3 font-semibold">Verified by</th><th className="py-1.5 pr-3 font-semibold">Assigned to</th><th className="py-1.5 pr-3 font-semibold">Status</th><th className="py-1.5 pr-3 text-right font-semibold">Budget</th><th className="py-1.5 text-right font-semibold">Spent</th></tr></thead>
                  <tbody className="divide-y divide-slate-100">
                    {row.jobs.map(({ task, origin }) => (
                      <tr key={task.id}>
                        <td className="py-2 pr-3"><Link to={`/tasks?task=${task.id}`} className="font-semibold text-slate-800 hover:text-brand-800">{task.id}</Link><span className="mt-0.5 block max-w-[280px] truncate text-[10.5px] text-slate-500">{task.title}</span></td>
                        <td className="py-2 pr-3 text-slate-600">{origin.label}<span className="block text-[10.5px] text-slate-400">{[origin.by, origin.at && formatReportDate(origin.at)].filter(Boolean).join(' · ')}</span></td>
                        <td className="py-2 pr-3 text-slate-600">{task.assignee}</td>
                        <td className="py-2 pr-3"><Badge tone={TASK_STATUS[task.status]?.tone}>{TASK_STATUS[task.status]?.label}</Badge></td>
                        <td className="py-2 pr-3 text-right tabular-nums text-slate-600">{formatBdt(taskBudget(task))}</td>
                        <td className="py-2 text-right font-semibold tabular-nums text-slate-700">{formatBdt(task.actualCost)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      ) : <p className="px-5 py-8 text-center text-xs text-slate-400">No work has been assigned from a verified report or site review yet.</p>}
    </section>
  )
}

function BudgetRows({ rows, groupBy, canPlan, onEdit }) {
  return (
    <section className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-card">
      <div className="grid min-w-[480px] grid-cols-[minmax(0,1fr)_84px_84px_84px_32px] gap-3 border-b border-slate-100 bg-slate-50/70 px-5 py-3 text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400"><span>{groupBy === 'site' ? 'Site' : 'Task'}</span><span className="text-right">Planned</span><span className="text-right">Actual</span><span className="text-right">Remaining</span><span /></div>
      <div className="divide-y divide-slate-100">
        {rows.map((row) => (
          <div key={row.id} className={cn('grid min-w-[620px] grid-cols-[minmax(0,1fr)_110px_110px_110px_36px] items-center gap-3 px-5 py-3.5 text-xs', row.overBudget && 'bg-slate-50')}>
            <div className="min-w-0"><p className="truncate font-semibold text-slate-800">{row.name}</p><p className="mt-0.5 truncate text-[10px] text-slate-400">{row.location}{groupBy === 'site' ? ` · ${row.taskCount} linked tasks${row.verifiedCount ? ` · ${row.verifiedCount} verified` : ''}` : ''}</p></div>
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
  const { role, can, sites, tasks, expenses, siteBudgets, communityReports, setSiteBudget, addExpense, reviewExpense } = useApp()
  const [ledgerSearch, setLedgerSearch] = useState('')
  const [ledgerStatus, setLedgerStatus] = useState('all')
  const [expenseOpen, setExpenseOpen] = useState(false)
  const [groupBy, setGroupBy] = useState('site')
  const [editingBudget, setEditingBudget] = useState(null)
  const [notice, showNotice] = useNotice(3000)
  const canPlan = can('budget.edit')
  const canSchedule = can('schedule.manage')

  // Only the project manager reaches this page, and sees the whole programme.
  const visibleTasks = tasks
  const visibleSites = sites
  const visibleExpenses = expenses
  const verifiedRows = useMemo(() => buildVerifiedWorkRows(visibleSites, visibleTasks, communityReports, siteBudgets), [communityReports, siteBudgets, visibleSites, visibleTasks])
  const siteRows = useMemo(() => buildSiteBudgetRows(visibleSites, visibleTasks, siteBudgets, visibleExpenses).map((row) => ({
    ...row,
    verifiedCount: verifiedRows.find((item) => item.site.id === row.id)?.jobs.length ?? 0,
  })), [siteBudgets, verifiedRows, visibleExpenses, visibleSites, visibleTasks])
  const taskRows = useMemo(() => buildTaskBudgetRows(visibleTasks), [visibleTasks])
  const rows = groupBy === 'site' ? siteRows : taskRows
  const summary = useMemo(() => calculateBudgetSummary(siteRows, visibleTasks), [siteRows, visibleTasks])
  const overBudgetRows = siteRows.filter((row) => row.overBudget)

  const { openMeeting } = useMeeting()
  const budgetReview = () => openMeeting({
    siteId: overBudgetRows.length === 1 ? overBudgetRows[0].id : '',
    title: overBudgetRows.length === 1 ? `${overBudgetRows[0].name} budget review` : 'Site budget variance review',
    agenda: `Review spending above plan: ${overBudgetRows.map((row) => `${row.name} (${formatBdt(Math.abs(row.remaining))} over)`).join(', ')}. Agree corrective action before approving further costs.`,
  })

  // The expense ledger: every recorded cost, newest first, with requests for extra budget to approve.
  const ledger = useMemo(() => {
    const term = ledgerSearch.trim().toLowerCase()
    return [...expenses]
      .filter((expense) => (ledgerStatus === 'all' || expense.approvalStatus === ledgerStatus)
        && (!term || `${expense.id} ${expense.description} ${expense.taskId ?? ''} ${expense.createdBy}`.toLowerCase().includes(term)))
      .sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id))
  }, [expenses, ledgerSearch, ledgerStatus])
  const waiting = expenses.filter((expense) => expense.approvalStatus === 'pending')

  function createExpense(expense) {
    const highestId = expenses.reduce((highest, item) => Math.max(highest, Number(item.id.replace('EXP-', '')) || 0), 0)
    const id = `EXP-${String(highestId + 1).padStart(3, '0')}`
    addExpense({ ...expense, id, createdBy: role.user.name, createdAt: new Date().toISOString() }, createActivity(`${formatBdt(expense.amount)} expense recorded (${EXPENSE_CATEGORIES[expense.category]})`, role.user.name))
    setExpenseOpen(false)
    showNotice(`${id} recorded: ${formatBdt(expense.amount)}.`)
  }

  function reviewLedgerExpense(expenseId, decision, note) {
    try {
      const expense = expenses.find((item) => item.id === expenseId)
      reviewExpense(expenseId, decision, note)
      showNotice(decision === 'approved' && expense?.topUp ? `${expenseId} approved and ${formatBdt(expense.topUp.amount)} added to ${expense.taskId}'s budget.` : `${expenseId} ${decision}.`)
    } catch (error) {
      showNotice(error instanceof Error ? error.message : 'The expense could not be reviewed.')
    }
  }

  function exportLedger() {
    const taskMap = new Map(tasks.map((task) => [task.id, task]))
    const siteMap = new Map(sites.map((site) => [site.id, site]))
    downloadCsv(`terralink-expenses-${todayKey()}.csv`, [
      ['Expense ID', 'Date', 'Description', 'Category', 'Site', 'Task', 'Amount (BDT)', 'Status', 'Extra budget requested (BDT)', 'Reviewed by', 'Receipt note', 'Entered by'],
      ...ledger.map((expense) => [
        expense.id, csvDate(expense.date || expense.createdAt), expense.description, EXPENSE_CATEGORIES[expense.category] ?? '', siteMap.get(expense.siteId)?.name ?? expense.siteId,
        expense.taskId ? `${expense.taskId} · ${taskMap.get(expense.taskId)?.title ?? ''}` : 'Site-level cost',
        expense.amount, expense.autoApproved ? 'Within budget' : EXPENSE_APPROVAL[expense.approvalStatus]?.label ?? '', expense.topUp?.amount ?? '', expense.reviewedBy ?? '', expense.receiptNote ?? '', expense.createdBy,
      ]),
    ])
  }

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
            <Button type="button" variant="secondary" onClick={exportLedger}><Download size={15} />Export expenses</Button>
            {!!visibleTasks.length && <Button type="button" onClick={() => setExpenseOpen(true)}><Plus size={16} />Add expense</Button>}
          </>
        )}
      />

      {overBudgetRows.length > 0 && (
        <div role="alert" className="flex flex-col gap-3 rounded-xl border border-slate-200 border-l-4 border-l-amber-500 bg-white px-4 py-3 text-xs text-slate-800 shadow-card sm:flex-row sm:items-center">
          <AlertTriangle size={17} className="shrink-0 text-slate-600" />
          <div className="min-w-0 flex-1"><p className="font-semibold">Budget attention required</p><p className="mt-1 text-slate-600">{overBudgetRows.length} {overBudgetRows.length === 1 ? 'site is' : 'sites are'} over the planned allocation: {overBudgetRows.map((row) => row.name).join(', ')}. Review the variance before approving more costs.</p></div>
          {canSchedule && <button type="button" onClick={budgetReview} className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-[11px] font-semibold text-slate-700 hover:bg-slate-50"><CalendarPlus size={14} className="text-slate-500" />Schedule budget review</button>}
        </div>
      )}

      <section className="grid gap-4 rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-card sm:grid-cols-4">
        <div><p className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">Planned budget</p><p className="mt-1 text-xl font-semibold text-slate-900">{formatBdt(summary.total)}</p></div>
        <div className="border-slate-100 sm:border-l sm:pl-5"><p className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">Actual costs</p><p className="mt-1 text-xl font-semibold text-slate-900">{formatBdt(summary.spent)}</p><a href="#ledger" className="mt-1 inline-flex items-center gap-1 text-[10px] font-semibold text-brand-700 hover:text-brand-900">{visibleExpenses.length} expense records <ArrowRight size={11} className="text-slate-500" /></a></div>
        <div className="border-slate-100 sm:border-l sm:pl-5"><p className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">Remaining</p><p className={cn('mt-1 text-xl font-semibold', summary.remaining < 0 ? 'text-amber-700' : 'text-slate-900')}>{formatBdt(summary.remaining)}</p></div>
        <div className="border-slate-100 sm:border-l sm:pl-5"><p className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">Committed</p><p className="mt-1 text-xl font-semibold text-slate-900">{formatBdt(summary.pending)}</p></div>
      </section>

      <div className="flex items-center justify-between gap-3"><div className="inline-flex rounded-lg border border-slate-200 bg-white p-1 shadow-card"><button type="button" onClick={() => setGroupBy('site')} className={cn('h-8 rounded-md px-3 text-[11px] font-semibold', groupBy === 'site' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:bg-slate-50')}>By site</button><button type="button" onClick={() => setGroupBy('task')} className={cn('h-8 rounded-md px-3 text-[11px] font-semibold', groupBy === 'task' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:bg-slate-50')}>By task</button></div><p className="hidden items-center gap-1.5 text-[10px] text-slate-400 sm:flex"><Landmark size={13} className="text-slate-500" />Amounts shown in Bangladeshi taka</p></div>

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]"><PlannedActualChart rows={rows} /><BudgetRows rows={rows} groupBy={groupBy} canPlan={canPlan} onEdit={setEditingBudget} /></div>

      <VerifiedWork rows={verifiedRows} />

      <section id="ledger" className="scroll-mt-20 space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="mr-auto">
            <h2 className="text-sm font-semibold text-slate-900">Expense ledger</h2>
            <p className="mt-0.5 text-xs text-slate-500">Within a task's budget an expense is accepted at once; above it, the field coordinator requests extra budget for you to approve.{waiting.length > 0 && <strong className="ml-1 font-semibold text-slate-800">{waiting.length} waiting for approval.</strong>}</p>
          </div>
          <label className="relative min-w-[200px]">
            <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={ledgerSearch} onChange={(event) => setLedgerSearch(event.target.value)} placeholder="Search description, ID or task" aria-label="Search expenses" className={`${ledgerInput} w-full pl-9`} />
          </label>
          <select value={ledgerStatus} onChange={(event) => setLedgerStatus(event.target.value)} aria-label="Expense status" className={ledgerInput}>
            <option value="all">All statuses</option>
            {Object.entries(EXPENSE_APPROVAL).map(([id, item]) => <option key={id} value={id}>{item.label}</option>)}
          </select>
        </div>
        <ExpenseHistory expenses={ledger} tasks={tasks} sites={sites} canReview={can('expenses.approve')} onReview={reviewLedgerExpense} />
      </section>

      <ExpenseFormModal open={expenseOpen} tasks={visibleTasks} onClose={() => setExpenseOpen(false)} onCreate={createExpense} />

      <BudgetAllocationModal key={editingBudget?.id ?? 'none'} open={Boolean(editingBudget)} site={editingBudget ? sites.find((site) => site.id === editingBudget.id) : null} planned={editingBudget?.planned} onClose={() => setEditingBudget(null)} onSave={saveAllocation} />
      <Toast message={notice} />
    </div>
  )
}

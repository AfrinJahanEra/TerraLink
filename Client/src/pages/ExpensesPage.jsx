import { Download, Plus, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ExpenseFormModal } from '../components/budget/ExpenseFormModal'
import { ExpenseHistory } from '../components/budget/ExpenseHistory'
import { Button } from '../components/ui/Button'
import { EXPENSE_APPROVAL, EXPENSE_CATEGORIES } from '../constants/actions'
import { PageHeader } from '../components/ui/PageHeader'
import { SummaryStrip } from '../components/ui/SummaryStrip'
import { Toast } from '../components/ui/Toast'
import { useApp } from '../hooks/useApp'
import { useNotice } from '../hooks/useNotice'
import { downloadCsv } from '../utils/csv'
import { formatBdt } from '../utils/currency'
import { todayKey } from '../utils/schedule'

import { createActivity } from '../utils/tasks'

const inputClass = 'h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-700 outline-none focus:border-brand-400'

export function ExpensesPage() {
  const { role, can, scope, expenses: allExpenses, addExpense, reviewExpense } = useApp()
  const { sites, tasks, expenses } = scope
  const [searchParams, setSearchParams] = useSearchParams()
  const [search, setSearch] = useState('')
  const [siteId, setSiteId] = useState('all')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [approval, setApproval] = useState('all')
  const [notice, showNotice] = useNotice()

  // Scoped already: a coordinator receives only expenses on their own tasks.
  const visibleTasks = tasks
  const visibleExpenses = expenses
  const siteOptions = useMemo(() => sites.filter((site) => visibleExpenses.some((expense) => expense.siteId === site.id)), [sites, visibleExpenses])

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    return [...visibleExpenses]
      .filter((expense) => {
        const matchesSearch = !term || `${expense.id} ${expense.description} ${expense.receiptNote} ${expense.taskId ?? ''} ${expense.createdBy}`.toLowerCase().includes(term)
        const matchesSite = siteId === 'all' || expense.siteId === siteId
        return matchesSearch && matchesSite && (approval === 'all' || expense.approvalStatus === approval) && (!from || expense.date >= from) && (!to || expense.date <= to)
      })
      .sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id))
  }, [approval, from, search, siteId, to, visibleExpenses])

  const sumOf = (list, status) => list.filter((expense) => expense.approvalStatus === status).reduce((sum, expense) => sum + Number(expense.amount || 0), 0)
  const approvedTotal = sumOf(filtered, 'approved')
  const pendingExpenses = filtered.filter((expense) => expense.approvalStatus === 'pending')
  const missingReceipts = filtered.filter((expense) => !expense.receiptNote?.trim() && !expense.receiptPhotos?.length).length
  const filtersActive = search || siteId !== 'all' || from || to || approval !== 'all'
  const formOpen = searchParams.get('new') === '1' && visibleTasks.length > 0

  function closeForm() {
    setSearchParams({}, { replace: true })
  }

  function createExpense(expense) {
    const highestId = allExpenses.reduce((highest, item) => Math.max(highest, Number(item.id.replace('EXP-', '')) || 0), 0)
    const id = `EXP-${String(highestId + 1).padStart(3, '0')}`
    const entry = addExpense({ ...expense, id, createdBy: role.user.name, createdAt: new Date().toISOString() }, createActivity(`${formatBdt(expense.amount)} expense recorded (${EXPENSE_CATEGORIES[expense.category]})`, role.user.name))
    closeForm()
    showNotice(entry.approvalStatus === 'approved' ? `${id} recorded and approved: ${formatBdt(expense.amount)} added to the task and site budget.` : `${id} recorded. It counts toward costs once the project manager approves it.`)
  }

  function handleReview(expenseId, decision, note) {
    try {
      reviewExpense(expenseId, decision, note)
      showNotice(`${expenseId} ${decision}.`)
    } catch (error) {
      showNotice(error instanceof Error ? error.message : 'The expense could not be reviewed.')
    }
  }

  function exportLedger() {
    const taskMap = new Map(tasks.map((task) => [task.id, task]))
    const siteMap = new Map(sites.map((site) => [site.id, site]))
    downloadCsv(`terralink-expenses-${todayKey()}.csv`, [
      ['Expense ID', 'Date', 'Description', 'Category', 'Site', 'Task', 'Amount (BDT)', 'Approval', 'Reviewed by', 'Receipt note', 'Entered by', 'Entered at'],
      ...filtered.map((expense) => [
        expense.id, expense.date, expense.description, EXPENSE_CATEGORIES[expense.category] ?? '', siteMap.get(expense.siteId)?.name ?? expense.siteId,
        expense.taskId ? `${expense.taskId} · ${taskMap.get(expense.taskId)?.title ?? ''}` : 'Site-level cost',
        expense.amount, EXPENSE_APPROVAL[expense.approvalStatus]?.label ?? '', expense.reviewedBy ?? '', expense.receiptNote, expense.createdBy, expense.createdAt,
      ]),
    ])
  }

  return (
    <div className="animate-fade-in space-y-5 pb-8">
      <PageHeader
        eyebrow="Finance"
        title="Expenses"
        description="The auditable ledger of field costs. An expense counts toward the task, the site budget, and the dashboard once the project manager approves it."
        actions={(
          <>
            <Button type="button" variant="secondary" onClick={exportLedger}><Download size={15} />Export CSV</Button>
            {!!visibleTasks.length && <Button type="button" onClick={() => setSearchParams({ new: '1' })}><Plus size={16} />Add expense</Button>}
          </>
        )}
      />

      <SummaryStrip
        items={[
          { label: filtersActive ? 'matching records' : 'records', value: filtered.length },
          { label: filtersActive ? 'approved in selection' : 'approved total', value: formatBdt(approvedTotal) },
          { label: `pending approval (${formatBdt(sumOf(pendingExpenses, 'pending'))})`, value: pendingExpenses.length, tone: pendingExpenses.length ? 'amber' : undefined },
          { label: 'without a receipt', value: missingReceipts, tone: missingReceipts ? 'amber' : undefined },
        ]}
        note={role.id === 'coordinator' ? 'Showing expenses for your tasks only' : can('budget.view') ? <Link to="/budget" className="font-semibold text-brand-700 hover:text-brand-900">View budget position</Link> : null}
      />

      <div className="flex flex-wrap items-center gap-3">
        <label className="relative min-w-[220px] flex-1 sm:max-w-xs">
          <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search description, ID, or task" aria-label="Search expenses" className={`${inputClass} w-full pl-9`} />
        </label>
        <select value={siteId} onChange={(event) => setSiteId(event.target.value)} aria-label="Site" className={inputClass}>
          <option value="all">All sites</option>
          {siteOptions.map((site) => <option key={site.id} value={site.id}>{site.name}</option>)}
        </select>
        <select value={approval} onChange={(event) => setApproval(event.target.value)} aria-label="Approval status" className={inputClass}>
          <option value="all">All statuses</option>
          {Object.entries(EXPENSE_APPROVAL).map(([id, item]) => <option key={id} value={id}>{item.label}</option>)}
        </select>
        <label className="flex items-center gap-2 text-[11px] text-slate-500">From<input type="date" value={from} max={to || undefined} onChange={(event) => setFrom(event.target.value)} className={inputClass} /></label>
        <label className="flex items-center gap-2 text-[11px] text-slate-500">To<input type="date" value={to} min={from || undefined} onChange={(event) => setTo(event.target.value)} className={inputClass} /></label>
        {filtersActive && <button type="button" onClick={() => { setSearch(''); setSiteId('all'); setFrom(''); setTo(''); setApproval('all') }} className="text-xs font-semibold text-brand-700 hover:text-brand-900">Reset filters</button>}
      </div>

      <ExpenseHistory expenses={filtered} tasks={tasks} sites={sites} canReview={can('expenses.approve')} onReview={handleReview} />

      <ExpenseFormModal key={searchParams.toString()} open={formOpen} tasks={visibleTasks} initialTaskId={searchParams.get('task')} onClose={closeForm} onCreate={createExpense} />
      <Toast message={notice} />
    </div>
  )
}

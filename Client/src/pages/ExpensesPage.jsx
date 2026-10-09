import { Download, Plus, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ExpenseFormModal } from '../components/budget/ExpenseFormModal'
import { ExpenseHistory } from '../components/budget/ExpenseHistory'
import { Button } from '../components/ui/Button'
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
  const { role, sites, tasks, expenses, addExpense } = useApp()
  const [searchParams, setSearchParams] = useSearchParams()
  const [search, setSearch] = useState('')
  const [siteId, setSiteId] = useState('all')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [notice, showNotice] = useNotice()

  const visibleTasks = useMemo(() => role.id === 'coordinator' ? tasks.filter((task) => task.assignee === role.user.name) : tasks, [role, tasks])
  const visibleExpenses = useMemo(
    () => role.id === 'coordinator' ? expenses.filter((expense) => visibleTasks.some((task) => task.id === expense.taskId)) : expenses,
    [expenses, role.id, visibleTasks],
  )
  const siteOptions = useMemo(() => sites.filter((site) => visibleExpenses.some((expense) => expense.siteId === site.id)), [sites, visibleExpenses])

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    return [...visibleExpenses]
      .filter((expense) => {
        const matchesSearch = !term || `${expense.id} ${expense.description} ${expense.receiptNote} ${expense.taskId ?? ''} ${expense.createdBy}`.toLowerCase().includes(term)
        const matchesSite = siteId === 'all' || expense.siteId === siteId
        return matchesSearch && matchesSite && (!from || expense.date >= from) && (!to || expense.date <= to)
      })
      .sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id))
  }, [from, search, siteId, to, visibleExpenses])

  const total = filtered.reduce((sum, expense) => sum + Number(expense.amount || 0), 0)
  const monthKey = todayKey().slice(0, 7)
  const thisMonth = visibleExpenses.filter((expense) => expense.date.startsWith(monthKey)).reduce((sum, expense) => sum + Number(expense.amount || 0), 0)
  const missingReceipts = filtered.filter((expense) => !expense.receiptNote?.trim()).length
  const filtersActive = search || siteId !== 'all' || from || to
  const formOpen = searchParams.get('new') === '1' && visibleTasks.length > 0

  function closeForm() {
    setSearchParams({}, { replace: true })
  }

  function createExpense(expense) {
    const highestId = expenses.reduce((highest, item) => Math.max(highest, Number(item.id.replace('EXP-', '')) || 0), 0)
    const id = `EXP-${String(highestId + 1).padStart(3, '0')}`
    addExpense({ ...expense, id, createdBy: role.user.name, createdAt: new Date().toISOString() }, createActivity(`${formatBdt(expense.amount)} expense recorded`, role.user.name))
    closeForm()
    showNotice(`${id} recorded: ${formatBdt(expense.amount)} added to the task, site budget, and dashboard.`)
  }

  function exportLedger() {
    const taskMap = new Map(tasks.map((task) => [task.id, task]))
    const siteMap = new Map(sites.map((site) => [site.id, site]))
    downloadCsv(`terralink-expenses-${todayKey()}.csv`, [
      ['Expense ID', 'Date', 'Description', 'Site', 'Task', 'Amount (BDT)', 'Receipt note', 'Entered by', 'Entered at'],
      ...filtered.map((expense) => [
        expense.id, expense.date, expense.description, siteMap.get(expense.siteId)?.name ?? expense.siteId,
        expense.taskId ? `${expense.taskId} · ${taskMap.get(expense.taskId)?.title ?? ''}` : 'Site-level cost',
        expense.amount, expense.receiptNote, expense.createdBy, expense.createdAt,
      ]),
    ])
  }

  return (
    <div className="animate-fade-in space-y-5 pb-8">
      <PageHeader
        eyebrow="Finance"
        title="Expenses"
        description="The auditable ledger of field costs. Each entry updates the linked task, the site budget, and the dashboard totals."
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
          { label: filtersActive ? 'in selection' : 'total recorded', value: formatBdt(total) },
          { label: 'this month', value: formatBdt(thisMonth) },
          { label: 'without receipt note', value: missingReceipts, tone: missingReceipts ? 'amber' : undefined },
        ]}
        note={role.id === 'coordinator' ? 'Showing expenses for your tasks only' : <Link to="/budget" className="font-semibold text-brand-700 hover:text-brand-900">View budget position</Link>}
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
        <label className="flex items-center gap-2 text-[11px] text-slate-500">From<input type="date" value={from} max={to || undefined} onChange={(event) => setFrom(event.target.value)} className={inputClass} /></label>
        <label className="flex items-center gap-2 text-[11px] text-slate-500">To<input type="date" value={to} min={from || undefined} onChange={(event) => setTo(event.target.value)} className={inputClass} /></label>
        {filtersActive && <button type="button" onClick={() => { setSearch(''); setSiteId('all'); setFrom(''); setTo('') }} className="text-xs font-semibold text-brand-700 hover:text-brand-900">Reset filters</button>}
      </div>

      <ExpenseHistory expenses={filtered} tasks={tasks} sites={sites} />

      <ExpenseFormModal key={searchParams.toString()} open={formOpen} tasks={visibleTasks} initialTaskId={searchParams.get('task')} onClose={closeForm} onCreate={createExpense} />
      <Toast message={notice} />
    </div>
  )
}

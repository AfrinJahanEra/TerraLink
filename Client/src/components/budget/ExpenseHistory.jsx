import { FileText, ReceiptText } from 'lucide-react'
import { formatBdt } from '../../utils/currency'

function formatDate(value) {
  return new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(`${value}T12:00:00`))
}

export function ExpenseHistory({ expenses, tasks, sites }) {
  const taskMap = new Map(tasks.map((task) => [task.id, task]))
  const siteMap = new Map(sites.map((site) => [site.id, site]))

  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-card">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4"><div><h2 className="text-sm font-semibold text-slate-900">Expense history</h2><p className="mt-0.5 text-xs text-slate-400">Auditable costs linked to field work</p></div><span className="text-xs font-semibold text-slate-500">{expenses.length} records</span></div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[820px] text-left text-xs">
          <thead className="bg-slate-50/70 text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400"><tr><th className="px-5 py-3">Date</th><th className="px-4 py-3">Description</th><th className="px-4 py-3">Site / task</th><th className="px-4 py-3">Receipt note</th><th className="px-5 py-3 text-right">Amount</th></tr></thead>
          <tbody className="divide-y divide-slate-100">
            {expenses.map((expense) => {
              const task = taskMap.get(expense.taskId)
              const site = siteMap.get(expense.siteId)
              return (
                <tr key={expense.id} className="align-top hover:bg-slate-50/60">
                  <td className="whitespace-nowrap px-5 py-3.5 text-slate-500">{formatDate(expense.date)}</td>
                  <td className="px-4 py-3.5"><p className="font-semibold text-slate-800">{expense.description}</p><p className="mt-1 text-[10px] text-slate-400">{expense.id} · Entered by {expense.createdBy}</p></td>
                  <td className="px-4 py-3.5"><p className="font-medium text-slate-700">{site?.name ?? 'Unknown site'}</p><p className="mt-1 text-[10px] text-slate-400">{task ? `${task.id} · ${task.title}` : 'Site-level cost'}</p></td>
                  <td className="max-w-56 px-4 py-3.5 text-slate-500">{expense.receiptNote ? <span className="flex items-start gap-1.5"><FileText size={13} className="mt-0.5 shrink-0 text-slate-500" />{expense.receiptNote}</span> : 'No receipt note'}</td>
                  <td className="whitespace-nowrap px-5 py-3.5 text-right font-semibold text-slate-900">{formatBdt(expense.amount)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      {!expenses.length && <div className="px-6 py-14 text-center"><ReceiptText size={26} className="mx-auto text-slate-400" /><p className="mt-3 text-xs text-slate-500">No expenses are visible in this workspace.</p></div>}
    </section>
  )
}

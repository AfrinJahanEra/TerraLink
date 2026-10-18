import { AlertTriangle, ArrowRight, CircleDollarSign } from 'lucide-react'
import { Link } from 'react-router-dom'
import { formatBdt } from '../../utils/currency'

export function BudgetCard({ budget, title = 'Budget overview', subtitle = 'Current programme budget' }) {
  const remaining = budget.total - budget.spent
  const usedPercent = budget.total ? Math.round((budget.spent / budget.total) * 100) : 0
  const chartUsedPercent = Math.min(usedPercent, 100)
  const pendingPercent = budget.total ? Math.min(Math.round((budget.pending / budget.total) * 100), 100 - chartUsedPercent) : 0
  const circumference = 2 * Math.PI * 42
  const overBudget = remaining < 0

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-card">
      <div className="flex items-center justify-between"><div><h2 className="text-sm font-semibold text-slate-900">{title}</h2><p className="mt-0.5 text-xs text-slate-400">{subtitle}</p></div><Link to="/budget" aria-label="Open budget" className="rounded-lg p-2 text-slate-500 hover:bg-slate-50 hover:text-slate-800"><ArrowRight size={16} /></Link></div>
      <div className="mt-4 flex items-center gap-4">
        <div className="relative size-28 shrink-0">
          <svg viewBox="0 0 100 100" className="-rotate-90 size-full" role="img" aria-label={`${usedPercent}% of programme budget spent`}>
            <circle cx="50" cy="50" r="42" fill="none" stroke="#e2e8f0" strokeWidth="11" />
            <circle cx="50" cy="50" r="42" fill="none" stroke="#94a3b8" strokeWidth="11" strokeDasharray={`${circumference * pendingPercent / 100} ${circumference}`} strokeDashoffset={-circumference * chartUsedPercent / 100} />
            <circle cx="50" cy="50" r="42" fill="none" stroke={overBudget ? '#b45309' : '#20787d'} strokeWidth="11" strokeDasharray={`${circumference * chartUsedPercent / 100} ${circumference}`} strokeLinecap="round" />
          </svg>
          <div className="pointer-events-none absolute inset-0 grid place-items-center text-center"><div><p className="text-lg font-bold text-slate-900">{usedPercent}%</p><p className="text-[9px] text-slate-400">used</p></div></div>
        </div>
        <div className="min-w-0 flex-1 space-y-2.5 text-xs">
          <div className="flex justify-between gap-3"><span className="flex items-center gap-2 text-slate-500"><span className={overBudget ? 'size-2 rounded-full bg-amber-600' : 'size-2 rounded-full bg-brand-600'} />Spent</span><span className="font-semibold text-slate-800">{formatBdt(budget.spent)}</span></div>
          <div className="flex justify-between gap-3"><span className="flex items-center gap-2 text-slate-500"><span className="size-2 rounded-full bg-slate-400" />Committed</span><span className="font-semibold text-slate-800">{formatBdt(budget.pending)}</span></div>
          <div className="flex justify-between gap-3 border-t border-slate-100 pt-2.5"><span className="flex items-center gap-2 text-slate-500">{overBudget ? <AlertTriangle size={14} className="text-slate-600" /> : <CircleDollarSign size={14} />}Remaining</span><span className={overBudget ? 'font-semibold text-amber-700' : 'font-semibold text-slate-800'}>{formatBdt(remaining)}</span></div>
        </div>
      </div>
    </section>
  )
}

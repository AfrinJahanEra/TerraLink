import { ArrowRight, CircleDollarSign } from 'lucide-react'
import { Link } from 'react-router-dom'

function buildPoints(data, key, width = 400, height = 150) {
  const max = Math.max(...data.flatMap((item) => [item.reviewed, item.tasks]), 1)
  return data.map((item, index) => {
    const x = data.length === 1 ? width / 2 : (index / (data.length - 1)) * width
    const y = height - (item[key] / max) * (height - 20) - 10
    return `${x},${y}`
  }).join(' ')
}

export function MonitoringTrend({ data, range, onRangeChange }) {
  const reviews = buildPoints(data, 'reviewed')
  const tasks = buildPoints(data, 'tasks')

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <div><h2 className="text-sm font-semibold text-slate-900">Monitoring activity</h2><p className="mt-0.5 text-xs text-slate-400">Reviews and tasks created</p></div>
        <select value={range} onChange={(event) => onRangeChange(event.target.value)} aria-label="Chart period" className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 outline-none focus:border-brand-400">
          <option>7 days</option><option>30 days</option><option>90 days</option>
        </select>
      </div>
      <div className="mt-5 h-52" aria-label={`Monitoring activity over ${range}`}>
        <svg viewBox="0 0 400 180" role="img" aria-label={`Line chart showing ${range} of reviews and tasks`} className="size-full overflow-visible">
          {[30, 70, 110, 150].map((y) => <line key={y} x1="0" x2="400" y1={y} y2={y} stroke="#eef2f6" strokeDasharray="4 4" />)}
          <polyline points={reviews} fill="none" stroke="#20787d" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          <polyline points={tasks} fill="none" stroke="#8b5cf6" strokeWidth="2.5" strokeDasharray="6 5" strokeLinecap="round" strokeLinejoin="round" />
          {data.map((item, index) => {
            const x = data.length === 1 ? 200 : (index / (data.length - 1)) * 400
            return <text key={item.date} x={x} y="177" textAnchor={index === 0 ? 'start' : index === data.length - 1 ? 'end' : 'middle'} fill="#94a3b8" fontSize="10">{item.date}</text>
          })}
        </svg>
      </div>
      <div className="mt-2 flex items-center justify-center gap-5 text-[10px] text-slate-500"><span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-brand-600" />Reviews</span><span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-violet-500" />Tasks</span></div>
    </section>
  )
}

export function BudgetCard({ budget }) {
  const remaining = budget.total - budget.spent
  const usedPercent = Math.round((budget.spent / budget.total) * 100)
  const pendingPercent = Math.round((budget.pending / budget.total) * 100)
  const circumference = 2 * Math.PI * 42
  const currency = (value) => `৳${value.toLocaleString('en-US')}`

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-card">
      <div className="flex items-center justify-between"><div><h2 className="text-sm font-semibold text-slate-900">Budget overview</h2><p className="mt-0.5 text-xs text-slate-400">Current programme budget</p></div><Link to="/budget" aria-label="Open budget" className="rounded-lg p-2 text-slate-400 hover:bg-slate-50 hover:text-brand-700"><ArrowRight size={16} /></Link></div>
      <div className="mt-4 flex items-center gap-4">
        <div className="relative size-28 shrink-0">
          <svg viewBox="0 0 100 100" className="-rotate-90 size-full" role="img" aria-label={`${usedPercent}% of programme budget spent`}>
            <circle cx="50" cy="50" r="42" fill="none" stroke="#e2e8f0" strokeWidth="11" />
            <circle cx="50" cy="50" r="42" fill="none" stroke="#f59e0b" strokeWidth="11" strokeDasharray={`${circumference * pendingPercent / 100} ${circumference}`} strokeDashoffset={-circumference * usedPercent / 100} />
            <circle cx="50" cy="50" r="42" fill="none" stroke="#20787d" strokeWidth="11" strokeDasharray={`${circumference * usedPercent / 100} ${circumference}`} strokeLinecap="round" />
          </svg>
          <div className="pointer-events-none absolute inset-0 grid place-items-center text-center"><div><p className="text-lg font-bold text-slate-900">{usedPercent}%</p><p className="text-[9px] text-slate-400">used</p></div></div>
        </div>
        <div className="min-w-0 flex-1 space-y-2.5 text-xs">
          <div className="flex justify-between gap-3"><span className="flex items-center gap-2 text-slate-500"><span className="size-2 rounded-full bg-brand-600" />Spent</span><span className="font-semibold text-slate-800">{currency(budget.spent)}</span></div>
          <div className="flex justify-between gap-3"><span className="flex items-center gap-2 text-slate-500"><span className="size-2 rounded-full bg-amber-500" />Pending</span><span className="font-semibold text-slate-800">{currency(budget.pending)}</span></div>
          <div className="flex justify-between gap-3 border-t border-slate-100 pt-2.5"><span className="flex items-center gap-2 text-slate-500"><CircleDollarSign size={14} />Remaining</span><span className="font-semibold text-emerald-700">{currency(remaining)}</span></div>
        </div>
      </div>
    </section>
  )
}

import { Bar, BarChart, CartesianGrid, Cell, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { formatBdt } from '../../utils/currency'

function BudgetTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-pop">
      <p className="font-semibold text-slate-800">{label}</p>
      {payload.map((entry) => <p key={entry.dataKey} className="mt-1 text-slate-500">{entry.name}: <span className="font-semibold text-slate-700">{formatBdt(entry.value)}</span></p>)}
    </div>
  )
}

export function PlannedActualChart({ rows }) {
  const data = rows.map((row) => ({ ...row, shortName: row.name.length > 16 ? `${row.name.slice(0, 14)}…` : row.name }))

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-card">
      <div><h2 className="text-sm font-semibold text-slate-900">Planned versus actual</h2><p className="mt-0.5 text-xs text-slate-400">Live comparison from current allocations and recorded costs</p></div>
      <div className="mt-5 h-80" aria-label="Bar chart comparing planned and actual costs">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 18 }}>
            <CartesianGrid stroke="#e2e8f0" strokeDasharray="4 4" vertical={false} />
            <XAxis dataKey="shortName" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} interval={0} angle={-16} textAnchor="end" height={55} />
            <YAxis tickFormatter={(value) => `৳${Math.round(value / 1000)}k`} tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} width={48} />
            <Tooltip content={<BudgetTooltip />} cursor={{ fill: '#f8fafc' }} />
            <Legend wrapperStyle={{ fontSize: 11, color: '#64748b' }} />
            <Bar dataKey="planned" name="Planned" fill="#94a3b8" radius={[4, 4, 0, 0]} maxBarSize={30} />
            <Bar dataKey="actual" name="Actual" fill="#20787d" radius={[4, 4, 0, 0]} maxBarSize={30}>
              {data.map((row) => <Cell key={row.id} fill={row.overBudget ? '#b45309' : '#20787d'} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  )
}

import { Link } from 'react-router-dom'

export function KpiCard({ icon: Icon, label, value, detail, to }) {
  const content = (
    <div className="flex items-start justify-between gap-3">
      <div>
        <p className="text-xs font-medium text-slate-500">{label}</p>
        <p className="mt-2 text-[28px] font-bold tracking-[-0.04em] text-slate-950">{value}</p>
        <p className="mt-1 text-[11px] text-slate-400">{detail}</p>
      </div>
      <span className="grid size-10 place-items-center rounded-xl bg-slate-100 text-slate-600"><Icon size={19} strokeWidth={1.8} /></span>
    </div>
  )

  return to ? (
    <Link to={to} className="block rounded-xl border border-slate-200 bg-white p-5 shadow-card transition duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md">
      {content}
    </Link>
  ) : (
    <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-card">{content}</article>
  )
}

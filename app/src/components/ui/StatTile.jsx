import { cn } from '../../utils/cn'

/** Compact number with a label, used in page headers so the first screen carries real information. One accent colour only. */
export function StatTile({ icon: Icon, label, value, hint, className }) {
  return (
    <div className={cn('flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2.5 shadow-card sm:px-3.5 sm:py-3', className)}>
      {Icon && <span className="hidden size-9 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-700 min-[420px]:grid"><Icon size={17} /></span>}
      <div className="min-w-0">
        <p className="text-lg font-bold leading-6 tracking-tight text-slate-900">{value}</p>
        <p className="truncate text-[11px] font-medium text-slate-500">{label}</p>
        {hint && <p className="truncate text-[10px] text-slate-400">{hint}</p>}
      </div>
    </div>
  )
}

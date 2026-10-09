import { cn } from '../../utils/cn'

const valueTones = {
  default: 'text-slate-800',
  rose: 'text-rose-700',
  amber: 'text-slate-800',
  emerald: 'text-slate-800',
}

export function SummaryStrip({ items, note }) {
  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-y border-slate-200 py-3 text-xs text-slate-500">
      {items.map((item) => (
        <span key={item.label}><strong className={cn('font-semibold', valueTones[item.tone ?? 'default'])}>{item.value}</strong> {item.label}</span>
      ))}
      {note && <span className="ml-auto text-[10px] text-slate-400">{note}</span>}
    </div>
  )
}

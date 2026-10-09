import { cn } from '../../utils/cn'

const tones = {
  brand: 'bg-brand-50 text-brand-700 ring-brand-200',
  amber: 'bg-amber-50 text-amber-700 ring-amber-200',
  emerald: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  slate: 'bg-slate-100 text-slate-600 ring-slate-200',
}

export function Badge({ tone = 'slate', children, className }) {
  return (
    <span className={cn('inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset', tones[tone], className)}>
      {children}
    </span>
  )
}

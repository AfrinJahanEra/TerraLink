import { cn } from '../../utils/cn'

/* Neutral pill; the tone only colours a small status dot to keep the interface calm. */
const dots = {
  brand: 'bg-brand-600',
  amber: 'bg-amber-500',
  emerald: 'bg-brand-700',
  rose: 'bg-rose-500',
  violet: 'bg-slate-400',
  sky: 'bg-brand-400',
  slate: null,
  neutral: 'bg-slate-400',
  brandSoft: 'bg-brand-400',
  brandDeep: 'bg-brand-800',
}

export function Badge({ tone = 'slate', children, className }) {
  const dot = dots[tone]
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 ring-1 ring-inset ring-slate-200', className)}>
      {dot && <span aria-hidden="true" className={cn('size-1.5 shrink-0 rounded-full', dot)} />}
      {children}
    </span>
  )
}

import { cn } from '../../utils/cn'

export function PageHeader({ eyebrow, description, actions, className }) {
  return (
    <header className={cn('flex flex-col justify-between gap-4 sm:flex-row sm:items-end', className)}>
      <div className="min-w-0">
        {eyebrow && <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-brand-700">{eyebrow}</p>}
        {description && <p className="mt-1 max-w-3xl text-[12.5px] leading-5 text-slate-500">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  )
}

import { Waves } from 'lucide-react'
import { cn } from '../../utils/cn'

export function Logo({ compact = false, inverse = false }) {
  return (
    <div className="flex items-center gap-3">
      <span className={cn('grid size-9 shrink-0 place-items-center rounded-xl', inverse ? 'bg-white/12 text-white' : 'bg-brand-700 text-white')}>
        <Waves size={20} strokeWidth={2.2} />
      </span>
      {!compact && (
        <div className="leading-none">
          <div className={cn('text-[17px] font-bold tracking-tight', inverse ? 'text-white' : 'text-slate-900')}>TerraLink</div>
          <div className={cn('mt-1 text-[10px] font-semibold uppercase tracking-[0.16em]', inverse ? 'text-brand-100' : 'text-slate-400')}>Wetland workspace</div>
        </div>
      )}
    </div>
  )
}

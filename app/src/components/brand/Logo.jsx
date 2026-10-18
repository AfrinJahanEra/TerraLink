import { Waves } from 'lucide-react'
import { cn } from '../../utils/cn'

export function Logo({ compact = false, inverse = false, size = 'md' }) {
  const large = size === 'lg'
  return (
    <div className="flex items-center gap-3">
      <span className={cn('grid shrink-0 place-items-center rounded-xl', large ? 'size-10' : 'size-9', inverse ? 'bg-white/12 text-white' : 'bg-brand-700 text-white')}>
        <Waves size={large ? 22 : 20} strokeWidth={2.2} />
      </span>
      {!compact && (
        <div className="leading-none">
          <div className={cn('font-bold tracking-tight', large ? 'text-[21px]' : 'text-[17px]', inverse ? 'text-white' : 'text-slate-900')}>TerraLink</div>
          <div className={cn('mt-1 text-[10px] font-semibold uppercase tracking-[0.16em]', inverse ? 'text-brand-100' : 'text-slate-400')}>Wetland workspace</div>
        </div>
      )}
    </div>
  )
}

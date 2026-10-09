import { Check } from 'lucide-react'
import { cn } from '../../utils/cn'

export function Toast({ message, className }) {
  if (!message) return null
  return (
    <div role="status" className={cn('fixed bottom-5 right-5 z-[1100] flex max-w-sm items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-3 text-xs font-semibold text-slate-700 shadow-pop', className)}>
      <Check size={15} className="shrink-0 text-slate-600" />{message}
    </div>
  )
}

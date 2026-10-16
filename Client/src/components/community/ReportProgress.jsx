import { Ban } from 'lucide-react'
import { cn } from '../../utils/cn'

const STEPS = ['Submitted', 'Under review', 'Verified', 'Action taken', 'Resolved']

/** Where a report is on its way from submission to an outcome. */
export function ReportProgress({ report }) {
  const hasAction = report.tasks?.some((task) => task.status !== 'cancelled')
  const index = report.resolved ? 4 : report.status === 'verified' ? (hasAction ? 3 : 2) : report.status === 'under_review' ? 1 : 0
  const rejected = report.status === 'rejected'
  const reason = rejected ? report.history.filter((entry) => entry.status === 'rejected').pop()?.note : ''

  return (
    <div>
      <ol className="flex items-start" aria-label="Report progress">
        {STEPS.map((label, position) => {
          const reached = !rejected && index >= position || (rejected && position === 0)
          const current = !rejected && index === position
          return (
            <li key={label} className="flex flex-1 flex-col items-center text-center">
              <div className="flex w-full items-center">
                <span className={cn('h-0.5 flex-1', position === 0 ? 'bg-transparent' : reached ? 'bg-brand-500' : 'bg-slate-200')} />
                <span className={cn('grid size-6 shrink-0 place-items-center rounded-full border-2 text-[10px] font-bold', reached ? 'border-brand-600 bg-brand-600 text-white' : 'border-slate-300 bg-white text-slate-400', current && 'ring-4 ring-brand-100')} aria-current={current ? 'step' : undefined}>{position + 1}</span>
                <span className={cn('h-0.5 flex-1', position === STEPS.length - 1 ? 'bg-transparent' : !rejected && index > position ? 'bg-brand-500' : 'bg-slate-200')} />
              </div>
              <span className={cn('mt-1.5 px-0.5 text-[10px] leading-3', current ? 'font-semibold text-slate-800' : 'text-slate-400')}>{label}</span>
            </li>
          )
        })}
      </ol>
      {rejected && (
        <p className="mt-3 flex items-start gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs leading-5 text-slate-700"><Ban size={14} className="mt-0.5 shrink-0 text-slate-500" /><span><strong className="font-semibold">Not accepted.</strong> {reason || 'A reviewer did not accept this report.'}</span></p>
      )}
    </div>
  )
}

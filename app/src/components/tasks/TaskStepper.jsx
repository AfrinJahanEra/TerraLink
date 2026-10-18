import { cn } from '../../utils/cn'

const STEPS = [
  ['open', 'Open'],
  ['in_progress', 'In progress'],
  ['awaiting_verification', 'Awaiting verification'],
  ['completed', 'Completed'],
]

/** Where the task is in its workflow: 1 Open → 2 In progress → 3 Awaiting verification → 4 Completed. */
export function TaskStepper({ status, className }) {
  // Blocked work sits at the in-progress stage; cancelled work is shown by its banner instead.
  const index = STEPS.findIndex(([id]) => id === (status === 'blocked' ? 'in_progress' : status))
  const live = status !== 'cancelled'
  return (
    <ol className={cn('flex items-start', className)} aria-label="Task stages">
      {STEPS.map(([id, label], position) => {
        const reached = live && index >= position
        return (
          <li key={id} className="flex flex-1 flex-col items-center text-center">
            <div className="flex w-full items-center">
              <span className={cn('h-0.5 flex-1', position === 0 ? 'bg-transparent' : reached ? 'bg-slate-800' : 'bg-slate-200')} />
              <span className={cn('grid size-6 shrink-0 place-items-center rounded-full border-2 text-[10px] font-bold', reached ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-300 bg-white text-slate-400')} aria-current={index === position ? 'step' : undefined}>{position + 1}</span>
              <span className={cn('h-0.5 flex-1', position === STEPS.length - 1 ? 'bg-transparent' : live && index > position ? 'bg-slate-800' : 'bg-slate-200')} />
            </div>
            <span className={cn('mt-1.5 px-1 text-[10px] leading-3', live && index === position ? 'font-semibold text-slate-900' : 'text-slate-400')}>
              {label}{status === 'blocked' && id === 'in_progress' ? ' · blocked' : ''}
            </span>
          </li>
        )
      })}
    </ol>
  )
}

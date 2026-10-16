import { ChevronRight } from 'lucide-react'
import { cn } from '../../utils/cn'
import { formatDateLabel, formatTimeRange, groupItemsByDate, itemDotClass, todayKey } from '../../utils/schedule'

export function AgendaList({ items, onOpenItem, emptyText = 'Nothing is scheduled for this period.', compact = false }) {
  const grouped = [...groupItemsByDate(items).entries()]
  const today = todayKey()

  if (!grouped.length) return <p className="px-5 py-8 text-center text-xs text-slate-500">{emptyText}</p>

  return (
    <div className="divide-y divide-slate-100">
      {grouped.map(([date, dayItems]) => (
        <div key={date} className={cn('flex gap-4 px-5', compact ? 'py-3' : 'py-4')}>
          <div className={cn('shrink-0 pt-0.5', compact ? 'w-16' : 'w-20')}>
            <p className={cn('text-[11px] font-semibold', date === today ? 'text-brand-700' : 'text-slate-700')}>{formatDateLabel(date)}</p>
            {date === today && <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-brand-600">Today</p>}
          </div>
          <ul className="min-w-0 flex-1 space-y-1">
            {dayItems.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => onOpenItem(item)}
                  className="group flex w-full items-center gap-3 rounded-lg px-2 py-1.5 text-left transition hover:bg-slate-50"
                >
                  <span className={cn('size-2 shrink-0 rounded-full', itemDotClass(item))} />
                  {!compact && <span className="w-24 shrink-0 text-[11px] tabular-nums text-slate-500">{item.kind === 'meeting' ? formatTimeRange(item.record) : 'Deadline'}</span>}
                  <span className="min-w-0 flex-1">
                    <span className={cn('block truncate text-xs font-medium', item.status === 'cancelled' ? 'text-slate-400 line-through' : 'text-slate-800')}>{item.title}</span>
                    <span className="mt-0.5 block truncate text-[10px] text-slate-400">
                      {compact && item.kind === 'meeting' && `${formatTimeRange(item.record)} · `}{item.label}
                      {item.kind === 'meeting' && item.record.location ? ` · ${item.record.location}` : ''}
                      {item.kind === 'deadline' ? ` · ${item.record.assignee}${item.status === 'overdue' ? ' · Overdue' : ''}` : ''}
                    </span>
                  </span>
                  <ChevronRight size={14} className="shrink-0 text-slate-300 group-hover:text-slate-500" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}

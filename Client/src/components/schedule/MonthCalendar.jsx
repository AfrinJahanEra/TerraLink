import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '../../utils/cn'
import { formatMonthLabel, getMonthGrid, groupItemsByDate, itemDotClass, parseDateKey, todayKey } from '../../utils/schedule'

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export function MonthCalendar({ month, items, selectedDate, onSelectDate, onOpenItem, onPrev, onNext, onToday }) {
  const days = getMonthGrid(month)
  const grouped = groupItemsByDate(items)
  const today = todayKey()
  const currentMonth = month.getMonth()

  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-card">
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-3.5">
        <h2 className="text-sm font-semibold text-slate-900">{formatMonthLabel(month)}</h2>
        <div className="flex items-center gap-1">
          <button type="button" onClick={onToday} className="h-8 rounded-lg border border-slate-200 px-3 text-[11px] font-semibold text-slate-600 hover:bg-slate-50">Today</button>
          <button type="button" onClick={onPrev} aria-label="Previous month" className="grid size-8 place-items-center rounded-lg text-slate-500 hover:bg-slate-100"><ChevronLeft size={16} /></button>
          <button type="button" onClick={onNext} aria-label="Next month" className="grid size-8 place-items-center rounded-lg text-slate-500 hover:bg-slate-100"><ChevronRight size={16} /></button>
        </div>
      </div>
      <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50/70 text-center text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">
        {WEEKDAYS.map((day) => <div key={day} className="py-2">{day}</div>)}
      </div>
      <div className="grid grid-cols-7">
        {days.map((key) => {
          const date = parseDateKey(key)
          const dayItems = grouped.get(key) ?? []
          const outside = date.getMonth() !== currentMonth
          const weekend = date.getDay() === 5 || date.getDay() === 6
          const selected = key === selectedDate
          return (
            <div
              key={key}
              role="button"
              tabIndex={0}
              onClick={() => onSelectDate(key)}
              onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onSelectDate(key) } }}
              aria-label={`${key}, ${dayItems.length} scheduled items`}
              className={cn(
                'min-h-[92px] cursor-pointer border-b border-r border-slate-100 p-1.5 text-left outline-none transition [&:nth-child(7n)]:border-r-0 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-300',
                weekend && 'bg-slate-50/60',
                outside && 'text-slate-300',
                selected ? 'bg-brand-50/70' : 'hover:bg-slate-50',
              )}
            >
              <span className={cn('grid size-6 place-items-center rounded-full text-[11px] font-semibold', key === today ? 'bg-slate-800 text-white' : outside ? 'text-slate-300' : 'text-slate-600')}>{date.getDate()}</span>
              <div className="mt-1 space-y-0.5">
                {dayItems.slice(0, 3).map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={(event) => { event.stopPropagation(); onOpenItem(item) }}
                    className={cn('flex w-full items-center gap-1 truncate rounded px-1 py-0.5 text-left text-[10px] font-medium hover:bg-white', item.status === 'cancelled' ? 'text-slate-400 line-through' : 'text-slate-700')}
                    title={`${item.time ? `${item.time} · ` : ''}${item.title}`}
                  >
                    <span className={cn('size-1.5 shrink-0 rounded-full', itemDotClass(item))} />
                    <span className="truncate">{item.time && <span className="text-slate-400">{item.time} </span>}{item.kind === 'deadline' ? item.record.id : item.title}</span>
                  </button>
                ))}
                {dayItems.length > 3 && <p className="px-1 text-[10px] font-semibold text-slate-400">+{dayItems.length - 3} more</p>}
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}

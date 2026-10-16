import { ArrowDownUp, RotateCcw, Search } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { cn } from '../../utils/cn'
import { TASK_QUICK_VIEWS, TASK_SORTS } from '../../utils/tasks'

const control = 'h-7 rounded-md border border-slate-200 bg-white px-2 text-[11px] text-slate-600 outline-none transition hover:border-slate-300 focus:border-slate-400 focus:ring-1 focus:ring-slate-300'

const isTyping = (target) => target instanceof HTMLElement && (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))

/** A flat toolbar: search, scope filters and sort on the left, whatever is passed as children on the right. Press / to search. */
export function TaskFilters({ filters, sites, members, showAssignee = true, sort, onSortChange, onChange, onReset, children }) {
  const searchRef = useRef(null)
  const active = filters.search || filters.site !== 'all' || filters.status !== 'all' || (showAssignee && filters.assignee !== 'all') || filters.quick !== 'all'

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key !== '/' || event.metaKey || event.ctrlKey || event.altKey || isTyping(event.target)) return
      if (document.querySelector('[aria-modal="true"]')) return
      event.preventDefault()
      searchRef.current?.focus()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  function update(key, value) {
    onChange({ ...filters, [key]: value })
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <label className="relative min-w-[200px] flex-1 sm:max-w-xs">
        <Search size={13} className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
        <input ref={searchRef} type="search" value={filters.search} onChange={(event) => update('search', event.target.value)} onKeyDown={(event) => { if (event.key === 'Escape') { update('search', ''); event.currentTarget.blur() } }} placeholder="Search task, ID, or site" className={`${control} w-full pl-7 pr-7 placeholder:text-slate-400`} />
        {!filters.search && <kbd aria-hidden="true" className="pointer-events-none absolute right-1.5 top-1/2 grid h-4 min-w-4 -translate-y-1/2 place-items-center rounded-[3px] border border-slate-200 px-1 font-sans text-[9.5px] text-slate-400">/</kbd>}
      </label>

      <select value={filters.site} onChange={(event) => update('site', event.target.value)} aria-label="Filter by site" className={control}><option value="all">All sites</option>{sites.map((site) => <option key={site.id} value={site.id}>{site.name}</option>)}</select>
      {showAssignee && <select value={filters.assignee} onChange={(event) => update('assignee', event.target.value)} aria-label="Filter by assignee" className={control}><option value="all">All assignees</option>{members.map((member) => <option key={member.id} value={member.name}>{member.name}</option>)}</select>}

      <label className={`${control} flex cursor-pointer items-center gap-1 pr-0.5 focus-within:border-slate-400 focus-within:ring-1 focus-within:ring-slate-300`}>
        <ArrowDownUp size={11} className="text-slate-400" />
        <span className="text-slate-400">Sort</span>
        <select value={sort} onChange={(event) => onSortChange(event.target.value)} aria-label="Sort tasks" className="cursor-pointer bg-transparent font-medium text-slate-700 outline-none">
          {Object.entries(TASK_SORTS).map(([id, label]) => <option key={id} value={id}>{label}</option>)}
        </select>
      </label>
      {active && <button type="button" onClick={onReset} className="flex h-7 items-center gap-1 rounded-md px-1.5 text-[11px] font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"><RotateCcw size={11} />Reset</button>}

      {children && <div className="ml-auto">{children}</div>}
    </div>
  )
}

/** Underlined text tabs for the common questions: what is late, what is due soon, what matters most. */
export function TaskQuickViews({ value, counts, onChange, children }) {
  return (
    <div className="flex flex-wrap items-end gap-x-4 gap-y-1 border-b border-slate-200">
      {[{ id: 'all', label: 'All tasks' }, ...TASK_QUICK_VIEWS].map((view) => {
        const active = value === view.id
        const count = counts[view.id] ?? 0
        return (
          <button
            key={view.id}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(active ? 'all' : view.id)}
            className={cn('-mb-px inline-flex items-center gap-1.5 border-b-2 pb-1.5 text-[11px] font-medium transition-colors', active ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-800')}
          >
            {view.label}
            <span className={cn('tabular-nums text-[10px]', view.id === 'overdue' && count > 0 ? 'text-rose-600' : 'text-slate-400')}>{count}</span>
          </button>
        )
      })}
      {children && <div className="ml-auto flex flex-wrap items-center gap-x-3 gap-y-1 pb-1.5">{children}</div>}
    </div>
  )
}

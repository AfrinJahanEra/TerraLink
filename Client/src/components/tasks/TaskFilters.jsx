import { Filter, RotateCcw, Search } from 'lucide-react'
import { TASK_STATUS } from '../../constants/status'

export function TaskFilters({ filters, sites, members, onChange, onReset }) {
  const active = filters.search || filters.site !== 'all' || filters.status !== 'all' || filters.assignee !== 'all' || filters.overdue

  function update(key, value) {
    onChange({ ...filters, [key]: value })
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-card">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
        <label className="relative min-w-0 flex-1">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input type="search" value={filters.search} onChange={(event) => update('search', event.target.value)} placeholder="Search task, ID, or site" className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-xs text-slate-700 outline-none focus:border-brand-400 focus:bg-white" />
        </label>

        <div className="grid gap-2 sm:grid-cols-3 xl:flex xl:items-center">
          <select value={filters.site} onChange={(event) => update('site', event.target.value)} aria-label="Filter by site" className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-600 outline-none focus:border-brand-400"><option value="all">All sites</option>{sites.map((site) => <option key={site.id} value={site.id}>{site.name}</option>)}</select>
          <select value={filters.status} onChange={(event) => update('status', event.target.value)} aria-label="Filter by status" className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-600 outline-none focus:border-brand-400"><option value="all">All statuses</option>{Object.entries(TASK_STATUS).map(([id, config]) => <option key={id} value={id}>{config.label}</option>)}</select>
          <select value={filters.assignee} onChange={(event) => update('assignee', event.target.value)} aria-label="Filter by assignee" className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-600 outline-none focus:border-brand-400"><option value="all">All assignees</option>{members.map((member) => <option key={member.id} value={member.name}>{member.name}</option>)}</select>
        </div>

        <label className="flex h-10 shrink-0 cursor-pointer items-center gap-2 rounded-lg border border-slate-200 px-3 text-xs font-medium text-slate-600"><input type="checkbox" checked={filters.overdue} onChange={(event) => update('overdue', event.target.checked)} className="accent-slate-700" />Overdue only</label>
        {active && <button type="button" onClick={onReset} className="flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-lg px-3 text-xs font-semibold text-brand-700 hover:bg-brand-50"><RotateCcw size={14} className="text-slate-500" />Reset</button>}
      </div>
      <div className="mt-3 flex items-center gap-2 text-[10px] text-slate-400"><Filter size={12} className="text-slate-500" />Filters update the board and list immediately.</div>
    </section>
  )
}

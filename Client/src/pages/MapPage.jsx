import {
  ChevronLeft,
  ChevronRight,
  Filter,
  MapPinned,
  PanelLeftClose,
  PanelLeftOpen,
  RotateCcw,
  Search,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { SiteDetailsPanel } from '../components/map/SiteDetailsPanel'
import { WetlandMap } from '../components/map/WetlandMap'
import { SITE_STATUS } from '../constants/status'
import { dashboardSites } from '../data/dashboard'
import { cn } from '../utils/cn'

const filters = [
  { id: 'all', label: 'All sites', activeClass: 'border-slate-700 bg-slate-800 text-white', dot: 'bg-slate-500' },
  { id: 'needs_review', label: 'Needs review', activeClass: 'border-amber-300 bg-amber-50 text-amber-800', dot: 'bg-amber-500' },
  { id: 'confirmed', label: 'Confirmed', activeClass: 'border-rose-300 bg-rose-50 text-rose-800', dot: 'bg-rose-500' },
  { id: 'inconclusive', label: 'Inconclusive', activeClass: 'border-slate-400 bg-slate-100 text-slate-800', dot: 'bg-slate-500' },
  { id: 'no_change', label: 'No change', activeClass: 'border-emerald-300 bg-emerald-50 text-emerald-800', dot: 'bg-emerald-500' },
  { id: 'insufficient_data', label: 'Insufficient data', activeClass: 'border-violet-300 bg-violet-50 text-violet-800', dot: 'bg-violet-500' },
]

function SiteDirectory({ sites, allSites, selectedId, query, status, onQueryChange, onStatusChange, onSelectSite }) {
  return (
    <aside className="flex min-h-0 flex-col border-b border-slate-200 bg-white lg:border-b-0 lg:border-r">
      <div className="border-b border-slate-100 p-4">
        <label className="relative block">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="search"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Search site or location"
            className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-xs text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-brand-400 focus:bg-white"
          />
        </label>

        <div className="mt-4 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400"><Filter size={13} className="text-slate-500" />Filter by status</div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {filters.map((filter) => {
            const count = filter.id === 'all' ? allSites.length : allSites.filter((site) => site.status === filter.id).length
            const active = status === filter.id
            return (
              <button
                key={filter.id}
                type="button"
                onClick={() => onStatusChange(filter.id)}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-[10px] font-semibold transition',
                  active ? filter.activeClass : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300',
                )}
              >
                <span className={cn('size-1.5 rounded-full', filter.dot)} />{filter.label}<span className="opacity-65">{count}</span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
        <div><h2 className="text-xs font-semibold text-slate-800">Site directory</h2><p className="mt-0.5 text-[10px] text-slate-400">{sites.length} of {allSites.length} sites visible</p></div>
        {(query || status !== 'all') && (
          <button type="button" onClick={() => { onQueryChange(''); onStatusChange('all') }} className="flex items-center gap-1 text-[10px] font-semibold text-brand-700">
            <RotateCcw size={12} className="text-slate-500" />Reset
          </button>
        )}
      </div>

      <div className="max-h-[340px] flex-1 divide-y divide-slate-100 overflow-y-auto lg:max-h-none">
        {sites.map((site) => {
          const active = selectedId === site.id
          const statusConfig = SITE_STATUS[site.status]
          const dot = filters.find((filter) => filter.id === site.status)?.dot
          return (
            <button
              key={site.id}
              type="button"
              onClick={() => onSelectSite(site.id)}
              className={cn('group flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-slate-50', active && 'bg-slate-50')}
            >
              <span className="relative size-11 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                <img src={site.image} alt="" className="size-full object-cover" />
                <span className={cn('absolute bottom-1 right-1 size-2.5 rounded-full border-2 border-white', dot)} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center justify-between gap-2"><span className="truncate text-xs font-semibold text-slate-800">{site.name}</span><span className="text-[10px] font-medium text-slate-500">{site.area}</span></span>
                <span className="mt-1 block truncate text-[10px] text-slate-400">{site.location} · {statusConfig.label}</span>
              </span>
              {active ? <ChevronRight size={15} className="text-slate-700" /> : <ChevronLeft size={15} className="rotate-180 text-slate-300 group-hover:text-slate-600" />}
            </button>
          )
        })}

        {!sites.length && (
          <div className="px-6 py-12 text-center"><Search size={22} className="mx-auto text-slate-400" /><p className="mt-3 text-xs font-semibold text-slate-700">No matching sites</p><p className="mt-1 text-[11px] leading-5 text-slate-400">Adjust the search or status filter to restore results.</p></div>
        )}
      </div>
    </aside>
  )
}

export function MapPage() {
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('all')
  const [selectedId, setSelectedId] = useState(null)
  const [directoryOpen, setDirectoryOpen] = useState(true)

  const visibleSites = useMemo(() => {
    const search = query.trim().toLowerCase()
    return dashboardSites.filter((site) => {
      const matchesStatus = status === 'all' || site.status === status
      const matchesSearch = !search || `${site.name} ${site.location}`.toLowerCase().includes(search)
      return matchesStatus && matchesSearch
    })
  }, [query, status])

  const selectedSite = visibleSites.find((site) => site.id === selectedId) ?? null
  const reviewCount = dashboardSites.filter((site) => site.status === 'needs_review').length
  const clearCount = dashboardSites.filter((site) => site.status === 'no_change').length

  return (
    <div className="animate-fade-in space-y-5 pb-8">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-700">Monitoring network</p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">Wetland map</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">Explore five illustrative monitoring sites, inspect their latest status, and open the connected site record.</p>
        </div>
        <button type="button" onClick={() => setDirectoryOpen((open) => !open)} className="inline-flex min-h-10 items-center justify-center gap-2 self-start rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 shadow-card transition hover:border-slate-300 hover:bg-slate-50 sm:self-auto">
          {directoryOpen ? <PanelLeftClose size={16} className="text-slate-500" /> : <PanelLeftOpen size={16} className="text-slate-500" />}
          {directoryOpen ? 'Hide directory' : 'Show directory'}
        </button>
      </header>

      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-y border-slate-200 py-3 text-xs text-slate-500">
        <span className="flex items-center gap-2"><MapPinned size={15} className="text-slate-500" /><strong className="font-semibold text-slate-800">{dashboardSites.length}</strong> monitored sites</span>
        <span><strong className="font-semibold text-slate-800">{reviewCount}</strong> need review</span>
        <span><strong className="font-semibold text-slate-800">{clearCount}</strong> show no material change</span>
        <span className="ml-auto text-[10px] text-slate-400">Illustrative prototype data</span>
      </div>

      <section className={cn('overflow-hidden rounded-xl border border-slate-200 bg-white shadow-card', directoryOpen && 'lg:grid lg:grid-cols-[340px_minmax(0,1fr)]')}>
        {directoryOpen && (
          <SiteDirectory
            sites={visibleSites}
            allSites={dashboardSites}
            selectedId={selectedSite?.id}
            query={query}
            status={status}
            onQueryChange={setQuery}
            onStatusChange={setStatus}
            onSelectSite={setSelectedId}
          />
        )}

        <div className="relative min-w-0">
          <WetlandMap sites={visibleSites} selectedSite={selectedSite} onSelectSite={setSelectedId} />
          {selectedSite && (
            <div className="absolute right-14 top-4 z-[500] hidden w-[310px] xl:block">
              <SiteDetailsPanel site={selectedSite} onClose={() => setSelectedId(null)} />
            </div>
          )}
          {!selectedSite && visibleSites.length > 0 && (
            <div className="pointer-events-none absolute left-1/2 top-4 z-[500] -translate-x-1/2 rounded-lg border border-white/80 bg-white/95 px-3 py-2 text-center text-[10px] font-medium text-slate-600 shadow-card backdrop-blur">
              Select a marker or directory item to inspect a site
            </div>
          )}
        </div>

        {selectedSite && (
          <div className="xl:hidden">
            <SiteDetailsPanel site={selectedSite} onClose={() => setSelectedId(null)} compact />
          </div>
        )}
      </section>

      <p className="text-[10px] leading-5 text-slate-400">Map locations and measurements are illustrative. Street tiles are provided by OpenStreetMap; satellite tiles are provided by Esri and their listed data partners.</p>
    </div>
  )
}

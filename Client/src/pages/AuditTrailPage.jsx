import { Download, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { PageHeader } from '../components/ui/PageHeader'
import { SummaryStrip } from '../components/ui/SummaryStrip'
import { useApp } from '../hooks/useApp'
import { AUDIT_MODULES, buildAuditEvents, formatAuditTime } from '../utils/audit'
import { downloadCsv } from '../utils/csv'
import { toDateKey, todayKey } from '../utils/schedule'

const PAGE_SIZE = 50
const selectClass = 'h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-700 outline-none focus:border-brand-400'

export function AuditTrailPage() {
  const { sites, tasks, decisions, expenses, meetings, notificationLogs } = useApp()
  const [moduleFilter, setModuleFilter] = useState('All')
  const [actor, setActor] = useState('All')
  const [search, setSearch] = useState('')
  const [limit, setLimit] = useState(PAGE_SIZE)

  const events = useMemo(
    () => buildAuditEvents({ tasks, decisions, expenses, meetings, notificationLogs, sites }),
    [decisions, expenses, meetings, notificationLogs, sites, tasks],
  )
  const actors = useMemo(() => [...new Set(events.map((event) => event.actor).filter(Boolean))].sort(), [events])
  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    return events.filter((event) => (moduleFilter === 'All' || event.module === moduleFilter)
      && (actor === 'All' || event.actor === actor)
      && (!term || `${event.record} ${event.event} ${event.actor}`.toLowerCase().includes(term)))
  }, [actor, events, moduleFilter, search])

  const today = todayKey()
  const todayCount = events.filter((event) => toDateKey(new Date(event.at)) === today).length
  const people = new Set(events.filter((event) => event.actor && !event.actor.endsWith('module') && event.actor !== 'System').map((event) => event.actor)).size

  function exportTrail() {
    downloadCsv(`terralink-audit-trail-${today}.csv`, [
      ['Time', 'Module', 'Record', 'Event', 'Actor'],
      ...filtered.map((event) => [event.at, event.module, event.record, event.event, event.actor]),
    ])
  }

  function resetLimit(setter) {
    return (event) => {
      setter(event.target.value)
      setLimit(PAGE_SIZE)
    }
  }

  return (
    <div className="animate-fade-in space-y-5 pb-8">
      <PageHeader
        eyebrow="Administration"
        title="Audit trail"
        description="A chronological record of task changes, review decisions, expenses, meetings, and communications across every module."
        actions={<Button type="button" variant="secondary" onClick={exportTrail}><Download size={15} />Export CSV</Button>}
      />

      <SummaryStrip
        items={[
          { label: 'recorded events', value: events.length },
          { label: 'today', value: todayCount },
          { label: 'people involved', value: people },
          { label: 'modules tracked', value: AUDIT_MODULES.length },
        ]}
        note="Records are read-only"
      />

      <div className="flex flex-wrap items-center gap-3">
        <label className="relative min-w-[220px] flex-1 sm:max-w-xs">
          <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={resetLimit(setSearch)} placeholder="Search record or event" aria-label="Search audit trail" className={`${selectClass} w-full pl-9`} />
        </label>
        <select value={moduleFilter} onChange={resetLimit(setModuleFilter)} aria-label="Module" className={selectClass}>
          <option value="All">All modules</option>
          {AUDIT_MODULES.map((item) => <option key={item}>{item}</option>)}
        </select>
        <select value={actor} onChange={resetLimit(setActor)} aria-label="Actor" className={selectClass}>
          <option value="All">All actors</option>
          {actors.map((item) => <option key={item}>{item}</option>)}
        </select>
        <p className="ml-auto text-xs text-slate-500"><strong className="font-semibold text-slate-800">{filtered.length}</strong> matching events</p>
      </div>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-left text-xs">
            <thead className="border-b border-slate-100 bg-slate-50/70 text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">
              <tr><th className="px-5 py-3">Time</th><th className="px-3 py-3">Module</th><th className="px-3 py-3">Record</th><th className="px-3 py-3">Event</th><th className="px-5 py-3">Actor</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.slice(0, limit).map((event) => (
                <tr key={event.id} className="align-top hover:bg-slate-50/60">
                  <td className="whitespace-nowrap px-5 py-3 tabular-nums text-slate-500">{formatAuditTime(event)}</td>
                  <td className="px-3 py-3"><span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">{event.module}</span></td>
                  <td className="whitespace-nowrap px-3 py-3"><Link to={event.to} className="font-semibold text-slate-800 hover:text-brand-700">{event.record}</Link></td>
                  <td className="px-3 py-3 leading-5 text-slate-600">{event.event}</td>
                  <td className="whitespace-nowrap px-5 py-3 text-slate-600">{event.actor}</td>
                </tr>
              ))}
              {!filtered.length && <tr><td colSpan={5} className="px-5 py-10 text-center text-xs text-slate-500">No events match the current filters.</td></tr>}
            </tbody>
          </table>
        </div>
        {filtered.length > limit && (
          <div className="border-t border-slate-100 px-5 py-3 text-center">
            <button type="button" onClick={() => setLimit((value) => value + PAGE_SIZE)} className="text-xs font-semibold text-brand-700 hover:text-brand-900">Show {Math.min(PAGE_SIZE, filtered.length - limit)} more</button>
          </div>
        )}
      </section>
    </div>
  )
}

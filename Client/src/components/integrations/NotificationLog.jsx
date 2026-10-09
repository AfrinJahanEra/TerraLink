import { ExternalLink, Inbox, Search, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { openWhatsApp } from '../../services/whatsapp'
import { cn } from '../../utils/cn'
import { formatLogTimestamp, getLogRecord, LOG_STATUS_STYLES } from '../../utils/communications'

const selectClass = 'h-9 rounded-lg border border-slate-200 bg-white px-3 text-[11px] font-medium text-slate-600 outline-none focus:border-brand-400'

export function NotificationLog({ logs, onMarkOpened, onClear }) {
  const [channel, setChannel] = useState('All')
  const [source, setSource] = useState('All')
  const [status, setStatus] = useState('All')
  const [search, setSearch] = useState('')
  const sources = useMemo(() => [...new Set(logs.map((log) => log.source || 'System'))].sort(), [logs])

  const filteredLogs = useMemo(() => {
    const query = search.trim().toLowerCase()
    return logs.filter((log) => (channel === 'All' || log.channel === channel)
      && (source === 'All' || (log.source || 'System') === source)
      && (status === 'All' || log.status === status)
      && (!query || `${log.recipient} ${log.message} ${log.taskId} ${log.meetingId}`.toLowerCase().includes(query)))
  }, [channel, logs, search, source, status])

  function openAction(log) {
    if (log.channel === 'WhatsApp') openWhatsApp(log.actionUrl)
    else window.open(log.actionUrl, '_blank', 'noopener,noreferrer')
    onMarkOpened(log.id)
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white shadow-card">
      <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 xl:flex-row xl:items-center xl:justify-between">
        <div><h2 className="text-sm font-semibold text-slate-900">Outbox</h2><p className="mt-0.5 text-xs text-slate-400">{filteredLogs.length} of {logs.length} messages, calendar events, and prepared reminders</p></div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="relative"><Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search recipient or record" aria-label="Search communications" className="h-9 w-52 rounded-lg border border-slate-200 pl-8 pr-3 text-[11px] text-slate-700 outline-none focus:border-brand-400" /></label>
          <select value={source} onChange={(event) => setSource(event.target.value)} aria-label="Filter by module" className={selectClass}><option value="All">All modules</option>{sources.map((item) => <option key={item}>{item}</option>)}</select>
          <select value={channel} onChange={(event) => setChannel(event.target.value)} aria-label="Filter by channel" className={selectClass}><option value="All">All channels</option><option>Email</option><option>Calendar</option><option>WhatsApp</option></select>
          <select value={status} onChange={(event) => setStatus(event.target.value)} aria-label="Filter by status" className={selectClass}><option value="All">All statuses</option><option>Sent</option><option>Opened</option><option>Failed</option></select>
          {onClear && !!logs.length && <button type="button" onClick={onClear} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 px-3 text-[11px] font-semibold text-slate-600 hover:bg-slate-50"><Trash2 size={13} />Clear</button>}
        </div>
      </div>

      {filteredLogs.length ? (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px] text-left">
            <thead className="bg-slate-50/70 text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400"><tr><th className="px-5 py-3">Time</th><th className="px-3 py-3">Module</th><th className="px-3 py-3">Recipient</th><th className="px-3 py-3">Channel</th><th className="px-3 py-3">Message</th><th className="px-3 py-3">Status</th><th className="px-5 py-3 text-right">Action</th></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.map((log) => {
                const record = getLogRecord(log)
                return (
                  <tr key={log.id} className="align-top text-xs">
                    <td className="whitespace-nowrap px-5 py-3.5 text-slate-400">{formatLogTimestamp(log.createdAt)}</td>
                    <td className="whitespace-nowrap px-3 py-3.5"><p className="font-semibold text-slate-700">{log.source || 'System'}</p>{record && <Link to={record.to} className="mt-0.5 inline-block text-[10px] font-semibold text-brand-700 hover:text-brand-900">{record.label}</Link>}</td>
                    <td className="max-w-[180px] px-3 py-3.5 text-slate-600"><span className="line-clamp-2">{log.recipient}</span></td>
                    <td className="px-3 py-3.5 font-semibold text-slate-700">{log.channel}</td>
                    <td className="max-w-[320px] px-3 py-3.5"><p className="line-clamp-2 whitespace-pre-line text-slate-700">{log.message}</p>{log.detail && <p className={cn('mt-1 text-[10px] leading-4', log.status === 'Failed' ? 'text-rose-600' : 'text-slate-400')}>{log.detail}</p>}</td>
                    <td className="px-3 py-3.5"><span className={cn('rounded-full px-2 py-1 text-[10px] font-semibold', LOG_STATUS_STYLES[log.status] ?? LOG_STATUS_STYLES.Failed)}>{log.status}</span></td>
                    <td className="px-5 py-3.5"><div className="flex justify-end">{log.actionUrl && log.channel !== 'Email' && <button type="button" onClick={() => openAction(log)} className="inline-flex h-8 items-center gap-1 rounded-lg border border-slate-200 px-2 text-[10px] font-semibold text-slate-600 hover:bg-slate-50"><ExternalLink size={12} />Open</button>}</div></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid place-items-center px-6 py-14 text-center"><Inbox size={25} className="text-slate-400" /><p className="mt-3 text-sm font-semibold text-slate-700">{logs.length ? 'No matching communications' : 'No communications yet'}</p><p className="mt-1 text-xs text-slate-400">{logs.length ? 'Adjust the filters to see more records.' : 'Calendar, email, and WhatsApp actions from tasks, meetings, reports, and finance appear here.'}</p></div>
      )}
    </section>
  )
}

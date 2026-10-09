import { CalendarPlus, ExternalLink, Inbox, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { downloadDeadlineIcs } from '../../services/calendar'
import { openWhatsApp } from '../../services/whatsapp'
import { cn } from '../../utils/cn'

const statusStyles = {
  Sent: 'bg-emerald-50 text-emerald-700',
  Opened: 'bg-sky-50 text-sky-700',
  Failed: 'bg-rose-50 text-rose-700',
}

function formatTimestamp(value) {
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
  }).format(new Date(value))
}

export function NotificationLog({ logs, tasks, onMarkOpened, onClear }) {
  const [channel, setChannel] = useState('All')
  const filteredLogs = useMemo(
    () => channel === 'All' ? logs : logs.filter((log) => log.channel === channel),
    [channel, logs],
  )

  function openAction(log) {
    if (log.channel === 'WhatsApp') openWhatsApp(log.actionUrl)
    else window.open(log.actionUrl, '_blank', 'noopener,noreferrer')
    onMarkOpened(log.id)
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white shadow-card">
      <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div><h2 className="text-sm font-semibold text-slate-900">Notification log</h2><p className="mt-0.5 text-xs text-slate-400">Delivery attempts and prepared actions from this browser.</p></div>
        <div className="flex items-center gap-2">
          <select value={channel} onChange={(event) => setChannel(event.target.value)} aria-label="Filter notification channel" className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-[11px] font-medium text-slate-600 outline-none">
            <option>All</option><option>Email</option><option>Calendar</option><option>WhatsApp</option>
          </select>
          {!!logs.length && <button type="button" onClick={onClear} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 px-3 text-[11px] font-semibold text-slate-600 hover:bg-slate-50"><Trash2 size={13} />Clear</button>}
        </div>
      </div>

      {filteredLogs.length ? (
        <div className="overflow-x-auto">
          <table className="min-w-[860px] w-full text-left">
            <thead className="bg-slate-50/70 text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400"><tr><th className="px-5 py-3">Time</th><th className="px-3 py-3">Recipient</th><th className="px-3 py-3">Channel</th><th className="px-3 py-3">Message</th><th className="px-3 py-3">Status</th><th className="px-5 py-3 text-right">Action</th></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.map((log) => {
                const task = tasks.find((item) => item.id === log.taskId)
                return (
                  <tr key={log.id} className="align-top text-xs">
                    <td className="whitespace-nowrap px-5 py-3.5 text-slate-400">{formatTimestamp(log.createdAt)}</td>
                    <td className="max-w-[180px] px-3 py-3.5 text-slate-600"><span className="line-clamp-2">{log.recipient}</span></td>
                    <td className="px-3 py-3.5 font-semibold text-slate-700">{log.channel}</td>
                    <td className="max-w-[320px] px-3 py-3.5"><p className="line-clamp-2 whitespace-pre-line text-slate-700">{log.message}</p>{log.detail && <p className={cn('mt-1 text-[10px] leading-4', log.status === 'Failed' ? 'text-rose-600' : 'text-slate-400')}>{log.detail}</p>}</td>
                    <td className="px-3 py-3.5"><span className={cn('rounded-full px-2 py-1 text-[10px] font-semibold', statusStyles[log.status] ?? statusStyles.Failed)}>{log.status}</span></td>
                    <td className="px-5 py-3.5"><div className="flex justify-end gap-1.5">{log.actionUrl && log.channel !== 'Email' && <button type="button" onClick={() => openAction(log)} className="inline-flex h-8 items-center gap-1 rounded-lg border border-slate-200 px-2 text-[10px] font-semibold text-slate-600 hover:bg-slate-50"><ExternalLink size={12} />Open</button>}{log.channel === 'Calendar' && task && <button type="button" onClick={() => downloadDeadlineIcs(task)} className="inline-flex h-8 items-center gap-1 rounded-lg border border-slate-200 px-2 text-[10px] font-semibold text-slate-600 hover:bg-slate-50"><CalendarPlus size={12} />.ics</button>}</div></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid place-items-center px-6 py-14 text-center"><Inbox size={25} className="text-slate-400" /><p className="mt-3 text-sm font-semibold text-slate-700">No notifications yet</p><p className="mt-1 text-xs text-slate-400">Send a test or trigger an enabled workflow rule.</p></div>
      )}
    </section>
  )
}

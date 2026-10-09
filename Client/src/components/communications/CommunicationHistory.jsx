import { CalendarDays, Mail, MessageCircle, Radio } from 'lucide-react'
import { cn } from '../../utils/cn'
import { formatLogTimestamp, LOG_STATUS_STYLES } from '../../utils/communications'

const channelIcons = { Email: Mail, Calendar: CalendarDays, WhatsApp: MessageCircle }

export function CommunicationHistory({ logs, emptyText = 'No calendar events, emails, or reminders yet.', limit = 6 }) {
  const visible = logs.slice(0, limit)

  if (!visible.length) return <p className="py-3 text-[11px] text-slate-400">{emptyText}</p>

  return (
    <ul className="divide-y divide-slate-100">
      {visible.map((log) => {
        const Icon = channelIcons[log.channel] ?? Radio
        return (
          <li key={log.id} className="flex items-start gap-3 py-2.5">
            <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-md bg-slate-100 text-slate-500"><Icon size={13} /></span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium text-slate-700">{log.message || `${log.channel} action`}</p>
              <p className="mt-0.5 truncate text-[10px] text-slate-400">{log.recipient} · {formatLogTimestamp(log.createdAt)}</p>
              {log.status === 'Failed' && log.detail && <p className="mt-1 text-[10px] leading-4 text-rose-600">{log.detail}</p>}
            </div>
            <span className={cn('shrink-0 rounded-full px-2 py-0.5 text-[9px] font-semibold', LOG_STATUS_STYLES[log.status] ?? LOG_STATUS_STYLES.Failed)}>{log.status}</span>
          </li>
        )
      })}
    </ul>
  )
}

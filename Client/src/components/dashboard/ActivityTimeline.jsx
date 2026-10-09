import { BellRing, Check, CheckCheck, FileText, MessageSquareText, ReceiptText } from 'lucide-react'
import { cn } from '../../utils/cn'

const activityIcons = {
  complete: CheckCheck,
  expense: ReceiptText,
  comment: MessageSquareText,
  notification: BellRing,
  report: FileText,
}

export function ActivityTimeline({ activities, expanded, onToggle, onMarkAll }) {
  const visible = expanded ? activities : activities.slice(0, 4)
  const unread = activities.filter((activity) => activity.unread).length

  return (
    <section className="rounded-xl border border-slate-200 bg-white shadow-card">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
        <div><h2 className="text-sm font-semibold text-slate-900">Recent activity</h2><p className="mt-0.5 text-xs text-slate-400">Updates across your workspace</p></div>
        <button type="button" onClick={onMarkAll} disabled={!unread} className="flex items-center gap-1 text-xs font-semibold text-brand-700 disabled:text-slate-300"><Check size={14} className="text-slate-500" /> Mark reviewed</button>
      </div>
      <div className="px-5 py-1">
        {visible.map((activity, index) => {
          const Icon = activityIcons[activity.type]
          return (
            <div key={activity.id} className="relative flex gap-3 py-3.5">
              {index < visible.length - 1 && <span className="absolute left-[15px] top-10 h-[calc(100%-22px)] w-px bg-slate-100" />}
              <span className={cn('relative grid size-8 shrink-0 place-items-center rounded-full text-slate-600', activity.unread ? 'bg-slate-200' : 'bg-slate-100')}><Icon size={14} /></span>
              <div className="min-w-0 flex-1"><div className="flex items-center gap-2"><p className="truncate text-xs font-semibold text-slate-800">{activity.title}</p>{activity.unread && <span className="size-1.5 shrink-0 rounded-full bg-brand-500" />}</div><p className="mt-1 text-[11px] leading-4 text-slate-500">{activity.detail}</p><p className="mt-1 text-[10px] text-slate-400">{activity.time}</p></div>
            </div>
          )
        })}
      </div>
      {activities.length > 4 && <button type="button" onClick={onToggle} className="w-full border-t border-slate-100 py-3 text-xs font-semibold text-brand-700 hover:bg-slate-50">{expanded ? 'Show less' : 'Show all activity'}</button>}
    </section>
  )
}

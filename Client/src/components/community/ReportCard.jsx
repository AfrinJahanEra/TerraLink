import { CalendarDays, MapPin } from 'lucide-react'
import { REPORT_CATEGORIES, REPORT_STATUS } from '../../constants/reports'
import { cn } from '../../utils/cn'
import { formatShortDate } from '../../utils/reports'
import { Badge } from '../ui/Badge'
import { PhotoImage } from './PhotoImage'

export function ReportThumb({ report, className = 'size-16' }) {
  const Icon = REPORT_CATEGORIES[report.category].icon
  return (
    <span className={cn('relative block shrink-0 overflow-hidden rounded-lg bg-slate-100', className)}>
      {report.photos[0]
        ? <PhotoImage photoId={report.photos[0].id} alt={`Evidence for ${report.id}`} />
        : <span className="grid size-full place-items-center text-slate-400" title="Sample record without a photo"><Icon size={18} /></span>}
    </span>
  )
}

export function ReportCard({ report, siteName, active = false, onSelect }) {
  const category = REPORT_CATEGORIES[report.category]
  const status = REPORT_STATUS[report.status]
  return (
    <button
      type="button"
      onClick={() => onSelect(report.id)}
      className={cn('flex w-full items-start gap-3 px-4 py-3.5 text-left transition hover:bg-slate-50', active && 'bg-slate-50')}
    >
      <ReportThumb report={report} />
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-slate-800">{category.label}</span>
          <Badge tone={status.tone} className="px-2 py-0.5 text-[10px]">{status.label}</Badge>
          {report.resolved && <Badge tone="brandDeep" className="px-2 py-0.5 text-[10px]">Resolved</Badge>}
        </span>
        <span className="mt-1 line-clamp-2 block text-[11px] leading-5 text-slate-500">{report.description}</span>
        <span className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-slate-400">
          <span className="font-semibold text-slate-500">{report.id}</span>
          <span className="inline-flex items-center gap-1"><MapPin size={11} />{siteName ?? 'Other location'}</span>
          <span className="inline-flex items-center gap-1"><CalendarDays size={11} />{formatShortDate(report.observedAt)}</span>
          {report.sample && <span>Sample record</span>}
        </span>
      </span>
    </button>
  )
}

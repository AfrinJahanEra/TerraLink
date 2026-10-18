import { CalendarDays, ClipboardCheck, MapPin, UserRound } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useState } from 'react'
import { TASK_RESOLUTION } from '../../constants/actions'
import { REPORT_CATEGORIES, REPORT_STATUS } from '../../constants/reports'
import { TASK_STATUS } from '../../constants/status'
import { formatCoordinates, formatDateTime, formatShortDate } from '../../utils/reports'
import { Badge } from '../ui/Badge'
import { Lightbox } from './Lightbox'
import { PhotoImage } from './PhotoImage'
import { ReportProgress } from './ReportProgress'
import { WasteAnalysis } from './WasteAnalysis'

/** Full record of one report. `showPrivate` adds reporter contact details, for reviewers only. Children render below the record (review actions). */
export function ReportDetail({ report, siteName, showPrivate = false, ownReport = false, children }) {
  const [lightbox, setLightbox] = useState('')
  const category = REPORT_CATEGORIES[report.category]
  const status = REPORT_STATUS[report.status]
  // Public viewers see 'Reporter' instead of the reporter's name; reviewers and the reporter see the name.
  const actorName = (name) => (showPrivate || ownReport || name !== report.reporter.name ? name : 'Reporter')

  return (
    <article>
      <div className="flex items-start justify-between gap-3">
        <div><p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">{report.id}</p><h3 className="mt-1 text-base font-semibold text-slate-900">{category.label}</h3></div>
        <Badge tone={status.tone}>{status.label}</Badge>
      </div>

      {ownReport && <div className="mt-4 rounded-lg bg-slate-50 px-3 py-3"><ReportProgress report={report} /></div>}

      {report.photos.length ? (
        <div className="mt-4 grid grid-cols-3 gap-2">
          {report.photos.map((photo, index) => (
            <div key={photo.id} className="aspect-[4/3] overflow-hidden rounded-lg bg-slate-100">
              <PhotoImage photoId={photo.id} alt={`Evidence photo ${index + 1} for ${report.id}`} onClick={setLightbox} />
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-4 rounded-lg border border-dashed border-slate-200 bg-slate-50 px-3 py-4 text-center text-[11px] text-slate-500">This is a sample record, so no photo is attached.</p>
      )}

      {report.aiAnalysis?.hasWaste && <WasteAnalysis report={report} siteName={siteName} onOpenPhoto={setLightbox} />}

      <p className="mt-4 text-sm leading-6 text-slate-700">{report.description}</p>

      <dl className="mt-4 space-y-2.5 border-y border-slate-100 py-4 text-xs">
        <div className="flex items-start gap-2.5"><MapPin size={14} className="mt-0.5 shrink-0 text-slate-500" /><div><dt className="sr-only">Location</dt><dd className="text-slate-700">{siteName ?? 'Other location, outside the five monitored water bodies'}<span className="block text-[10px] text-slate-400">{formatCoordinates(report)}</span></dd></div></div>
        <div className="flex items-start gap-2.5"><CalendarDays size={14} className="mt-0.5 shrink-0 text-slate-500" /><div><dt className="sr-only">Dates</dt><dd className="text-slate-700">Observed {formatShortDate(report.observedAt)}<span className="block text-[10px] text-slate-400">Submitted {formatDateTime(report.createdAt)}</span></dd></div></div>
        {showPrivate && <div className="flex items-start gap-2.5"><UserRound size={14} className="mt-0.5 shrink-0 text-slate-500" /><div><dt className="sr-only">Reporter</dt><dd className="text-slate-700">{report.reporter.name || 'Anonymous'}<span className="block text-[10px] text-slate-400">{[report.reporter.email, report.reporter.contact].filter(Boolean).join(' · ') || 'No contact provided'}</span></dd></div></div>}
      </dl>

      <section aria-label="Review history" className="mt-4">
        <h4 className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">Review history</h4>
        <ol className="mt-3 space-y-3 border-l border-slate-200 pl-4">
          {report.history.map((entry) => (
            <li key={entry.id} className="relative">
              <span className="absolute -left-[21px] top-1 size-2.5 rounded-full border-2 border-white" style={{ backgroundColor: REPORT_STATUS[entry.status].color }} />
              <p className="text-xs font-semibold text-slate-700">{REPORT_STATUS[entry.status].label}<span className="font-normal text-slate-400"> · {actorName(entry.by)} · {formatDateTime(entry.at)}</span></p>
              {entry.note && <p className="mt-0.5 text-[11px] leading-5 text-slate-500">{entry.note}</p>}
            </li>
          ))}
        </ol>
      </section>

      {report.tasks?.length > 0 && (
        <section aria-label="Action taken" className="mt-5">
          <h4 className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">Action taken</h4>
          <ul className="mt-3 space-y-2">
            {report.tasks.map((task) => (
              <li key={task.id} className="flex items-start gap-3 rounded-lg bg-slate-50 px-3 py-2.5">
                <ClipboardCheck size={15} className="mt-0.5 shrink-0 text-slate-500" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-slate-800">{showPrivate ? <Link to={`/tasks?task=${task.id}`} className="hover:text-brand-700">{task.id} · {task.title}</Link> : task.title}</p>
                  <p className="mt-0.5 text-[10px] text-slate-500">{TASK_STATUS[task.status].label}{task.resolution ? ` · ${TASK_RESOLUTION[task.resolution.outcome].label}` : ''}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {children}
      {lightbox && <Lightbox url={lightbox} onClose={() => setLightbox('')} />}
    </article>
  )
}

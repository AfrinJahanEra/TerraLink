import { Camera } from 'lucide-react'
import { useState } from 'react'
import { REPORT_CATEGORIES } from '../../constants/reports'
import { formatDateTime, formatShortDate } from '../../utils/reports'
import { Lightbox } from '../community/Lightbox'
import { PhotoImage } from '../community/PhotoImage'

function Gallery({ photos, alt, onOpen, emptyText }) {
  if (!photos.length) return <p className="grid min-h-28 place-items-center rounded-lg border border-dashed border-slate-200 bg-slate-50 px-3 text-center text-[11px] leading-5 text-slate-400">{emptyText}</p>
  return (
    <div className="grid grid-cols-2 gap-2">
      {photos.map((photo, index) => <div key={photo.id} className="aspect-square overflow-hidden rounded-lg bg-slate-100"><PhotoImage photoId={photo.id} alt={`${alt} ${index + 1}`} onClick={onOpen} /></div>)}
    </div>
  )
}

/**
 * The report photos (see `beforeReportFor`) next to the latest completion photos, so a reviewer sees what changed.
 * Before anything is submitted it shows only the problem photo, which is what the field team needs.
 * `detailed` adds earlier submissions for the manager.
 */
export function TaskEvidence({ task, report, detailed = false }) {
  const [lightbox, setLightbox] = useState('')
  const submissions = task.submissions ?? []
  const latest = submissions[submissions.length - 1] ?? null
  const reportPhotos = report?.photos ?? []
  if (!latest && !reportPhotos.length) return null
  const shown = detailed ? submissions.slice().reverse() : latest ? [latest] : []
  // A task from a site review has no report of its own; the lake's latest report photo stands in as the "before".
  const borrowed = report && report.id !== task.reportId
  const reportCaption = report && `${report.id} · ${REPORT_CATEGORIES[report.category]?.label ?? 'Report'} · seen ${formatShortDate(report.observedAt)}${borrowed ? ' · latest report on this lake' : ''}`

  return (
    <section className="mt-5 border-t border-slate-100 pt-5" aria-label="Evidence">
      <h3 className="flex items-center gap-2 text-xs font-semibold text-slate-800"><Camera size={15} className="text-slate-500" />{latest ? 'Before and after' : 'Problem photo'}</h3>
      {latest ? (
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">Before</p>
            <div className="mt-2"><Gallery photos={reportPhotos} alt="Report photo" onOpen={setLightbox} emptyText={report ? 'The report has no photo.' : 'No report with a photo exists for this lake yet.'} /></div>
            {reportCaption && <p className="mt-2 text-[10px] leading-4 text-slate-400">{reportCaption}</p>}
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">After</p>
            <div className="mt-2"><Gallery photos={latest.photos} alt="Completion photo" onOpen={setLightbox} emptyText="No completion photos." /></div>
            <p className="mt-2 text-[10px] leading-4 text-slate-400">Finished {formatShortDate(latest.completedOn)} · {latest.submittedBy}</p>
          </div>
        </div>
      ) : (
        <div className="mt-3 max-w-sm">
          <Gallery photos={reportPhotos} alt="Report photo" onOpen={setLightbox} />
          <p className="mt-2 text-[10px] leading-4 text-slate-400">{reportCaption}</p>
        </div>
      )}

      {shown.length > 0 && (
        <ol className="mt-4 space-y-2.5">
          {shown.map((item, index) => (
            <li key={item.id} className="rounded-lg bg-slate-50 px-3 py-2.5">
              <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">{index === 0 ? 'What was done' : 'Earlier submission'} · {formatDateTime(item.submittedAt)}</p>
              <p className="mt-1.5 text-xs leading-5 text-slate-700">{item.summary}</p>
              {item.followUp && <p className="mt-1.5 text-[11px] leading-5 text-slate-500"><strong className="font-semibold text-slate-600">Still to do:</strong> {item.followUp}</p>}
              {detailed && item.expensesStatus !== 'recorded' && <p className="mt-1.5 text-[10px] text-amber-700">More expenses to come</p>}
            </li>
          ))}
        </ol>
      )}
      {lightbox && <Lightbox url={lightbox} onClose={() => setLightbox('')} />}
    </section>
  )
}

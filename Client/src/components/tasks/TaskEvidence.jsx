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

/** The original report photos next to the latest completion photos, so a reviewer sees what changed. */
export function TaskEvidence({ task, report }) {
  const [lightbox, setLightbox] = useState('')
  const submissions = task.submissions ?? []
  const latest = submissions[submissions.length - 1] ?? null

  return (
    <section className="mt-6 border-t border-slate-100 pt-5" aria-label="Evidence">
      <h3 className="flex items-center gap-2 text-xs font-semibold text-slate-800"><Camera size={15} className="text-slate-500" />Before and after</h3>
      <div className="mt-3 grid gap-4 sm:grid-cols-2">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">Before · original report</p>
          <div className="mt-2"><Gallery photos={report?.photos ?? []} alt="Original report evidence" onOpen={setLightbox} emptyText={report ? 'The linked report is a sample record without a photo.' : 'No report is linked to this task.'} /></div>
          {report && <p className="mt-2 text-[10px] leading-4 text-slate-400">{report.id} · {REPORT_CATEGORIES[report.category].label} · observed {formatShortDate(report.observedAt)}</p>}
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">After · completion evidence</p>
          <div className="mt-2"><Gallery photos={latest?.photos ?? []} alt="Completion evidence" onOpen={setLightbox} emptyText="No completion evidence has been submitted yet." /></div>
          {latest && <p className="mt-2 text-[10px] leading-4 text-slate-400">Submitted by {latest.submittedBy} · {formatDateTime(latest.submittedAt)} · work finished {formatShortDate(latest.completedOn)}</p>}
        </div>
      </div>

      {submissions.length > 0 && (
        <ol className="mt-4 space-y-2.5">
          {submissions.slice().reverse().map((item, index) => (
            <li key={item.id} className="rounded-lg bg-slate-50 px-3 py-2.5">
              <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">{index === 0 ? 'Latest submission' : 'Earlier submission'} · {item.submittedBy} · {formatDateTime(item.submittedAt)}</p>
              <p className="mt-1.5 text-xs leading-5 text-slate-700">{item.summary}</p>
              {item.followUp && <p className="mt-1.5 text-[11px] leading-5 text-slate-500"><strong className="font-semibold text-slate-600">Follow-up suggested:</strong> {item.followUp}</p>}
              <p className="mt-1.5 text-[10px] text-slate-400">{item.expensesStatus === 'recorded' ? 'All expenses recorded' : 'More expenses to come'}</p>
            </li>
          ))}
        </ol>
      )}
      {lightbox && <Lightbox url={lightbox} onClose={() => setLightbox('')} />}
    </section>
  )
}

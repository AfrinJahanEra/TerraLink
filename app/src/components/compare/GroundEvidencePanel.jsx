import { CircleCheck, Download, Droplets, Gauge, ImageOff, Info, Lightbulb, LoaderCircle, ScanSearch, TriangleAlert } from 'lucide-react'
import { useState } from 'react'
import { VERDICT } from '../../constants/observations'
import { referenceCredit } from '../../data/referencePhotos'
import { usePhoto } from '../../hooks/usePhoto'
import { SEVERITY } from '../../services/wasteDetection'
import { cn } from '../../utils/cn'
import { formatSignedHa } from '../../utils/observations'
import { formatShortDate } from '../../utils/reports'
import { Lightbox } from '../community/Lightbox'
import { Button } from '../ui/Button'

const POINT_STYLE = {
  ok: { icon: CircleCheck, className: 'bg-green-50 text-green-600' },
  warn: { icon: TriangleAlert, className: 'bg-amber-50 text-amber-600' },
  info: { icon: Info, className: 'bg-slate-100 text-slate-500' },
}

function Frame({ label, tone, url, alt, caption, empty, onOpen }) {
  return (
    <figure className="min-w-0">
      <div className={cn('group relative aspect-[4/3] overflow-hidden rounded-xl bg-slate-950 ring-2', tone === 'after' ? 'ring-green-500' : 'ring-slate-200')}>
        {url
          ? <button type="button" onClick={() => onOpen(url)} className="block size-full" aria-label={`Open ${alt}`}><img src={url} alt={alt} className="size-full object-cover transition duration-500 group-hover:scale-[1.03]" /></button>
          : <div className="grid size-full place-items-center bg-slate-100 px-6 text-center text-[11px] text-slate-500"><span className="flex flex-col items-center gap-1.5"><ImageOff size={18} />{empty}</span></div>}
        <span className={cn('pointer-events-none absolute left-2.5 top-2.5 rounded-md px-2 py-1 text-[10px] font-bold tracking-wide text-white shadow', tone === 'after' ? 'bg-green-600' : 'bg-slate-900/80')}>{label}</span>
        <span className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-slate-950/60 to-transparent" />
      </div>
      <figcaption className="mt-2 text-[11px] leading-4 text-slate-500">{caption}</figcaption>
    </figure>
  )
}

function Tile({ icon: Icon, label, value, detail, tone }) {
  return (
    <div className="rounded-xl bg-white/10 px-4 py-3 ring-1 ring-white/15 backdrop-blur-sm">
      <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.1em] text-brand-100"><Icon size={12} />{label}</p>
      <p className={cn('mt-1 text-lg font-bold tracking-tight', tone === 'warn' ? 'text-amber-300' : tone === 'good' ? 'text-green-300' : 'text-white')}>{value}</p>
      <p className="truncate text-[10px] text-brand-100/80">{detail}</p>
    </div>
  )
}

/** Plain-language summary, a clean "before" photo next to the AI-marked waste photo, and the site PDF. */
export function GroundEvidencePanel({ site, earlier, result, report }) {
  const { wasteReports, wasteReport, reference, summary, pdf, downloadPdf } = report
  const [lightbox, setLightbox] = useState('')
  const marked = wasteReport?.aiAnalysis.photos.find((photo) => photo.annotatedPhotoId)
  const after = usePhoto(marked?.annotatedPhotoId)
  const uploadedBefore = usePhoto(reference?.photoId)
  const satelliteBefore = usePhoto(reference ? null : earlier.imageKeys?.rgb)
  const beforeUrl = reference?.url ?? (reference?.photoId ? uploadedBefore.url : satelliteBefore.url)
  const analysis = wasteReport?.aiAnalysis

  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-card" aria-label="What this means">
      <div className="bg-gradient-to-br from-brand-950 via-brand-900 to-brand-700 px-5 py-5 text-white">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-green-300">What this means</p>
            <h2 className="mt-1 text-xl font-bold tracking-tight">{summary.headline}</h2>
            <p className="mt-1 text-xs text-brand-100">Satellite measurement and AI-checked ground photos for {site.name}, in plain words.</p>
          </div>
          <div className="flex flex-col items-start gap-1 sm:items-end">
            <Button type="button" onClick={downloadPdf} disabled={pdf.busy} className="h-10 bg-white text-brand-900 hover:bg-brand-50">
              {pdf.busy ? <LoaderCircle size={15} className="animate-spin" /> : <Download size={15} />}Download site report (PDF)
            </Button>
            {pdf.error && <p role="alert" className="text-[11px] font-medium text-rose-200">{pdf.error}</p>}
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2.5 lg:grid-cols-4">
          <Tile icon={Droplets} label="Water area" value={result.verdict === 'not_reliable' ? 'n/a' : formatSignedHa(result.deltaM2)} detail={VERDICT[result.verdict].label} tone={result.verdict === 'decrease' ? 'warn' : 'good'} />
          <Tile icon={ScanSearch} label="Waste hotspots" value={wasteReports.length} detail={wasteReports.length ? 'From AI-checked ground photos' : 'None reported'} tone={wasteReports.length ? 'warn' : 'good'} />
          <Tile icon={Gauge} label="AI confidence" value={analysis ? `${Math.round(analysis.confidence * 100)}%` : '-'} detail={analysis ? `Latest: ${wasteReport.id}` : 'No detection'} />
          <Tile icon={TriangleAlert} label="Severity" value={analysis ? SEVERITY[analysis.severity].label : 'None'} detail={analysis ? analysis.types[0] : 'No waste found'} tone={analysis ? 'warn' : 'good'} />
        </div>
      </div>

      <div className="grid gap-6 p-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
        <div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Frame
              label="BEFORE · CLEAN"
              url={beforeUrl}
              alt={`${site.name} before`}
              caption={reference?.photoId ? `Baseline photo uploaded by ${reference.uploadedBy} when the site was added.` : reference ? <>Baseline photo of the lake in a clean state. <a href={reference.source} target="_blank" rel="noreferrer" className="underline underline-offset-2 hover:text-slate-800">{referenceCredit(reference)}</a></> : 'Earlier satellite image. No ground baseline photo is on file for this lake.'}
              empty="No baseline image"
              onOpen={setLightbox}
            />
            <Frame
              label="AFTER · AI-MARKED WASTE"
              tone="after"
              url={after.url}
              alt={`${site.name} with waste marked by AI`}
              caption={wasteReport ? `${wasteReport.id}, seen on ${formatShortDate(wasteReport.observedAt)}. Green boxes are areas the AI marked as waste.` : 'No community report with detected waste for this lake yet.'}
              empty={wasteReport ? 'Marked photo is not available in this browser' : 'No waste reported'}
              onOpen={setLightbox}
            />
          </div>
          <p className="mt-4 flex items-start gap-2 rounded-lg bg-slate-50 px-3 py-2.5 text-[11px] leading-4 text-slate-500"><Info size={13} className="mt-px shrink-0" />The satellite shows where, the ground photo shows what. A waste pile is smaller than one 10 m satellite pixel, so the waste itself is confirmed from AI-checked community photos.</p>
        </div>

        <div className="flex flex-col gap-4">
          <ul className="space-y-3.5">
            {summary.points.map((point) => {
              const { icon: Icon, className } = POINT_STYLE[point.tone]
              return (
                <li key={point.title} className="flex gap-3">
                  <span className={cn('grid size-7 shrink-0 place-items-center rounded-lg', className)}><Icon size={15} /></span>
                  <div><p className="text-xs font-semibold text-slate-800">{point.title}</p><p className="mt-0.5 text-xs leading-5 text-slate-600">{point.text}</p></div>
                </li>
              )
            })}
          </ul>
          <p className="border-t border-slate-100 pt-3.5 text-xs leading-5 text-slate-700">{summary.conclusion}</p>
          <p className={cn('flex items-start gap-2 rounded-lg px-3 py-2.5 text-xs font-medium leading-5', summary.tone === 'warn' ? 'bg-amber-50 text-amber-900' : 'bg-green-50 text-green-800')}>
            <Lightbulb size={14} className="mt-0.5 shrink-0" /><span><strong className="font-semibold">Next step:</strong> {summary.nextStep}</span>
          </p>
        </div>
      </div>
      {lightbox && <Lightbox url={lightbox} onClose={() => setLightbox('')} />}
    </section>
  )
}

import { Camera, ChevronRight, Download, ImageOff, LoaderCircle, MapPin, Plane, Satellite, ScanSearch, X } from 'lucide-react'
import { useEffect } from 'react'
import { useAerialSnapshot, useEnhancedImage } from '../../hooks/useImagery'
import { usePhoto } from '../../hooks/usePhoto'
import { HOTSPOT_RADIUS_M, metersPerPixel } from '../../services/aerial'
import { SEVERITY } from '../../services/wasteDetection'
import { cn } from '../../utils/cn'
import { imageFraction } from '../../utils/geo'
import { formatAcquired } from '../../utils/observations'
import { formatShortDate } from '../../utils/reports'
import { Button } from '../ui/Button'

const SATELLITE_ZOOM = 5
const AERIAL = { zoom: 18, width: 768, height: 576 }

function Step({ number, title, icon: Icon, source, caption, accent, delay, children }) {
  return (
    <figure className="evidence-step flex min-w-0 flex-1 flex-col" style={{ animationDelay: `${delay}ms` }}>
      <div className="mb-2 flex items-center gap-2">
        <span className={cn('grid size-6 shrink-0 place-items-center rounded-full text-[11px] font-bold text-white', accent)}>{number}</span>
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-800">{title}</p>
        <span className="ml-auto inline-flex min-w-0 items-center gap-1 truncate rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600"><Icon size={11} className="shrink-0" /><span className="truncate">{source}</span></span>
      </div>
      <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-slate-900 ring-1 ring-slate-200">{children}</div>
      <figcaption className="mt-2 text-[11px] leading-4 text-slate-500">{caption}</figcaption>
    </figure>
  )
}

function Missing({ state }) {
  return (
    <div className="grid size-full place-items-center text-[11px] text-slate-400">
      {state === 'loading' ? <LoaderCircle size={18} className="animate-spin" /> : <span className="flex flex-col items-center gap-1.5"><ImageOff size={18} />Not available</span>}
    </div>
  )
}

function Stat({ label, value }) {
  return (
    <div className="rounded-lg bg-slate-50 px-3 py-2">
      <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-slate-400">{label}</p>
      <p className="mt-0.5 truncate text-sm font-semibold text-slate-900" title={String(value)}>{value}</p>
    </div>
  )
}

const Arrow = () => <ChevronRight size={22} className="hidden shrink-0 self-center text-slate-300 lg:block" aria-hidden="true" />

/** Evidence chain at one hotspot: Sentinel-2 shows where, the aerial photo shows the place up close, the AI-checked ground photo shows what. */
export function HotspotEvidenceCard({ site, report, later, pdf, onDownloadPdf, onClose }) {
  const analysis = report.aiAnalysis
  const satellite = usePhoto(later.imageKeys?.rgb)
  const satelliteUrl = useEnhancedImage(satellite.url, true)
  const aerial = useAerialSnapshot(report.latitude, report.longitude, AERIAL)
  const marked = analysis.photos.find((photo) => photo.annotatedPhotoId)
  const ground = usePhoto(marked?.annotatedPhotoId)
  const at = imageFraction(site, report.latitude, report.longitude) ?? { x: 0.5, y: 0.5 }

  // Centre the satellite crop on the point; near an edge the crop stops at the edge and the marker moves instead.
  const offset = (fraction) => Math.min(1, Math.max(0, (fraction * SATELLITE_ZOOM - 0.5) / (SATELLITE_ZOOM - 1)))
  const marker = (fraction) => (fraction * SATELLITE_ZOOM - offset(fraction) * (SATELLITE_ZOOM - 1)) * 100
  const aerialBox = ((HOTSPOT_RADIUS_M * 2) / metersPerPixel(report.latitude, AERIAL.zoom))
  const aerialDate = aerial.metadata?.date
  const aerialTiming = aerialDate ? (aerialDate < report.observedAt ? 'before the report, so it shows the place rather than the new waste' : 'after the report') : ''

  useEffect(() => {
    const onKey = (event) => { if (event.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="hotspot-title" className="fixed inset-0 z-[1200] grid place-items-center overflow-y-auto bg-slate-950/80 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="animate-fade-in w-full max-w-6xl overflow-hidden rounded-2xl bg-white shadow-pop" onClick={(event) => event.stopPropagation()}>
        <header className="flex items-center gap-3 bg-gradient-to-r from-brand-950 via-brand-900 to-brand-700 px-5 py-4 text-white">
          <span className="grid size-10 place-items-center rounded-xl bg-white/10 text-green-300"><ScanSearch size={20} /></span>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-green-300">Waste hotspot · evidence chain</p>
            <h2 id="hotspot-title" className="truncate text-base font-semibold">{report.id} at {site.name}</h2>
            <p className="flex items-center gap-1 truncate text-[11px] text-brand-100"><MapPin size={11} />{report.latitude.toFixed(5)}, {report.longitude.toFixed(5)}</p>
          </div>
          <span className="hidden rounded-full bg-green-500 px-3 py-1 text-[11px] font-bold sm:inline">{SEVERITY[analysis.severity].label} severity · {Math.round(analysis.confidence * 100)}%</span>
          <button type="button" onClick={onClose} aria-label="Close" className="grid size-8 place-items-center rounded-lg text-white/80 hover:bg-white/10 hover:text-white"><X size={17} /></button>
        </header>

        <div className="flex flex-col gap-4 p-5 lg:flex-row lg:items-start">
          <Step number="1" title="Where" icon={Satellite} accent="bg-slate-700" delay={0} source={`Sentinel-2 · 10 m · ${formatAcquired(later.acquiredAt).date}`}
            caption="The satellite checks the lake every 5 days and pins the spot. One pixel is 10 m, so the waste itself is too small to see.">
            {satellite.url
              ? <div className="absolute inset-0" style={{ backgroundImage: `url(${satelliteUrl})`, backgroundSize: `${SATELLITE_ZOOM * 100}% ${SATELLITE_ZOOM * 100}%`, backgroundPosition: `${offset(at.x) * 100}% ${offset(at.y) * 100}%`, imageRendering: 'pixelated' }} />
              : <Missing state={satellite.state} />}
            <div className="absolute size-14 -translate-x-1/2 -translate-y-1/2 rounded-md border-2 border-dashed border-green-400 shadow-[0_0_24px_rgba(74,222,128,0.6)]" style={{ left: `${marker(at.x)}%`, top: `${marker(at.y)}%` }}>
              <span className="absolute left-1/2 top-1/2 size-2 -translate-x-1/2 -translate-y-1/2 animate-ping rounded-full bg-green-400" />
            </div>
            <span className="absolute bottom-2 left-2 rounded-md bg-slate-950/80 px-2 py-0.5 text-[10px] font-semibold text-white">{SATELLITE_ZOOM}× zoom · sharpened</span>
          </Step>
          <Arrow />
          <Step number="2" title="Closer" icon={Plane} accent="bg-sky-600" delay={220} source={aerial.metadata ? `${aerial.metadata.sensor} · ${aerial.metadata.resolution} m` : 'Aerial · 0.3–0.6 m'}
            caption={aerialDate ? `High-resolution aerial photo of the same spot, captured ${formatShortDate(aerialDate)}, ${aerialTiming}. Esri World Imagery.` : 'High-resolution aerial photo of the same spot. Esri World Imagery.'}>
            {aerial.url ? <img src={aerial.url} alt={`Aerial view around ${report.id}`} className="aerial-zoom-in size-full object-cover" /> : <Missing state={aerial.state} />}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-sm border-2 border-green-400 bg-green-400/15 shadow-[0_0_20px_rgba(74,222,128,0.7)]" style={{ width: `${(aerialBox / AERIAL.width) * 100}%`, height: `${(aerialBox / AERIAL.height) * 100}%` }}>
              <span className="absolute bottom-full left-1/2 mb-1 -translate-x-1/2 whitespace-nowrap rounded bg-green-500 px-1.5 py-0.5 text-[9px] font-bold text-white">Report spot ± {HOTSPOT_RADIUS_M} m</span>
            </div>
            <span className="absolute bottom-2 left-2 rounded-md bg-slate-950/80 px-2 py-0.5 text-[10px] font-semibold text-white">{Math.round(metersPerPixel(report.latitude, AERIAL.zoom) * AERIAL.width)} m across</span>
          </Step>
          <Arrow />
          <Step number="3" title="What" icon={Camera} accent="bg-green-600" delay={440} source={`Ground photo + AI · ${formatShortDate(report.observedAt)}`}
            caption={`The AI found ${analysis.regions} waste ${analysis.regions === 1 ? 'area' : 'areas'} in the photo taken at that spot, mainly ${analysis.types.join(', ').toLowerCase()}.`}>
            {ground.url ? <img src={ground.url} alt={`AI-marked waste photo from ${report.id}`} className="size-full object-contain" /> : <Missing state={ground.state} />}
            <span className="absolute left-2 top-2 rounded-md bg-green-600 px-2 py-0.5 text-[10px] font-bold text-white">AI-marked waste</span>
          </Step>
        </div>

        <div className="grid gap-4 border-t border-slate-100 px-5 py-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Stat label="Confidence" value={`${Math.round(analysis.confidence * 100)}%`} />
            <Stat label="Waste areas" value={analysis.regions} />
            <Stat label="Main type" value={analysis.types[0]} />
            <Stat label="Severity" value={SEVERITY[analysis.severity].label} />
          </div>
          <div className="space-y-2 text-xs leading-5 text-slate-600">
            <p>{analysis.summary}</p>
            <p className="rounded-lg bg-green-50 px-3 py-2 font-medium text-green-800">{analysis.recommendation}</p>
          </div>
        </div>

        <footer className="flex flex-col gap-3 border-t border-slate-100 bg-slate-50 px-5 py-3 sm:flex-row sm:items-center">
          <p className="flex-1 text-[11px] leading-4 text-slate-500">Satellite shows where, aerial shows the place up close, the AI-checked ground photo confirms what. Each image keeps its real source and date.</p>
          <Button type="button" onClick={onDownloadPdf} disabled={pdf.busy} className="h-9 shrink-0 text-xs">
            {pdf.busy ? <LoaderCircle size={14} className="animate-spin" /> : <Download size={14} />}Site report PDF
          </Button>
        </footer>
        {pdf.error && <p role="alert" className="px-5 pb-3 text-[11px] font-medium text-rose-600">{pdf.error}</p>}
      </div>
    </div>
  )
}

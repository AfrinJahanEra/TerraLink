import { CircleCheck, Download, LoaderCircle, ScanSearch } from 'lucide-react'
import { useState } from 'react'
import { SEVERITY } from '../../services/wasteDetection'
import { getWastePdf, wastePdfFilename } from '../../services/wastePdf'
import { downloadBlob } from '../../utils/download'
import { Button } from '../ui/Button'
import { PhotoImage } from './PhotoImage'

/** The AI waste detection saved with a community report: marked photos, summary and the attached PDF. */
export function WasteAnalysis({ report, siteName, onOpenPhoto }) {
  const analysis = report.aiAnalysis
  const [state, setState] = useState({ busy: false, error: '' })
  const marked = analysis.photos.filter((photo) => photo.annotatedPhotoId)

  async function download() {
    setState({ busy: true, error: '' })
    try {
      downloadBlob(await getWastePdf(report, siteName), wastePdfFilename(report))
      setState({ busy: false, error: '' })
    } catch {
      setState({ busy: false, error: 'The PDF could not be created. Please try again.' })
    }
  }

  return (
    <section aria-label="AI waste detection" className="mt-4 rounded-xl border border-green-200 bg-green-50/50 p-3.5">
      <div className="flex items-center gap-2">
        <ScanSearch size={15} className="text-green-600" />
        <h4 className="text-xs font-semibold text-slate-900">AI waste detection</h4>
        <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-green-500 px-2 py-0.5 text-[10px] font-semibold text-white"><CircleCheck size={11} />{Math.round(analysis.confidence * 100)}%</span>
      </div>

      {marked.length > 0 && (
        <div className="mt-3 grid grid-cols-3 gap-2">
          {marked.map((photo) => (
            <div key={photo.annotatedPhotoId} className="aspect-[4/3] overflow-hidden rounded-lg border border-green-500 bg-slate-100">
              <PhotoImage photoId={photo.annotatedPhotoId} alt={`AI-marked ${photo.name}`} onClick={onOpenPhoto} />
            </div>
          ))}
        </div>
      )}

      <dl className="mt-3 grid grid-cols-3 gap-2 text-center">
        {[['Severity', analysis.severity ? SEVERITY[analysis.severity].label : '-'], ['Waste areas', analysis.regions], ['Type', analysis.types[0] ?? '-']].map(([label, value]) => (
          <div key={label} className="rounded-lg bg-white px-2 py-1.5">
            <dt className="text-[9px] font-bold uppercase tracking-[0.1em] text-slate-400">{label}</dt>
            <dd className="mt-0.5 truncate text-[11px] font-semibold text-slate-800" title={String(value)}>{value}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-3 text-xs leading-5 text-slate-700">{analysis.summary}</p>
      {analysis.recommendation && <p className="mt-1 text-[11px] font-medium leading-4 text-green-800">{analysis.recommendation}</p>}

      <Button type="button" variant="secondary" onClick={download} disabled={state.busy} className="mt-3 h-9 w-full text-xs">
        {state.busy ? <LoaderCircle size={14} className="animate-spin" /> : <Download size={14} />}AI waste report (PDF)
      </Button>
      {state.error && <p role="alert" className="mt-1.5 text-[11px] font-medium text-rose-600">{state.error}</p>}
      <p className="mt-2 text-[10px] leading-4 text-slate-400">Prototype detection. A reviewer still verifies the evidence.</p>
    </section>
  )
}

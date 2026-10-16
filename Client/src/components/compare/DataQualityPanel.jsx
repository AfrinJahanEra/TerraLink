import { Info, TriangleAlert } from 'lucide-react'
import { METHOD, MIN_RELIABLE_AREA_HA, QUALITY } from '../../constants/observations'
import { formatAcquired, formatHa } from '../../utils/observations'
import { Badge } from '../ui/Badge'

const qualityTone = { suitable: 'emerald', limited: 'amber', unavailable: 'slate' }

function Row({ label, earlier, later }) {
  return (
    <tr>
      <th scope="row" className="py-2.5 pr-4 text-left text-xs font-normal text-slate-400">{label}</th>
      <td className="py-2.5 pr-4 text-xs font-medium text-slate-700">{earlier}</td>
      <td className="py-2.5 text-xs font-medium text-slate-700">{later}</td>
    </tr>
  )
}

/** Everything a reader needs to judge whether the numbers can be trusted. */
export function DataQualityPanel({ site, earlier, later, result }) {
  const rows = [
    ['Acquired', (o) => `${formatAcquired(o.acquiredAt).date}, ${formatAcquired(o.acquiredAt).time}`],
    ['Scene', (o) => <span className="break-all font-mono text-[10px]">{o.sceneId}</span>],
    ['Requested date', (o) => `${o.requestedDate} (± ${o.windowDays} days)`],
    ['Scene cloud cover', (o) => (o.cloudCover === null ? 'Unknown' : `${o.cloudCover.toFixed(1)}%`)],
    ['Usable pixels in study area', (o) => `${o.validPercent}% of ${o.studyPixels.toLocaleString('en-US')}`],
    ['ESA classification water', (o) => `${formatHa(o.sclWaterAreaM2)} (agreement ${Math.round(o.agreement * 100)}%)`],
    ['Image quality', (o) => <Badge tone={qualityTone[o.quality]} className="px-2 py-0.5 text-[10px]">{QUALITY[o.quality].label}</Badge>],
  ]

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-card" aria-label="Data quality">
      <div className="flex items-start gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-600"><Info size={17} /></span>
        <div><h2 className="text-sm font-semibold text-slate-900">Data quality and method</h2><p className="mt-1 text-xs leading-5 text-slate-500">Use this measurement to decide where to look closer, not as proof of encroachment, damage or permanent loss.</p></div>
      </div>

      {result.warnings.length > 0 && (
        <ul className="mt-4 space-y-2">
          {result.warnings.map((warning) => <li key={warning} className="flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs leading-5 text-amber-900"><TriangleAlert size={14} className="mt-0.5 shrink-0" />{warning}</li>)}
        </ul>
      )}

      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[420px] border-t border-slate-100">
          <thead><tr><th className="sr-only">Measure</th><th className="pb-1 pt-3 pr-4 text-left text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">Earlier</th><th className="pb-1 pt-3 text-left text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">Later</th></tr></thead>
          <tbody className="divide-y divide-slate-100">{rows.map(([label, render]) => <Row key={label} label={label} earlier={render(earlier)} later={render(later)} />)}</tbody>
        </table>
      </div>

      <dl className="mt-4 grid gap-x-6 gap-y-3 border-t border-slate-100 pt-4 text-xs sm:grid-cols-2">
        <div><dt className="text-slate-400">Method</dt><dd className="mt-0.5 leading-5 text-slate-700">{METHOD.label}. A pixel is water when NDWI is above {METHOD.threshold}. Cloud, shadow and no-data pixels are left out.</dd></div>
        <div><dt className="text-slate-400">Study area</dt><dd className="mt-0.5 leading-5 text-slate-700">The mapped outline ({site.area}) plus a {METHOD.bufferMeters} m tolerance for geolocation error, identical on both dates.</dd></div>
        <div><dt className="text-slate-400">Uncertainty</dt><dd className="mt-0.5 leading-5 text-slate-700">Half the area of water pixels that touch non-water pixels, because those pixels are only partly water.</dd></div>
        <div><dt className="text-slate-400">Seasonal gap</dt><dd className="mt-0.5 leading-5 text-slate-700">{result.seasonGapDays} days apart in the yearly cycle. Keep this under 45 days to compare like with like.</dd></div>
        <div><dt className="text-slate-400">Size limit</dt><dd className="mt-0.5 leading-5 text-slate-700">Below {MIN_RELIABLE_AREA_HA} ha a water body is only a few 10 m pixels wide, so it is reported as not reliable.</dd></div>
        <div><dt className="text-slate-400">Not detected</dt><dd className="mt-0.5 leading-5 text-slate-700">Floating plants and very turbid water can look like land. Satellite data cannot show pollution or its cause.</dd></div>
      </dl>
    </section>
  )
}

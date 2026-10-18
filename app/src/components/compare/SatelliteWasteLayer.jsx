import { LoaderCircle } from 'lucide-react'
import { imageFraction } from '../../utils/geo'

const SCAN_MS = 2200

const confidence = (report) => `${Math.round(report.aiAnalysis.confidence * 100)}%`

/**
 * Plays an AI scan over the later satellite image, then pins each AI-verified waste report at its GPS location.
 * Remount it (change its `key`) to replay the scan.
 */
export function SatelliteWasteLayer({ site, reports, onSelect }) {
  const spots = reports.map((report) => ({ report, at: imageFraction(site, report.latitude, report.longitude) })).filter((spot) => spot.at)

  return (
    <div className="absolute inset-0 z-[5]">
      <div className="waste-sat-sweep pointer-events-none absolute inset-0" style={{ animationDelay: `${SCAN_MS - 200}ms` }} />

      <span className="waste-fade-out pointer-events-none absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-lg bg-slate-950/80 px-2.5 py-1.5 text-[10px] font-semibold text-green-300 backdrop-blur-sm" style={{ animationDelay: `${SCAN_MS}ms` }}>
        <LoaderCircle size={12} className="animate-spin" />AI scanning for waste
      </span>
      <span className="waste-pop pointer-events-none absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-lg bg-slate-950/80 px-2.5 py-1.5 text-[10px] font-semibold text-white backdrop-blur-sm" style={{ animationDelay: `${SCAN_MS}ms` }}>
        <span className={spots.length ? 'size-2 rounded-full bg-green-400' : 'size-2 rounded-full bg-slate-400'} />
        {spots.length ? `${spots.length} waste ${spots.length === 1 ? 'hotspot' : 'hotspots'} · click to zoom` : 'No waste reported at this lake'}
      </span>

      {spots.map(({ report, at }, index) => (
        <div key={report.id} className="absolute" style={{ left: `${at.x * 100}%`, top: `${at.y * 100}%` }}>
          <button
            type="button"
            onClick={() => onSelect(report.id)}
            aria-label={`Waste hotspot from ${report.id}, ${confidence(report)} confidence. Open zoom.`}
            className="waste-pop group absolute -left-5 -top-5 grid size-10 place-items-center"
            style={{ animationDelay: `${SCAN_MS + index * 180}ms` }}
          >
            <span className="absolute inset-[-8px] animate-ping rounded-full bg-green-400/30" />
            <span className="relative size-10 rounded-md border-2 border-green-400 bg-green-400/25 shadow-[0_0_18px_rgba(74,222,128,0.85)] transition group-hover:scale-110">
              <span className="absolute left-1/2 top-1/2 size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white" />
            </span>
            <span className="absolute bottom-full left-1/2 mb-1.5 -translate-x-1/2 whitespace-nowrap rounded-md bg-green-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-lg">
              Waste {confidence(report)} · {report.id}
            </span>
          </button>
        </div>
      ))}
    </div>
  )
}

import 'leaflet/dist/leaflet.css'
import { Plane } from 'lucide-react'
import { useEffect, useState } from 'react'
import { MapContainer, Polygon, Rectangle, TileLayer, Tooltip } from 'react-leaflet'
import { ESRI_ATTRIBUTION, ESRI_TILES, boxAround, describeAerial, getAerialMetadata } from '../../services/aerial'

/** The whole lake on Esri's high-resolution imagery, with the mapped outline and every waste hotspot. */
export function AerialView({ site, reports, onSelect }) {
  const [west, south, east, north] = site.imageBox
  const center = [(south + north) / 2, (west + east) / 2]
  const [metadata, setMetadata] = useState(null)

  useEffect(() => {
    let live = true
    getAerialMetadata(center[0], center[1]).then((value) => { if (live) setMetadata(value) })
    return () => { live = false }
  }, [center[0], center[1]]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="absolute inset-0 isolate">
      <MapContainer bounds={[[south, west], [north, east]]} maxZoom={19} zoomSnap={0.25} scrollWheelZoom className="absolute inset-0 z-0 size-full bg-slate-900" aria-label={`High-resolution aerial view of ${site.name}`}>
        <TileLayer url={ESRI_TILES} attribution={ESRI_ATTRIBUTION} maxNativeZoom={19} maxZoom={19} />
        <Polygon positions={[site.boundary, ...site.boundaryHoles]} pathOptions={{ color: '#ffffff', weight: 2, fill: false, dashArray: '6 4' }} />
        {reports.map((report) => (
          <Rectangle
            key={report.id}
            bounds={boxAround(report.latitude, report.longitude)}
            pathOptions={{ color: '#4ade80', weight: 3, fillColor: '#4ade80', fillOpacity: 0.22 }}
            eventHandlers={{ click: () => onSelect(report.id) }}
          >
            <Tooltip permanent direction="top" offset={[0, -6]} className="waste-tooltip">Waste {Math.round(report.aiAnalysis.confidence * 100)}% · {report.id}</Tooltip>
          </Rectangle>
        ))}
      </MapContainer>
      <span className="pointer-events-none absolute left-3 top-3 z-[1000] inline-flex items-center gap-1.5 rounded-lg bg-slate-950/80 px-2.5 py-1.5 text-[10px] font-semibold text-white backdrop-blur-sm">
        <Plane size={12} className="text-sky-300" />{describeAerial(metadata)}
      </span>
      {reports.length > 0 && (
        <span className="pointer-events-none absolute bottom-8 left-3 z-[1000] rounded-lg bg-slate-950/80 px-2.5 py-1.5 text-[10px] font-semibold text-white backdrop-blur-sm">
          <span className="mr-1.5 inline-block size-2 rounded-full bg-green-400" />Click a green box to see the evidence
        </span>
      )}
    </div>
  )
}

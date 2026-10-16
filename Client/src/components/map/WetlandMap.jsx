import 'leaflet/dist/leaflet.css'
import { divIcon, latLngBounds } from 'leaflet'
import { TriangleAlert } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import {
  CircleMarker,
  LayersControl,
  MapContainer,
  Marker,
  Polygon,
  TileLayer,
  Tooltip,
  ZoomControl,
  useMap,
} from 'react-leaflet'
import { REPORT_CATEGORIES, REPORT_STATUS } from '../../constants/reports'
import { SITE_GROUP, SITE_STATUS, siteGroup } from '../../constants/status'
import { cn } from '../../utils/cn'

const ESRI_ATTRIBUTION = 'Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics'
const DHAKA_CENTER = [23.775, 90.395]

const reportIcon = (color, selected) => divIcon({
  className: 'report-pin-wrapper',
  html: `<span class="report-pin${selected ? ' is-selected' : ''}" style="background:${color}"></span>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
})

function MapViewport({ sites, selectedSite, selectedReport }) {
  const map = useMap()

  useEffect(() => {
    if (selectedReport) {
      map.flyTo([selectedReport.latitude, selectedReport.longitude], Math.max(map.getZoom(), 16), { duration: 0.5 })
    } else if (selectedSite) {
      map.flyToBounds(latLngBounds(selectedSite.boundary), { padding: [60, 60], maxZoom: 17, duration: 0.55 })
    } else if (sites.length) {
      map.fitBounds(latLngBounds(sites.flatMap((site) => site.boundary)), { padding: [48, 48], maxZoom: 13 })
    }
  }, [map, selectedReport, selectedSite, sites])

  return null
}

function MapLegend({ simple, sites }) {
  const present = new Set(sites.map((site) => site.status))
  const statuses = ['needs_review', 'reported_issue', 'confirmed', 'inconclusive', 'no_change', 'insufficient_data'].filter((status) => present.has(status))
  if (simple) {
    return (
      <div className="pointer-events-none absolute bottom-5 left-4 z-[500] hidden rounded-lg border border-white/80 bg-white/95 px-3 py-2.5 shadow-card backdrop-blur sm:block">
        <div className="flex flex-col gap-1.5">
          {Object.values(SITE_GROUP).map((group) => <span key={group.label} className="flex items-center gap-2 text-[10px] text-slate-600"><span className="size-2 rounded-sm" style={{ backgroundColor: group.color }} />{group.label}</span>)}
          <span className="flex items-center gap-2 text-[10px] text-slate-600"><span className="size-2 rotate-45 border border-white bg-brand-600 shadow-[0_0_0_1px_rgba(15,23,42,0.5)]" />Community report</span>
        </div>
      </div>
    )
  }
  return (
    <div className="pointer-events-none absolute bottom-5 left-4 z-[500] hidden rounded-lg sm:block border border-white/80 bg-white/95 px-3 py-2.5 shadow-card backdrop-blur">
      <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">Monitoring status</p>
      <div className="mt-2 grid gap-1.5 sm:grid-cols-2 sm:gap-x-4">
        {statuses.map((status) => (
          <span key={status} className="flex items-center gap-2 text-[10px] text-slate-600">
            <span className="size-2 rounded-sm" style={{ backgroundColor: SITE_STATUS[status].color }} />
            {SITE_STATUS[status].label}
          </span>
        ))}
        <span className="flex items-center gap-2 text-[10px] text-slate-600"><span className="size-2 rotate-45 border border-white bg-slate-500 shadow-[0_0_0_1px_rgba(15,23,42,0.5)]" />Community report</span>
      </div>
    </div>
  )
}

export function WetlandMap({
  sites,
  reports = [],
  selectedSite,
  selectedReportId = null,
  onSelectSite,
  onSelectReport,
  simple = false,
  className = 'min-h-[520px] lg:min-h-[650px]',
}) {
  const colorOf = (status) => (simple ? SITE_GROUP[siteGroup(status)].color : SITE_STATUS[status].color)
  const [tileError, setTileError] = useState(false)
  const selectedReport = reports.find((report) => report.id === selectedReportId) ?? null
  const tileHandlers = useMemo(() => ({ tileerror: () => setTileError(true), tileload: () => setTileError(false) }), [])

  return (
    <div className={cn('relative flex-1 bg-slate-100', className)}>
      <MapContainer
        center={DHAKA_CENTER}
        zoom={12}
        maxZoom={19}
        zoomControl={false}
        scrollWheelZoom
        className="absolute inset-0 z-0 size-full"
        aria-label="Interactive map of monitored water bodies in Dhaka"
      >
        <LayersControl position="topright" collapsed>
          <LayersControl.BaseLayer checked name="Satellite imagery">
            <TileLayer attribution={ESRI_ATTRIBUTION} url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" maxNativeZoom={18} eventHandlers={tileHandlers} />
          </LayersControl.BaseLayer>
          <LayersControl.BaseLayer name="Street map">
            <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" eventHandlers={tileHandlers} />
          </LayersControl.BaseLayer>
        </LayersControl>

        <ZoomControl position="bottomright" />
        <MapViewport sites={sites} selectedSite={selectedSite} selectedReport={selectedReport} />

        {sites.map((site) => {
          const selected = selectedSite?.id === site.id
          const color = colorOf(site.status)
          return (
            <Polygon
              key={site.id}
              positions={[site.boundary, ...site.boundaryHoles]}
              pathOptions={{ color: selected ? '#ffffff' : color, weight: selected ? 3 : 2.5, fillColor: color, fillOpacity: selected ? 0.3 : 0.22 }}
              eventHandlers={{ click: () => onSelectSite(site.id) }}
            />
          )
        })}

        {sites.map((site) => (
          <CircleMarker
            key={`${site.id}-marker`}
            center={site.coordinates}
            radius={selectedSite?.id === site.id ? 11 : 8}
            pathOptions={{ color: '#ffffff', weight: 3, fillColor: colorOf(site.status), fillOpacity: 1 }}
            eventHandlers={{ click: () => onSelectSite(site.id) }}
          >
            <Tooltip direction="top" offset={[0, -8]} opacity={1}>
              <strong>{site.name}</strong><br />{site.location} · {site.area}
            </Tooltip>
          </CircleMarker>
        ))}

        {reports.map((report) => (
          <Marker
            key={report.id}
            position={[report.latitude, report.longitude]}
            icon={reportIcon(simple ? '#20787d' : REPORT_STATUS[report.status].color, report.id === selectedReportId)}
            eventHandlers={{ click: () => onSelectReport?.(report.id) }}
          >
            <Tooltip direction="top" offset={[0, -8]} opacity={1}>
              <strong>{report.id} · {REPORT_CATEGORIES[report.category].label}</strong><br />{REPORT_STATUS[report.status].label}
            </Tooltip>
          </Marker>
        ))}
      </MapContainer>

      {tileError && (
        <div role="status" className="absolute left-1/2 top-4 z-[600] flex -translate-x-1/2 items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] font-medium text-amber-800 shadow-card">
          <TriangleAlert size={14} />Some map imagery could not be loaded. Check your connection or switch layers.
        </div>
      )}
      {!sites.length && (
        <div className="pointer-events-none absolute inset-0 z-[500] grid place-items-center">
          <p className="rounded-lg bg-white/95 px-4 py-3 text-xs font-medium text-slate-600 shadow-card">No water bodies match the current filters.</p>
        </div>
      )}

      <MapLegend simple={simple} sites={sites} />
    </div>
  )
}

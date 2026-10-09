import 'leaflet/dist/leaflet.css'
import { useEffect } from 'react'
import {
  CircleMarker,
  LayersControl,
  MapContainer,
  TileLayer,
  Tooltip,
  ZoomControl,
  useMap,
} from 'react-leaflet'
import { SITE_STATUS } from '../../constants/status'

const markerColors = {
  needs_review: '#d97706',
  confirmed: '#e11d48',
  inconclusive: '#64748b',
  no_change: '#059669',
  insufficient_data: '#94a3b8',
}

function MapViewport({ sites, selectedSite }) {
  const map = useMap()

  useEffect(() => {
    if (selectedSite) {
      map.flyTo(selectedSite.coordinates, 13, { duration: 0.55 })
      return
    }

    if (sites.length === 1) {
      map.setView(sites[0].coordinates, 12)
    } else if (sites.length > 1) {
      map.fitBounds(sites.map((site) => site.coordinates), { padding: [42, 42], maxZoom: 11 })
    }
  }, [map, selectedSite, sites])

  return null
}

function MapLegend() {
  return (
    <div className="pointer-events-none absolute bottom-5 left-4 z-[500] rounded-lg border border-white/80 bg-white/95 px-3 py-2.5 shadow-card backdrop-blur">
      <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">Review status</p>
      <div className="mt-2 grid gap-1.5 sm:grid-cols-2 sm:gap-x-4">
        {Object.entries(SITE_STATUS).map(([status, config]) => (
          <span key={status} className="flex items-center gap-2 text-[10px] text-slate-600">
            <span className="size-2 rounded-full" style={{ backgroundColor: markerColors[status] }} />
            {config.label}
          </span>
        ))}
      </div>
    </div>
  )
}

export function WetlandMap({ sites, selectedSite, onSelectSite }) {
  return (
    <div className="relative min-h-[520px] flex-1 bg-slate-100 lg:min-h-[650px]">
      <MapContainer
        center={[23.86, 90.37]}
        zoom={10}
        zoomControl={false}
        scrollWheelZoom
        className="absolute inset-0 z-0 size-full"
        aria-label="Interactive map of monitored wetland sites"
      >
        <LayersControl position="topright" collapsed>
          <LayersControl.BaseLayer checked name="Street map">
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
          </LayersControl.BaseLayer>
          <LayersControl.BaseLayer name="Satellite imagery">
            <TileLayer
              attribution='Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics'
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            />
          </LayersControl.BaseLayer>
        </LayersControl>

        <ZoomControl position="bottomright" />
        <MapViewport sites={sites} selectedSite={selectedSite} />

        {sites.map((site) => {
          const selected = selectedSite?.id === site.id
          return (
            <CircleMarker
              key={site.id}
              center={site.coordinates}
              radius={selected ? 13 : 9}
              pathOptions={{
                color: '#ffffff',
                weight: selected ? 4 : 3,
                fillColor: markerColors[site.status],
                fillOpacity: 1,
              }}
              eventHandlers={{ click: () => onSelectSite(site.id) }}
            >
              <Tooltip direction="top" offset={[0, -8]} opacity={1}>
                <strong>{site.name}</strong><br />{site.location} · {site.area}
              </Tooltip>
            </CircleMarker>
          )
        })}
      </MapContainer>

      <MapLegend />
    </div>
  )
}

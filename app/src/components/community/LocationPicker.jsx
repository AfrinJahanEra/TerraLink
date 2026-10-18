import 'leaflet/dist/leaflet.css'
import { latLngBounds } from 'leaflet'
import { useEffect } from 'react'
import { CircleMarker, MapContainer, Polygon, TileLayer, useMap, useMapEvents } from 'react-leaflet'
import { SITE_GROUP, siteGroup } from '../../constants/status'

function ClickHandler({ onPick }) {
  useMapEvents({ click: (event) => onPick([event.latlng.lat, event.latlng.lng]) })
  return null
}

function Focus({ sites, focusSite, value }) {
  const map = useMap()

  useEffect(() => {
    if (focusSite) map.fitBounds(latLngBounds(focusSite.boundary), { padding: [40, 40], maxZoom: 17 })
    else if (!value) map.fitBounds(latLngBounds(sites.flatMap((site) => site.boundary)), { padding: [30, 30], maxZoom: 12 })
    // The map only refocuses when the chosen water body changes, not on every pin drop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, focusSite?.id])

  useEffect(() => {
    if (value && !focusSite) map.flyTo(value, Math.max(map.getZoom(), 16), { duration: 0.4 })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, value?.[0], value?.[1]])

  return null
}

/** Small map where the reporter taps the exact spot of the problem. */
export function LocationPicker({ sites, value, focusSite, onChange, className = 'h-72 sm:h-80' }) {
  return (
    <div className={`relative overflow-hidden rounded-lg border border-slate-200 bg-slate-100 ${className}`}>
      <MapContainer center={[23.775, 90.395]} zoom={12} maxZoom={19} scrollWheelZoom={false} className="absolute inset-0 z-0 size-full" aria-label="Map for choosing the report location">
        <TileLayer attribution="Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics" url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" maxNativeZoom={18} />
        <ClickHandler onPick={onChange} />
        <Focus sites={sites} focusSite={focusSite} value={value} />
        {sites.map((site) => (
          <Polygon
            key={site.id}
            positions={[site.boundary, ...site.boundaryHoles]}
            pathOptions={{ color: SITE_GROUP[siteGroup(site.status)].color, weight: 2, fillColor: SITE_GROUP[siteGroup(site.status)].color, fillOpacity: 0.25 }}
            eventHandlers={{ click: (event) => onChange([event.latlng.lat, event.latlng.lng]) }}
          />
        ))}
        {value && <CircleMarker center={value} radius={9} pathOptions={{ color: '#ffffff', weight: 3, fillColor: '#0f172a', fillOpacity: 1 }} />}
      </MapContainer>
      <p className="pointer-events-none absolute left-3 top-3 z-[500] rounded-md bg-white/95 px-2.5 py-1.5 text-[10px] font-medium text-slate-600 shadow-card">
        {value ? 'Tap the map to move the pin' : 'Tap the map to mark where you saw the problem'}
      </p>
    </div>
  )
}

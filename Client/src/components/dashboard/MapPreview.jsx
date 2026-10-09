import 'leaflet/dist/leaflet.css'
import { CircleMarker, MapContainer, Popup, TileLayer, ZoomControl } from 'react-leaflet'
import { useNavigate } from 'react-router-dom'

const markerColors = {
  needs_review: '#d97706',
  no_change: '#059669',
  insufficient_data: '#64748b',
}

export function MapPreview({ sites }) {
  const navigate = useNavigate()

  return (
    <section className="relative min-h-[330px] overflow-hidden rounded-xl border border-slate-200 bg-slate-100 shadow-card">
      <MapContainer center={[23.86, 90.37]} zoom={10} zoomControl={false} scrollWheelZoom={false} className="absolute inset-0 z-0 size-full" aria-label="Map of monitored wetland sites">
        <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <ZoomControl position="bottomright" />
        {sites.map((site) => (
          <CircleMarker
            key={site.id}
            center={site.coordinates}
            radius={9}
            pathOptions={{ color: '#ffffff', weight: 3, fillColor: markerColors[site.status], fillOpacity: 1 }}
            eventHandlers={{ click: () => navigate(`/sites/${site.id}`) }}
          >
            <Popup><strong>{site.name}</strong><br />{site.location} · {site.area}</Popup>
          </CircleMarker>
        ))}
      </MapContainer>
      <div className="pointer-events-none absolute left-4 top-4 z-[500] rounded-lg border border-white/80 bg-white/95 px-3 py-2 shadow-card backdrop-blur">
        <p className="text-xs font-semibold text-slate-800">Dhaka–Gazipur programme</p>
        <p className="mt-0.5 text-[10px] text-slate-400">5 monitored sample sites</p>
      </div>
    </section>
  )
}

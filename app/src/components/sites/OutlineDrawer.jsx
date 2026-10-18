import 'leaflet/dist/leaflet.css'
import { useEffect } from 'react'
import { CircleMarker, MapContainer, Polygon, Polyline, TileLayer, Tooltip, ZoomControl, useMap, useMapEvents } from 'react-leaflet'
import { ESRI_ATTRIBUTION, ESRI_TILES } from '../../services/aerial'

function ClickToAdd({ onAdd }) {
  useMapEvents({ click: (event) => onAdd([Number(event.latlng.lat.toFixed(6)), Number(event.latlng.lng.toFixed(6))]) })
  return null
}

function FlyTo({ target }) {
  const map = useMap()
  useEffect(() => {
    if (target) map.flyTo(target, 17, { duration: 0.8 })
  }, [map, target])
  return null
}

/** Click on the aerial map to place outline points. Existing sites are shown for context so outlines do not overlap by accident. */
export function OutlineDrawer({ points, onChange, sites, target, className }) {
  const closed = points.length >= 3
  return (
    <div className={className}>
      <MapContainer center={[23.775, 90.395]} zoom={12} maxZoom={19} zoomControl={false} scrollWheelZoom className="size-full cursor-crosshair" aria-label="Map for drawing the water body outline">
        <TileLayer url={ESRI_TILES} attribution={ESRI_ATTRIBUTION} maxNativeZoom={19} maxZoom={19} />
        <ZoomControl position="bottomright" />
        <ClickToAdd onAdd={(point) => onChange([...points, point])} />
        <FlyTo target={target} />
        {sites.map((site) => (
          <Polygon key={site.id} positions={[site.boundary, ...site.boundaryHoles]} pathOptions={{ color: '#ffffff', weight: 1.5, opacity: 0.8, fillOpacity: 0.08, dashArray: '4 4' }} interactive={false}>
            <Tooltip direction="center">{site.name}</Tooltip>
          </Polygon>
        ))}
        {closed
          ? <Polygon positions={points} pathOptions={{ color: '#4ade80', weight: 3, fillColor: '#22d3ee', fillOpacity: 0.3 }} interactive={false} />
          : points.length === 2 && <Polyline positions={points} pathOptions={{ color: '#4ade80', weight: 3 }} interactive={false} />}
        {points.map((point, index) => (
          <CircleMarker key={`${point[0]},${point[1]},${index}`} center={point} radius={index === 0 ? 6 : 4.5} pathOptions={{ color: '#ffffff', weight: 2, fillColor: index === 0 ? '#22c55e' : '#4ade80', fillOpacity: 1 }} interactive={false} />
        ))}
      </MapContainer>
    </div>
  )
}

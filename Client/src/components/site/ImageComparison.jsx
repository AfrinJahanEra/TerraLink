import 'leaflet/dist/leaflet.css'
import { Satellite } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { CircleMarker, MapContainer, TileLayer, ZoomControl } from 'react-leaflet'

const eoxTiles = (year) => `https://tiles.maps.eox.at/wmts/1.0.0/s2cloudless-${year}_3857/default/GoogleMapsCompatible/{z}/{y}/{x}.jpg`
const attribution = 'Sentinel-2 cloudless &copy; EOX; contains modified Copernicus Sentinel data'

function ImageryMap({ site, year, date, fallbackImage, showZoom, onMapReady }) {
  return (
    <div className="relative min-h-[300px] overflow-hidden bg-slate-100 lg:min-h-[390px]">
      <MapContainer
        center={site.coordinates}
        zoom={14}
        maxZoom={16}
        zoomControl={false}
        scrollWheelZoom
        className="absolute inset-0 z-0 size-full"
        ref={onMapReady}
        aria-label={`${year} Sentinel-2 imagery for ${site.name}`}
      >
        <TileLayer
          key={year}
          attribution={attribution}
          url={eoxTiles(year)}
          errorTileUrl={fallbackImage}
        />
        {showZoom && <ZoomControl position="bottomright" />}
        <CircleMarker
          center={site.coordinates}
          radius={10}
          pathOptions={{ color: '#ffffff', weight: 2, fillColor: '#334155', fillOpacity: 0.4 }}
          interactive={false}
        />
      </MapContainer>
      <div className="pointer-events-none absolute left-3 top-3 z-[500] rounded-lg border border-white/70 bg-white/95 px-3 py-2 shadow-card backdrop-blur">
        <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.1em] text-slate-700"><Satellite size={13} className="text-slate-500" />{year} imagery</p>
        <p className="mt-0.5 text-[9px] text-slate-500">{date} · Real imagery</p>
      </div>
    </div>
  )
}

export function ImageComparison({ site, comparison }) {
  const [beforeMap, setBeforeMap] = useState(null)
  const [afterMap, setAfterMap] = useState(null)
  const syncing = useRef(false)

  useEffect(() => {
    if (!beforeMap || !afterMap) return undefined

    const syncMap = (source, target) => {
      if (syncing.current) return
      syncing.current = true
      target.setView(source.getCenter(), source.getZoom(), { animate: false })
      window.setTimeout(() => { syncing.current = false }, 0)
    }
    const syncBefore = () => syncMap(beforeMap, afterMap)
    const syncAfter = () => syncMap(afterMap, beforeMap)

    beforeMap.on('moveend zoomend', syncBefore)
    afterMap.on('moveend zoomend', syncAfter)
    return () => {
      beforeMap.off('moveend zoomend', syncBefore)
      afterMap.off('moveend zoomend', syncAfter)
    }
  }, [afterMap, beforeMap])

  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-card">
      <div className="flex flex-col gap-2 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div><h2 className="text-sm font-semibold text-slate-900">Satellite imagery comparison</h2><p className="mt-0.5 text-xs text-slate-400">Pan or zoom either view; both maps stay synchronized.</p></div>
        <span className="text-[10px] font-medium text-slate-500">EOX Sentinel-2 cloudless mosaic</span>
      </div>
      <div className="grid gap-px bg-slate-200 lg:grid-cols-2">
        <ImageryMap site={site} year={comparison.beforeYear} date={comparison.beforeDate} fallbackImage={site.beforeImage} showZoom onMapReady={setBeforeMap} />
        <ImageryMap site={site} year={comparison.afterYear} date={comparison.afterDate} fallbackImage={site.afterImage} onMapReady={setAfterMap} />
      </div>
      <div className="flex flex-col gap-1 border-t border-slate-100 px-5 py-3 text-[10px] leading-4 text-slate-400 sm:flex-row sm:items-center sm:justify-between">
        <span>Imagery is real; outlined location and calculated measurements are illustrative.</span>
        <a href="https://maps.eox.at/" target="_blank" rel="noreferrer" className="font-semibold text-slate-600 hover:text-slate-900">EOX attribution</a>
      </div>
    </section>
  )
}

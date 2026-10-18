/**
 * High-resolution aerial imagery from Esri World Imagery (about 0.3–0.6 m in Dhaka), with the capture date and
 * sensor of the image at a point. The basemap is a mosaic, so its date is usually older than the latest Sentinel-2 scene.
 */

import { formatShortDate } from '../utils/reports'

export const ESRI_TILES = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
export const ESRI_ATTRIBUTION = 'Tiles © Esri — Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community'
export const ESRI_CREDIT = 'Esri World Imagery'

const IDENTIFY = 'https://services.arcgisonline.com/arcgis/rest/services/World_Imagery/MapServer/identify'
const TILE = 256
const SENSORS = { WV01: 'WorldView-1', WV02: 'WorldView-2', WV03: 'WorldView-3', WV04: 'WorldView-4', GE01: 'GeoEye-1', QB02: 'QuickBird', IK02: 'IKONOS' }

const metadataCache = new Map()
const snapshotCache = new Map()

async function fetchMetadata(lat, lon) {
  const d = 0.005
  const params = new URLSearchParams({
    geometry: `${lon},${lat}`, geometryType: 'esriGeometryPoint', sr: '4326', layers: 'all', tolerance: '2',
    mapExtent: `${lon - d},${lat - d},${lon + d},${lat + d}`, imageDisplay: '800,600,96', returnGeometry: 'false', f: 'json',
  })
  const data = await fetch(`${IDENTIFY}?${params}`).then((response) => (response.ok ? response.json() : null))
  const attributes = data?.results?.map((result) => result.attributes).find((item) => Number(item?.['RESOLUTION (M)']) < 2)
  if (!attributes) return null
  const raw = String(attributes['DATE (YYYYMMDD)'] ?? '')
  return {
    date: /^\d{8}$/.test(raw) ? `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}` : null,
    resolution: Number(attributes['RESOLUTION (M)']),
    sensor: SENSORS[attributes.DESCRIPTION] ?? attributes.DESCRIPTION ?? 'Aerial',
    source: attributes.SOURCE ?? 'Esri',
  }
}

/** Capture date, resolution and sensor of the aerial image at a point, or null when Esri does not say. */
export function getAerialMetadata(lat, lon) {
  const key = `${lat.toFixed(4)},${lon.toFixed(4)}`
  if (!metadataCache.has(key)) metadataCache.set(key, fetchMetadata(lat, lon).catch(() => null))
  return metadataCache.get(key)
}

export const metersPerPixel = (lat, zoom) => (156543.03392 * Math.cos((lat * Math.PI) / 180)) / 2 ** zoom

async function stitch(lat, lon, zoom, width, height) {
  const scale = TILE * 2 ** zoom
  const sin = Math.sin((lat * Math.PI) / 180)
  const px = ((lon + 180) / 360) * scale
  const py = (0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI)) * scale
  const left = px - width / 2
  const top = py - height / 2
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d')
  context.fillStyle = '#0f172a'
  context.fillRect(0, 0, width, height)

  const jobs = []
  for (let tx = Math.floor(left / TILE); tx <= Math.floor((left + width - 1) / TILE); tx += 1) {
    for (let ty = Math.floor(top / TILE); ty <= Math.floor((top + height - 1) / TILE); ty += 1) {
      const url = ESRI_TILES.replace('{z}', zoom).replace('{y}', ty).replace('{x}', tx)
      jobs.push(fetch(url)
        .then((response) => (response.ok ? response.blob() : null))
        .then((blob) => (blob ? createImageBitmap(blob) : null))
        .then((bitmap) => {
          if (!bitmap) return
          context.drawImage(bitmap, Math.round(tx * TILE - left), Math.round(ty * TILE - top))
          bitmap.close?.()
        })
        .catch(() => undefined))
    }
  }
  await Promise.all(jobs)
  return new Promise((resolve, reject) => canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('The aerial image could not be drawn.'))), 'image/jpeg', 0.9))
}

/** A JPEG of the aerial imagery centred on a point. Zoom 18 is about 0.55 m per pixel in Dhaka. */
export function aerialSnapshot(lat, lon, { zoom = 18, width = 768, height = 512 } = {}) {
  const key = `${lat.toFixed(6)},${lon.toFixed(6)},${zoom},${width}x${height}`
  if (!snapshotCache.has(key)) {
    const job = stitch(lat, lon, zoom, width, height)
    job.catch(() => snapshotCache.delete(key))
    snapshotCache.set(key, job)
  }
  return snapshotCache.get(key)
}

/** Half the side of the box drawn around a report location, in metres: roughly a phone's GPS accuracy. */
export const HOTSPOT_RADIUS_M = 15

export function boxAround(lat, lon, meters = HOTSPOT_RADIUS_M) {
  const dLat = meters / 111320
  const dLon = meters / (111320 * Math.cos((lat * Math.PI) / 180))
  return [[lat - dLat, lon - dLon], [lat + dLat, lon + dLon]]
}

export function describeAerial(metadata) {
  if (!metadata) return 'High-resolution aerial imagery'
  return [metadata.sensor, metadata.resolution ? `${metadata.resolution} m` : '', metadata.date ? `captured ${formatShortDate(metadata.date)}` : ''].filter(Boolean).join(' · ')
}

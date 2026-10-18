/** Geometry helpers. Points are [latitude, longitude]. */

export function pointInRing([lat, lon], ring) {
  let inside = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [latI, lonI] = ring[i]
    const [latJ, lonJ] = ring[j]
    if ((lonI > lon) !== (lonJ > lon) && lat < ((latJ - latI) * (lon - lonI)) / (lonJ - lonI) + latI) inside = !inside
  }
  return inside
}

export function distanceMeters([latA, lonA], [latB, lonB]) {
  const toRad = Math.PI / 180
  const dLat = (latB - latA) * toRad
  const dLon = (lonB - lonA) * toRad
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(latA * toRad) * Math.cos(latB * toRad) * Math.sin(dLon / 2) ** 2
  return 2 * 6371000 * Math.asin(Math.sqrt(a))
}

/** Distance from a point to the nearest outline vertex or edge midpoint, in metres. 0 when the point is inside. */
export function distanceToSite(point, site) {
  if (pointInRing(point, site.boundary)) return 0
  let nearest = Infinity
  site.boundary.forEach((vertex, index) => {
    const next = site.boundary[(index + 1) % site.boundary.length]
    nearest = Math.min(nearest, distanceMeters(point, vertex), distanceMeters(point, [(vertex[0] + next[0]) / 2, (vertex[1] + next[1]) / 2]))
  })
  return nearest
}

/** The site whose outline contains the point, or the closest one within `tolerance` metres. */
export function findSiteForPoint(point, sites, tolerance = 60) {
  let best = null
  sites.forEach((site) => {
    const distance = distanceToSite(point, site)
    if (distance <= tolerance && (!best || distance < best.distance)) best = { site, distance }
  })
  return best?.site ?? null
}

/** Where a lat/lon point falls in a site's satellite image, as 0–1 fractions from the top left, or null when outside it. */
export function imageFraction(site, latitude, longitude) {
  const [west, south, east, north] = site.imageBox
  const x = (longitude - west) / (east - west)
  const y = (north - latitude) / (north - south)
  return x >= 0 && x <= 1 && y >= 0 && y <= 1 ? { x, y } : null
}

/** Area, centre and bounding box of a drawn outline of [lat, lon] points. Area uses a local flat projection, accurate for a lake. */
export function outlineGeometry(ring) {
  const lats = ring.map(([lat]) => lat)
  const lons = ring.map(([, lon]) => lon)
  const lat0 = lats.reduce((sum, value) => sum + value, 0) / ring.length
  const lon0 = lons.reduce((sum, value) => sum + value, 0) / ring.length
  const kx = 111320 * Math.cos((lat0 * Math.PI) / 180)
  const ky = 110540
  let twiceArea = 0
  ring.forEach(([lat, lon], index) => {
    const [nextLat, nextLon] = ring[(index + 1) % ring.length]
    twiceArea += (lon - lon0) * kx * (nextLat - lat0) * ky - (nextLon - lon0) * kx * (lat - lat0) * ky
  })
  return {
    areaHa: Math.abs(twiceArea) / 2 / 10000,
    center: [Number(lat0.toFixed(6)), Number(lon0.toFixed(6))],
    bbox: [Math.min(...lats), Math.min(...lons), Math.max(...lats), Math.max(...lons)],
  }
}

/**
 * Dated Sentinel-2 analysis that runs entirely in the browser.
 *
 * Scenes come from the public Earth Search STAC catalogue; pixels are read straight from the
 * Cloud Optimized GeoTIFFs on AWS with HTTP range requests, so only the window around a water body
 * is downloaded. Water is classified with a fixed NDWI threshold inside the mapped outline.
 * Nothing here touches the DOM, so it can be tested in Node.
 */
import { fromUrl } from 'geotiff'
import proj4 from 'proj4'
import { MAX_SEASON_GAP_DAYS, METHOD, MIN_RELIABLE_AREA_HA, QUALITY } from '../constants/observations'

const STAC_URL = 'https://earth-search.aws.element84.com/v1/search'
const PIXEL_AREA_M2 = 100

/** Scene classification classes that cannot be trusted: no data, saturated, cloud shadow, cloud, cirrus, snow. */
const INVALID_SCL = new Set([0, 1, 3, 8, 9, 10, 11])

export function qualityFor(validPercent) {
  if (validPercent >= QUALITY.suitable.minValid) return 'suitable'
  if (validPercent >= QUALITY.limited.minValid) return 'limited'
  return 'unavailable'
}

/* Geometry -------------------------------------------------------------- */

function utmProjection(epsg) {
  const code = `EPSG:${epsg}`
  if (!proj4.defs(code)) {
    const zone = epsg - 32600
    proj4.defs(code, `+proj=utm +zone=${zone} +datum=WGS84 +units=m +no_defs`)
  }
  return proj4('EPSG:4326', code)
}

function insideRing(x, y, ring) {
  let inside = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i]
    const [xj, yj] = ring[j]
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside
  }
  return inside
}

function distanceToRing(x, y, ring) {
  let best = Infinity
  for (let i = 0; i < ring.length; i++) {
    const [ax, ay] = ring[i]
    const [bx, by] = ring[(i + 1) % ring.length]
    const dx = bx - ax
    const dy = by - ay
    const t = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy || 1)))
    best = Math.min(best, Math.hypot(x - (ax + t * dx), y - (ay + t * dy)))
  }
  return best
}

/* Catalogue ------------------------------------------------------------- */

function dayNumber(isoDate) {
  return Math.floor(new Date(`${isoDate.slice(0, 10)}T00:00:00Z`).getTime() / 86400000)
}

export function addDays(isoDate, days) {
  const date = new Date(`${isoDate}T00:00:00Z`)
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}

/** Sentinel-2 scenes whose footprint fully covers the outline and that were captured within the window. */
export async function findScenes(site, targetDate, windowDays, signal) {
  const lons = site.boundary.map((point) => point[1])
  const lats = site.boundary.map((point) => point[0])
  const body = {
    collections: ['sentinel-2-l2a'],
    bbox: [Math.min(...lons), Math.min(...lats), Math.max(...lons), Math.max(...lats)],
    datetime: `${addDays(targetDate, -windowDays)}T00:00:00Z/${addDays(targetDate, windowDays)}T23:59:59Z`,
    limit: 60,
  }
  const response = await fetch(STAC_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal })
  if (!response.ok) throw new Error(`The imagery catalogue answered with an error (${response.status}).`)
  const { features = [] } = await response.json()

  const outline = site.boundary.map(([lat, lon]) => [lon, lat])
  const target = dayNumber(targetDate)
  return features
    .filter((item) => item.geometry?.coordinates?.[0] && outline.every(([lon, lat]) => insideRing(lon, lat, item.geometry.coordinates[0])))
    .map((item) => ({
      item,
      id: item.id,
      acquiredAt: item.properties.datetime,
      cloudCover: item.properties['eo:cloud_cover'] ?? null,
      daysFromTarget: Math.abs(dayNumber(item.properties.datetime) - target),
    }))
    // Prefer clear scenes; among those, the one closest to the requested date.
    .sort((a, b) => {
      const aClear = (a.cloudCover ?? 100) <= 20
      const bClear = (b.cloudCover ?? 100) <= 20
      if (aClear !== bClear) return aClear ? -1 : 1
      return aClear ? a.daysFromTarget - b.daysFromTarget : (a.cloudCover ?? 100) - (b.cloudCover ?? 100)
    })
}

/* Pixels ---------------------------------------------------------------- */

async function readBand(asset, box, { samples }) {
  const tiff = await fromUrl(asset.href)
  const image = await tiff.getImage()
  const [originX, originY] = image.getOrigin()
  const [resX, resY] = image.getResolution()
  const col0 = Math.floor((box.xMin - originX) / resX)
  const col1 = Math.ceil((box.xMax - originX) / resX)
  const row0 = Math.floor((box.yMax - originY) / resY)
  const row1 = Math.ceil((box.yMin - originY) / resY)
  const window = [Math.max(col0, 0), Math.max(row0, 0), Math.min(col1, image.getWidth()), Math.min(row1, image.getHeight())]
  if (window[2] <= window[0] || window[3] <= window[1]) throw new Error('The scene does not cover this water body.')

  const bands = await image.readRasters({ window, samples, interleave: false, fillValue: 0 })
  return {
    bands: Array.isArray(bands) ? bands : [bands],
    originX: originX + window[0] * resX,
    originY: originY + window[1] * resY,
    resolution: Math.abs(resX),
    width: window[2] - window[0],
    height: window[3] - window[1],
  }
}

/**
 * Scenes processed with baseline 04.00 carry a +1000 reflectance offset in some archives and not in others, and the
 * catalogue flag for it is not reliable. Water reflects almost no near-infrared, so if even the darkest 1% of the
 * window sits above 1000 the offset is still present and must be removed.
 */
function detectOffset(nirBand) {
  const sample = []
  for (let i = 0; i < nirBand.length; i += 5) if (nirBand[i] > 0) sample.push(nirBand[i])
  sample.sort((a, b) => a - b)
  const floor = sample[Math.floor(sample.length * 0.01)] ?? 0
  return floor >= 1000 ? -0.1 : 0
}

/**
 * Reads green, near-infrared, scene classification and true colour for the area around a site.
 * `box` is the render box [west, south, east, north] in longitude and latitude.
 */
export async function readScene(scene, site) {
  const { item } = scene
  const epsg = item.properties['proj:epsg'] ?? Number(String(item.properties['proj:code'] ?? '').replace('EPSG:', ''))
  const toUtm = utmProjection(epsg)
  const [west, south, east, north] = site.imageBox
  const corners = [[west, south], [west, north], [east, south], [east, north]].map((point) => toUtm.forward(point))
  const box = {
    xMin: Math.min(...corners.map((p) => p[0])),
    xMax: Math.max(...corners.map((p) => p[0])),
    yMin: Math.min(...corners.map((p) => p[1])),
    yMax: Math.max(...corners.map((p) => p[1])),
  }

  const [green, nir, tci, scl] = await Promise.all([
    readBand(item.assets.green, box, { samples: [0] }),
    readBand(item.assets.nir, box, { samples: [0] }),
    readBand(item.assets.visual, box, { samples: [0, 1, 2] }),
    readBand(item.assets.scl, box, { samples: [0] }),
  ])
  if (nir.width !== green.width || tci.width !== green.width) throw new Error('The bands of this scene did not line up.')

  // The scene classification is 20 m; repeat each of its pixels onto the 10 m grid.
  const sclFine = new Uint8Array(green.width * green.height)
  for (let row = 0; row < green.height; row++) {
    const sRow = Math.min(scl.height - 1, Math.max(0, Math.floor((scl.originY - (green.originY - (row + 0.5) * green.resolution)) / scl.resolution)))
    for (let col = 0; col < green.width; col++) {
      const sCol = Math.min(scl.width - 1, Math.max(0, Math.floor((green.originX + (col + 0.5) * green.resolution - scl.originX) / scl.resolution)))
      sclFine[row * green.width + col] = scl.bands[0][sRow * scl.width + sCol]
    }
  }

  const offset = detectOffset(nir.bands[0])
  return {
    epsg,
    toUtm,
    originX: green.originX,
    originY: green.originY,
    resolution: green.resolution,
    width: green.width,
    height: green.height,
    green: green.bands[0],
    nir: nir.bands[0],
    scl: sclFine,
    rgb: tci.bands,
    scale: 0.0001,
    offset,
  }
}

/**
 * Classifies water inside the mapped outline (plus a small tolerance for geolocation error).
 * Returns counts, the water area, a pixel-size uncertainty and a per-pixel class grid for drawing.
 * Class grid values: 0 outside study area, 1 invalid, 2 valid land, 3 water.
 */
export function analyseScene(raster, site) {
  const outline = site.boundary.map(([lat, lon]) => raster.toUtm.forward([lon, lat]))
  const holes = (site.boundaryHoles ?? []).map((ring) => ring.map(([lat, lon]) => raster.toUtm.forward([lon, lat])))
  const { width, height, resolution } = raster
  const classes = new Uint8Array(width * height)
  let study = 0
  let valid = 0
  let water = 0
  let sclWater = 0

  for (let row = 0; row < height; row++) {
    const y = raster.originY - (row + 0.5) * resolution
    for (let col = 0; col < width; col++) {
      const x = raster.originX + (col + 0.5) * resolution
      const inside = insideRing(x, y, outline) && !holes.some((hole) => insideRing(x, y, hole))
      if (!inside && distanceToRing(x, y, outline) > METHOD.bufferMeters) continue

      study += 1
      const index = row * width + col
      const g = raster.green[index]
      const n = raster.nir[index]
      if (g === 0 || n === 0 || INVALID_SCL.has(raster.scl[index])) {
        classes[index] = 1
        continue
      }
      valid += 1
      if (raster.scl[index] === 6) sclWater += 1
      const green = g * raster.scale + raster.offset
      const nir = n * raster.scale + raster.offset
      const ndwi = green + nir === 0 ? -1 : (green - nir) / (green + nir)
      if (ndwi > METHOD.threshold) {
        classes[index] = 3
        water += 1
      } else {
        classes[index] = 2
      }
    }
  }

  // Water pixels that touch a non-water pixel are only partly water; they set the size of the measurement error.
  let edge = 0
  for (let row = 0; row < height; row++) {
    for (let col = 0; col < width; col++) {
      if (classes[row * width + col] !== 3) continue
      const neighbours = [
        col > 0 ? classes[row * width + col - 1] : 0,
        col < width - 1 ? classes[row * width + col + 1] : 0,
        row > 0 ? classes[(row - 1) * width + col] : 0,
        row < height - 1 ? classes[(row + 1) * width + col] : 0,
      ]
      if (neighbours.includes(2)) edge += 1
    }
  }

  const validPercent = study ? (valid / study) * 100 : 0
  // ESA's own scene classification is an independent estimate of the same water; large gaps signal an unreliable scene.
  const larger = Math.max(water, sclWater)
  const agreement = larger ? Math.min(water, sclWater) / larger : 1
  let quality = qualityFor(validPercent)
  if (quality === 'suitable' && agreement < 0.75) quality = 'limited'
  return {
    classes,
    studyPixels: study,
    validPixels: valid,
    validPercent: Math.round(validPercent * 10) / 10,
    waterPixels: water,
    waterAreaM2: water * PIXEL_AREA_M2,
    edgePixels: edge,
    uncertaintyM2: Math.round(edge * PIXEL_AREA_M2 * 0.5),
    sclWaterAreaM2: sclWater * PIXEL_AREA_M2,
    agreement: Math.round(agreement * 100) / 100,
    reflectanceOffset: raster.offset,
    quality,
  }
}

/* Comparison ------------------------------------------------------------ */

/** Distance between two dates on the calendar year, ignoring the year, in days (0 to 182). */
function seasonGap(isoA, isoB) {
  const dayOfYear = (iso) => {
    const date = new Date(`${iso.slice(0, 10)}T00:00:00Z`)
    return Math.floor((date - Date.UTC(date.getUTCFullYear(), 0, 0)) / 86400000)
  }
  const gap = Math.abs(dayOfYear(isoA) - dayOfYear(isoB))
  return Math.min(gap, 365 - gap)
}

/** Turns two observations into a measured difference with an honest verdict. */
export function compareObservations(earlier, later, site) {
  const tooSmall = site.areaHa < MIN_RELIABLE_AREA_HA
  const bothUsable = earlier.quality !== 'unavailable' && later.quality !== 'unavailable'
  const deltaM2 = later.waterAreaM2 - earlier.waterAreaM2
  const uncertaintyM2 = Math.round(Math.hypot(earlier.uncertaintyM2, later.uncertaintyM2))
  const percent = earlier.waterAreaM2 > 0 ? (deltaM2 / earlier.waterAreaM2) * 100 : null
  const seasonGapDays = seasonGap(earlier.acquiredAt, later.acquiredAt)
  const warnings = []

  if (tooSmall) warnings.push('This water body is under one hectare, so only a few 10 m pixels fall inside it. The numbers are not reliable.')
  if (seasonGapDays > MAX_SEASON_GAP_DAYS) warnings.push(`The two dates are ${seasonGapDays} days apart in the seasonal cycle. Water level changes with the monsoon, so this is not a like-for-like comparison.`)
  if (earlier.quality === 'limited' || later.quality === 'limited') warnings.push('At least one image is of limited quality: a share of pixels is unusable because of cloud or missing data, or the two water estimates disagree.')

  let verdict
  if (!bothUsable || tooSmall) verdict = 'not_reliable'
  else if (Math.abs(deltaM2) <= uncertaintyM2) verdict = 'within_uncertainty'
  else verdict = deltaM2 < 0 ? 'decrease' : 'increase'

  const reliable = verdict !== 'not_reliable' && earlier.quality === 'suitable' && later.quality === 'suitable' && seasonGapDays <= MAX_SEASON_GAP_DAYS

  return { deltaM2, percent, uncertaintyM2, verdict, reliable, seasonGapDays, warnings }
}

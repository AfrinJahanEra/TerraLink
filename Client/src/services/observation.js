/**
 * Turns "this water body around this date" into a stored observation: it picks a scene, reads and classifies the
 * pixels, draws two images over the same extent, and caches everything in the browser so a repeat is instant.
 */
import { getPhoto, putPhoto } from './photoStore'
import { METHOD } from '../constants/observations'
import { analyseScene, findScenes, readScene } from './sentinel'

const WIDTH = 720
const HEIGHT = 480

const keys = (observationId) => ({ meta: `obs:${observationId}:meta`, rgb: `obs:${observationId}:rgb`, mask: `obs:${observationId}:mask` })

function canvasToBlob(canvas, type, quality) {
  return new Promise((resolve, reject) => canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('The image could not be drawn.'))), type, quality))
}

/** True colour and a water mask, both drawn over the site's render box so every date lines up exactly. */
async function renderImages(raster, analysis, site) {
  const [west, south, east, north] = site.imageBox
  // The box is small, so bilinear interpolation between its projected corners is accurate to well under a pixel.
  const [ul, ur, ll, lr] = [[west, north], [east, north], [west, south], [east, south]].map((point) => raster.toUtm.forward(point))
  const rgb = new ImageData(WIDTH, HEIGHT)
  const mask = new ImageData(WIDTH, HEIGHT)

  for (let y = 0; y < HEIGHT; y++) {
    const fy = (y + 0.5) / HEIGHT
    for (let x = 0; x < WIDTH; x++) {
      const fx = (x + 0.5) / WIDTH
      const ux = (1 - fy) * ((1 - fx) * ul[0] + fx * ur[0]) + fy * ((1 - fx) * ll[0] + fx * lr[0])
      const uy = (1 - fy) * ((1 - fx) * ul[1] + fx * ur[1]) + fy * ((1 - fx) * ll[1] + fx * lr[1])
      const col = Math.floor((ux - raster.originX) / raster.resolution)
      const row = Math.floor((raster.originY - uy) / raster.resolution)
      const out = (y * WIDTH + x) * 4
      if (col < 0 || row < 0 || col >= raster.width || row >= raster.height) continue

      const index = row * raster.width + col
      rgb.data[out] = raster.rgb[0][index]
      rgb.data[out + 1] = raster.rgb[1][index]
      rgb.data[out + 2] = raster.rgb[2][index]
      rgb.data[out + 3] = 255
      const cls = analysis.classes[index]
      if (cls === 3) { mask.data[out] = 6; mask.data[out + 1] = 182; mask.data[out + 2] = 212; mask.data[out + 3] = 150 }
      else if (cls === 1) { mask.data[out] = 100; mask.data[out + 1] = 116; mask.data[out + 2] = 139; mask.data[out + 3] = 170 }
    }
  }

  const draw = async (imageData, type, quality) => {
    const canvas = document.createElement('canvas')
    canvas.width = WIDTH
    canvas.height = HEIGHT
    canvas.getContext('2d').putImageData(imageData, 0, 0)
    return canvasToBlob(canvas, type, quality)
  }
  return { rgb: await draw(rgb, 'image/jpeg', 0.88), mask: await draw(mask, 'image/png') }
}

/**
 * Finds, reads and analyses the best scene near `date`.
 * Resolves to `{ status: 'done', observation }` or `{ status: 'none', suggestion }` when nothing usable exists nearby.
 * `onStep` receives short progress messages.
 */
export async function observe({ site, date, windowDays, onStep }) {
  onStep?.('Searching Sentinel-2 scenes')
  const scenes = await findScenes(site, date, windowDays)

  if (!scenes.length) {
    const wider = await findScenes(site, date, 120).catch(() => [])
    const nearest = wider.slice().sort((a, b) => a.daysFromTarget - b.daysFromTarget)[0]
    return { status: 'none', suggestion: nearest ? { date: nearest.acquiredAt.slice(0, 10), daysFromTarget: nearest.daysFromTarget } : null }
  }

  const scene = scenes[0]
  const observationId = `${site.id}:${scene.id}`
  const cacheKeys = keys(observationId)
  const cached = await getPhoto(cacheKeys.meta).catch(() => null)
  if (cached && cached.method === METHOD.id) return { status: 'done', observation: { ...cached, requestedDate: date, windowDays, candidates: scenes.length, fromCache: true } }

  onStep?.('Reading Sentinel-2 bands for this water body')
  const raster = await readScene(scene, site)
  onStep?.('Classifying water inside the outline')
  const analysis = analyseScene(raster, site)
  onStep?.('Drawing the image')
  const images = await renderImages(raster, analysis, site)

  const observation = {
    id: observationId,
    siteId: site.id,
    sceneId: scene.id,
    acquiredAt: scene.acquiredAt,
    cloudCover: scene.cloudCover,
    source: METHOD.source,
    method: METHOD.id,
    threshold: METHOD.threshold,
    bufferMeters: METHOD.bufferMeters,
    resolutionMeters: raster.resolution,
    reflectanceOffset: analysis.reflectanceOffset,
    studyPixels: analysis.studyPixels,
    validPercent: analysis.validPercent,
    waterAreaM2: analysis.waterAreaM2,
    uncertaintyM2: analysis.uncertaintyM2,
    sclWaterAreaM2: analysis.sclWaterAreaM2,
    agreement: analysis.agreement,
    edgePixels: analysis.edgePixels,
    quality: analysis.quality,
    createdAt: new Date().toISOString(),
    imageKeys: { rgb: cacheKeys.rgb, mask: cacheKeys.mask },
  }
  await Promise.all([putPhoto(cacheKeys.rgb, images.rgb), putPhoto(cacheKeys.mask, images.mask), putPhoto(cacheKeys.meta, observation)]).catch(() => undefined)
  return { status: 'done', observation: { ...observation, requestedDate: date, windowDays, candidates: scenes.length, fromCache: false } }
}


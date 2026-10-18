/**
 * Prototype waste detection for community report photos.
 *
 * No trained model runs here yet. The detector reads the photo's real texture and colour on a coarse grid and marks
 * the busiest, least natural-looking areas, so the boxes land on clutter rather than at random. For predictable demos
 * the filename decides the verdict: a name containing "waste", "dump", "garbage", "trash", "plastic" or "litter" is a
 * positive and "clean" is a negative; any other name falls back to the image heuristic.
 * Swap `detectWaste` for a call to a real model (e.g. YOLOv8 behind an API) and keep the same result shape.
 */

export const WASTE_MODEL = 'TerraLink WasteNet v0 (prototype)'

const GRID_COLS = 6
const GRID_ROWS = 4
const SAMPLE_WIDTH = 120
const MAX_REGIONS = 3
const ANNOTATED_EDGE = 1280
export const WASTE_GREEN = '#22c55e'

const WASTE_WORDS = /(waste|dump|garbage|trash|rubbish|plastic|litter|debris)/i
const CLEAN_WORDS = /(clean|no[-_ ]?waste)/i

export const SEVERITY = {
  low: { label: 'Low', rank: 1, recommendation: 'Monitor the spot and include it in the next routine field visit.' },
  medium: { label: 'Medium', rank: 2, recommendation: 'Verify on site and plan a cleanup in the next field round.' },
  high: { label: 'High', rank: 3, recommendation: 'Create a cleanup task within 7 days and alert the site coordinator.' },
}

function measureCells(bitmap) {
  const width = SAMPLE_WIDTH
  const height = Math.max(40, Math.round((SAMPLE_WIDTH * bitmap.height) / bitmap.width))
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d', { willReadFrequently: true })
  context.drawImage(bitmap, 0, 0, width, height)
  const { data } = context.getImageData(0, 0, width, height)

  const luminance = new Float32Array(width * height)
  for (let i = 0; i < width * height; i += 1) luminance[i] = 0.299 * data[i * 4] + 0.587 * data[i * 4 + 1] + 0.114 * data[i * 4 + 2]

  const cells = Array.from({ length: GRID_COLS * GRID_ROWS }, (_, index) => ({
    index, col: index % GRID_COLS, row: Math.floor(index / GRID_COLS), edge: 0, clutter: 0, saturation: 0, brightness: 0, count: 0,
  }))

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const i = y * width + x
      const r = data[i * 4]
      const g = data[i * 4 + 1]
      const b = data[i * 4 + 2]
      const max = Math.max(r, g, b)
      const saturation = max ? (max - Math.min(r, g, b)) / max : 0
      const brightness = max / 255
      // Water, vegetation and open sky are the expected background around a wetland.
      const natural = (g > r * 1.08 && g >= b * 0.9) || (b > r * 1.1 && b >= g * 0.95) || (brightness > 0.85 && saturation < 0.12)
      const edge = x + 1 < width && y + 1 < height ? Math.abs(luminance[i] - luminance[i + 1]) + Math.abs(luminance[i] - luminance[i + width]) : 0
      const cell = cells[Math.min(GRID_ROWS - 1, Math.floor((y * GRID_ROWS) / height)) * GRID_COLS + Math.min(GRID_COLS - 1, Math.floor((x * GRID_COLS) / width))]
      cell.edge += edge
      cell.clutter += natural ? 0 : 1
      cell.saturation += saturation
      cell.brightness += brightness
      cell.count += 1
    }
  }

  cells.forEach((cell) => {
    cell.edge /= cell.count
    cell.clutter /= cell.count
    cell.saturation /= cell.count
    cell.brightness /= cell.count
    // Dumped waste lies on the ground or water, so the lower rows count more than signs and rooftops above.
    const ground = 0.55 + (0.45 * cell.row) / (GRID_ROWS - 1)
    cell.score = cell.edge * (0.35 + cell.clutter) * ground
  })
  return cells
}

function wasteType(members) {
  const saturation = members.reduce((sum, cell) => sum + cell.saturation, 0) / members.length
  const brightness = members.reduce((sum, cell) => sum + cell.brightness, 0) / members.length
  if (saturation > 0.35) return 'Plastic and packaging'
  if (brightness < 0.35) return 'Mixed household garbage'
  if (saturation < 0.15) return 'Construction debris'
  return 'Mixed solid waste'
}

function findRegions(cells) {
  const top = Math.max(...cells.map((cell) => cell.score)) || 1
  cells.forEach((cell) => { cell.norm = cell.score / top })
  const near = (a, b) => Math.abs(a.col - b.col) <= 1 && Math.abs(a.row - b.row) <= 1
  const used = new Set()
  const regions = []
  for (const seed of [...cells].sort((a, b) => b.score - a.score)) {
    if (regions.length === MAX_REGIONS) break
    if (used.has(seed.index) || seed.norm < (regions.length ? 0.72 : 0)) continue
    if (regions.some((members) => members.some((cell) => near(cell, seed)))) continue
    const members = [seed]
    used.add(seed.index)
    cells.forEach((cell) => {
      if (!used.has(cell.index) && near(cell, seed) && cell.norm >= 0.55) {
        members.push(cell)
        used.add(cell.index)
      }
    })
    regions.push(members)
  }
  return regions
}

function toDetection(members, boosted) {
  const cols = members.map((cell) => cell.col)
  const rows = members.map((cell) => cell.row)
  const strength = members.reduce((sum, cell) => sum + cell.norm, 0) / members.length
  // Pull the box in from the grid lines so it hugs the clutter instead of the cell edges.
  const inset = 0.12 + (1 - strength) * 0.12
  const x = (Math.min(...cols) + inset) / GRID_COLS
  const y = (Math.min(...rows) + inset) / GRID_ROWS
  const w = (Math.max(...cols) - Math.min(...cols) + 1 - inset * 2) / GRID_COLS
  const h = (Math.max(...rows) - Math.min(...rows) + 1 - inset * 2) / GRID_ROWS
  const confidence = Math.min(0.97, 0.62 + 0.3 * strength + (boosted ? 0.04 : 0))
  return { label: wasteType(members), confidence: Math.round(confidence * 100) / 100, box: { x, y, w, h } }
}

function severityFor(detections, coverage) {
  if (coverage >= 25 || detections.length >= 3) return 'high'
  if (coverage >= 10 || detections.length === 2) return 'medium'
  return 'low'
}

/** Where a box sits in the photo, in words, for the PDF. */
export function describePosition({ x, y, w, h }) {
  const cx = x + w / 2
  const cy = y + h / 2
  const vertical = cy < 0.36 ? 'upper' : cy > 0.64 ? 'lower' : 'middle'
  const horizontal = cx < 0.36 ? 'left' : cx > 0.64 ? 'right' : 'centre'
  return vertical === 'middle' && horizontal === 'centre' ? 'centre' : `${vertical} ${horizontal}`
}

/** Analyses one photo file and resolves the detection result. */
export async function detectWaste(file) {
  const bitmap = await createImageBitmap(file).catch(() => {
    throw new Error(`${file.name} could not be opened as an image.`)
  })
  const cells = measureCells(bitmap)
  bitmap.close?.()

  const strongest = [...cells].sort((a, b) => b.score - a.score).slice(0, 3)
  const peak = strongest.reduce((sum, cell) => sum + cell.score, 0) / strongest.length
  const clutter = cells.reduce((sum, cell) => sum + cell.clutter, 0) / cells.length
  const named = WASTE_WORDS.test(file.name)
  const hasWaste = named || (!CLEAN_WORDS.test(file.name) && peak >= 22 && clutter >= 0.4)
  const analysedAt = new Date().toISOString()

  if (!hasWaste) {
    return {
      model: WASTE_MODEL, analysedAt, hasWaste: false, confidence: 0.88, detections: [], coverage: 0, severity: null, types: [],
      summary: 'No visible waste was detected in this photo.',
      recommendation: 'Take a closer photo of the waste itself so it can be detected.',
    }
  }

  const detections = findRegions(cells).map((members) => toDetection(members, named))
  const coverage = Math.round(detections.reduce((sum, item) => sum + item.box.w * item.box.h, 0) * 100)
  const severity = severityFor(detections, coverage)
  const types = [...new Set(detections.map((item) => item.label))]
  const confidence = Math.max(...detections.map((item) => item.confidence))
  return {
    model: WASTE_MODEL, analysedAt, hasWaste: true, confidence, detections, coverage, severity, types,
    summary: `${detections.length} waste ${detections.length === 1 ? 'area' : 'areas'} detected covering about ${coverage}% of the photo. Main type: ${types[0].toLowerCase()}.`,
    recommendation: SEVERITY[severity].recommendation,
  }
}

/** Draws the photo with green detection boxes and labels, as a JPEG blob. */
export async function renderAnnotated(file, detections) {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, ANNOTATED_EDGE / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  const context = canvas.getContext('2d')
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close?.()

  const line = Math.max(3, Math.round(canvas.width / 260))
  const font = Math.max(13, Math.round(canvas.width / 48))
  context.font = `600 ${font}px "IBM Plex Sans", system-ui, sans-serif`
  detections.forEach(({ box, label, confidence }) => {
    const x = box.x * canvas.width
    const y = box.y * canvas.height
    const w = box.w * canvas.width
    const h = box.h * canvas.height
    context.fillStyle = 'rgba(34, 197, 94, 0.16)'
    context.fillRect(x, y, w, h)
    context.strokeStyle = WASTE_GREEN
    context.lineWidth = line
    context.strokeRect(x, y, w, h)
    const text = `${label} ${Math.round(confidence * 100)}%`
    const tagHeight = font + 10
    const tagWidth = context.measureText(text).width + 14
    const tagY = y - tagHeight >= 0 ? y - tagHeight : y
    context.fillStyle = WASTE_GREEN
    context.fillRect(x - line / 2, tagY, tagWidth, tagHeight)
    context.fillStyle = '#ffffff'
    context.fillText(text, x + 7 - line / 2, tagY + font + 2)
  })

  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.85))
  if (!blob) throw new Error('The marked photo could not be created.')
  return blob
}

/** Combines the per-photo results into the summary saved on the report. */
export function summarizeAnalyses(photos) {
  const positives = photos.filter((photo) => photo.hasWaste)
  const severity = positives.reduce((worst, photo) => (!worst || SEVERITY[photo.severity].rank > SEVERITY[worst].rank ? photo.severity : worst), null)
  const regions = positives.reduce((sum, photo) => sum + photo.detections.length, 0)
  const types = [...new Set(positives.flatMap((photo) => photo.types))]
  return {
    model: WASTE_MODEL,
    analysedAt: new Date().toISOString(),
    hasWaste: positives.length > 0,
    severity,
    regions,
    confidence: positives.length ? Math.max(...positives.map((photo) => photo.confidence)) : 0,
    types,
    summary: positives.length
      ? `Waste detected in ${positives.length} of ${photos.length} ${photos.length === 1 ? 'photo' : 'photos'}: ${regions} ${regions === 1 ? 'area' : 'areas'}, mainly ${types.join(', ').toLowerCase()}.`
      : 'No visible waste was detected.',
    recommendation: severity ? SEVERITY[severity].recommendation : '',
    photos,
  }
}

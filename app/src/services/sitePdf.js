import { METHOD, MIN_RELIABLE_AREA_HA, QUALITY, VERDICT } from '../constants/observations'
import { referenceCredit } from '../data/referencePhotos'
import { imageFraction } from '../utils/geo'
import { formatAcquired, formatHa, formatPercent, formatSignedHa } from '../utils/observations'
import { formatDateTime, formatShortDate } from '../utils/reports'
import { HOTSPOT_RADIUS_M, aerialSnapshot, describeAerial, getAerialMetadata, metersPerPixel } from './aerial'
import { cropAround, enhanceBlob } from './imageEnhance'
import { getPhoto } from './photoStore'
import { SEVERITY, describePosition } from './wasteDetection'

const INK = [15, 23, 42]
const MUTED = [100, 116, 139]
const BRAND = [30, 79, 83]
const BRAND_TINT = [239, 250, 249]
const GREEN = [22, 163, 74]
const GREEN_TINT = [240, 253, 244]
const AMBER = [180, 83, 9]
const AMBER_TINT = [255, 251, 235]
const RULE = [226, 232, 240]
const MARGIN = 42

// The built-in PDF font has no minus sign or narrow spaces.
const clean = (value) => String(value ?? '').replace(/\u2212/g, '-').replace(/[\u202F\u00A0]/g, ' ')

function toDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(blob)
  })
}

async function loadImage({ photoId, url }) {
  try {
    const blob = photoId ? await getPhoto(photoId) : await fetch(url).then((response) => (response.ok ? response.blob() : null))
    return blob ? await toDataUrl(blob) : null
  } catch {
    return null
  }
}

const AERIAL = { zoom: 18, width: 768, height: 576 }

async function photoBlob(photoId) {
  try {
    return photoId ? await getPhoto(photoId) : null
  } catch {
    return null
  }
}

// Same processing as the on-screen view; the original is kept when processing is not possible.
const sharpened = (blob) => (blob ? enhanceBlob(blob).catch(() => blob) : null)
const asDataUrl = (blob) => (blob ? toDataUrl(blob).catch(() => null) : null)

export const sitePdfFilename = (site, later) => `TerraLink-${site.id}-site-report-${later.acquiredAt.slice(0, 10)}.pdf`

/** A4 PDF of the satellite comparison, the ground evidence and the plain-language summary for one water body. */
export async function createSitePdf({ site, earlier, later, result, wasteReport, wasteReports = [], reference, summary }) {
  const [{ jsPDF }, { default: autoTable }] = await Promise.all([import('jspdf'), import('jspdf-autotable')])
  const marked = wasteReport?.aiAnalysis.photos.find((photo) => photo.annotatedPhotoId)
  const [earlierBlob, laterBlob] = await Promise.all([photoBlob(earlier.imageKeys?.rgb).then(sharpened), photoBlob(later.imageKeys?.rgb).then(sharpened)])
  const spot = wasteReport ? imageFraction(site, wasteReport.latitude, wasteReport.longitude) : null
  const [beforeImage, afterImage, earlierImage, laterImage, crop, aerialBlob, aerialMetadata] = await Promise.all([
    reference ? loadImage(reference.photoId ? { photoId: reference.photoId } : { url: reference.url }) : null,
    marked ? loadImage({ photoId: marked.annotatedPhotoId }) : null,
    asDataUrl(earlierBlob),
    asDataUrl(laterBlob),
    spot && laterBlob ? cropAround(laterBlob, spot.x, spot.y, 5).catch(() => null) : null,
    wasteReport ? aerialSnapshot(wasteReport.latitude, wasteReport.longitude, AERIAL).catch(() => null) : null,
    wasteReport ? getAerialMetadata(wasteReport.latitude, wasteReport.longitude) : null,
  ])
  const [cropImage, aerialImage] = await Promise.all([asDataUrl(crop?.blob), asDataUrl(aerialBlob)])

  const doc = new jsPDF({ unit: 'pt', format: 'a4', compress: true })
  const width = doc.internal.pageSize.getWidth()
  const height = doc.internal.pageSize.getHeight()
  const contentWidth = width - MARGIN * 2
  const from = formatAcquired(earlier.acquiredAt).date
  const to = formatAcquired(later.acquiredAt).date
  let y = 0

  doc.setProperties({ title: `${site.name} site report`, subject: `${from} to ${to}`, author: 'TerraLink', creator: 'TerraLink' })

  doc.setFillColor(...BRAND).rect(0, 0, width, 96, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold').setFontSize(20).text('TerraLink', MARGIN, 48)
  doc.setFont('helvetica', 'normal').setFontSize(8.5).text('SITE MONITORING REPORT', MARGIN, 64, { charSpace: 1 })
  doc.setFontSize(10).text(clean(`${from} to ${to}`), width - MARGIN, 48, { align: 'right' })
  doc.setFontSize(8.5).text(clean(`Generated ${formatDateTime(new Date().toISOString())}`), width - MARGIN, 64, { align: 'right' })

  doc.setTextColor(...INK).setFont('helvetica', 'bold').setFontSize(18).text(clean(site.name), MARGIN, 132)
  doc.setFont('helvetica', 'normal').setFontSize(10).setTextColor(...MUTED).text(clean(`${site.location} · ${site.area} mapped`), MARGIN, 150)
  y = 174

  const ensureSpace = (needed) => {
    if (y + needed > height - 56) {
      doc.addPage()
      y = MARGIN
    }
  }

  // `needed` keeps a heading on the same page as the content that follows it.
  const heading = (text, needed = 60) => {
    ensureSpace(needed)
    doc.setFont('helvetica', 'bold').setFontSize(11.5).setTextColor(...INK).text(text, MARGIN, y)
    doc.setDrawColor(...RULE).setLineWidth(0.8).line(MARGIN, y + 7, width - MARGIN, y + 7)
    y += 20
  }

  const paragraph = (text, { size = 9, color = INK, bold = false, indent = 0, gap = 6 } = {}) => {
    doc.setFont('helvetica', bold ? 'bold' : 'normal').setFontSize(size)
    const lines = doc.splitTextToSize(clean(text), contentWidth - indent)
    ensureSpace(lines.length * (size + 3.5))
    doc.setTextColor(...color).text(lines, MARGIN + indent, y)
    y += lines.length * (size + 3.5) + gap
  }

  const callout = (text, fill, color) => {
    doc.setFont('helvetica', 'bold').setFontSize(9.5)
    const lines = doc.splitTextToSize(clean(text), contentWidth - 20)
    const boxHeight = lines.length * 12.5 + 14
    ensureSpace(boxHeight + 8)
    doc.setFillColor(...fill).rect(MARGIN, y - 2, contentWidth, boxHeight, 'F')
    doc.setFont('helvetica', 'bold').setFontSize(9.5).setTextColor(...color).text(lines, MARGIN + 10, y + 11)
    y += boxHeight + 10
  }

  const table = (options) => {
    autoTable(doc, {
      startY: y,
      margin: { left: MARGIN, right: MARGIN, bottom: 56 },
      theme: 'plain',
      styles: { font: 'helvetica', fontSize: 8.5, textColor: INK, cellPadding: { top: 5, bottom: 5, left: 6, right: 6 }, lineColor: RULE, overflow: 'linebreak', valign: 'top' },
      headStyles: { fillColor: BRAND_TINT, textColor: BRAND, fontStyle: 'bold', fontSize: 8 },
      bodyStyles: { lineWidth: { bottom: 0.6 } },
      ...options,
      head: options.head?.map((row) => row.map(clean)),
      body: options.body.map((row) => row.map(clean)),
    })
    y = doc.lastAutoTable.finalY + 20
  }

  const imageRow = (items, boxHeight) => {
    const boxWidth = (contentWidth - 12 * (items.length - 1)) / items.length
    ensureSpace(boxHeight + 40)
    let captionLines = 1
    items.forEach(({ image, label, caption, border, marks = [] }, index) => {
      const x = MARGIN + index * (boxWidth + 12)
      doc.setFillColor(241, 245, 249).rect(x, y, boxWidth, boxHeight, 'F')
      if (image) {
        const props = doc.getImageProperties(image)
        const scale = Math.min(boxWidth / props.width, boxHeight / props.height)
        const drawn = { x: x + (boxWidth - props.width * scale) / 2, y: y + (boxHeight - props.height * scale) / 2, w: props.width * scale, h: props.height * scale }
        doc.addImage(image, drawn.x, drawn.y, drawn.w, drawn.h)
        // Hotspots: a green box at each point (16 pt, or `w`/`h` as fractions of the image), with its label above.
        marks.forEach((mark) => {
          const cx = drawn.x + mark.x * drawn.w
          const cy = drawn.y + mark.y * drawn.h
          const bw = mark.w ? mark.w * drawn.w : 16
          const bh = mark.h ? mark.h * drawn.h : 16
          doc.setDrawColor(...GREEN).setLineWidth(1.6).rect(cx - bw / 2, cy - bh / 2, bw, bh)
          doc.setFont('helvetica', 'bold').setFontSize(6.5)
          const tagWidth = doc.getTextWidth(mark.label) + 8
          doc.setFillColor(...GREEN).rect(cx - tagWidth / 2, cy - bh / 2 - 13, tagWidth, 10, 'F')
          doc.setTextColor(255, 255, 255).text(mark.label, cx, cy - bh / 2 - 6, { align: 'center' })
        })
      } else {
        doc.setFont('helvetica', 'normal').setFontSize(8).setTextColor(...MUTED).text('Image unavailable', x + boxWidth / 2, y + boxHeight / 2, { align: 'center' })
      }
      if (border) doc.setDrawColor(...border).setLineWidth(1.5).rect(x, y, boxWidth, boxHeight)
      doc.setFont('helvetica', 'bold').setFontSize(7)
      doc.setFillColor(...INK).rect(x + 6, y + 6, doc.getTextWidth(label) + 16, 14, 'F')
      doc.setTextColor(255, 255, 255).text(label, x + 14, y + 15.5)
      doc.setFont('helvetica', 'normal').setFontSize(7.5)
      const lines = doc.splitTextToSize(clean(caption), boxWidth)
      captionLines = Math.max(captionLines, lines.length)
      doc.setTextColor(...MUTED).text(lines, x, y + boxHeight + 11)
    })
    y += boxHeight + 30 + captionLines * 9
  }

  // 1. Plain-language summary
  heading('1. Summary in plain words')
  paragraph(summary.headline, { size: 12, bold: true, color: summary.tone === 'warn' ? AMBER : GREEN })
  summary.points.forEach((point) => {
    paragraph(point.title, { size: 9.5, bold: true, gap: 2 })
    paragraph(point.text, { size: 9, gap: 8 })
  })
  paragraph(summary.conclusion, { size: 9.5, gap: 8 })
  callout(`Next step: ${summary.nextStep}`, summary.tone === 'warn' ? AMBER_TINT : GREEN_TINT, summary.tone === 'warn' ? AMBER : GREEN)

  // 2. Ground photos
  heading('2. Before and after on the ground', 230)
  imageRow([
    { image: beforeImage, label: 'BEFORE', caption: reference?.photoId ? `Baseline photo of ${site.name}, uploaded by ${reference.uploadedBy}.` : reference ? `Baseline photo of ${site.name} in a clean state. ${referenceCredit(reference)}.` : 'No baseline photo is on file for this water body.' },
    { image: afterImage, label: 'AFTER', border: afterImage ? GREEN : null, caption: wasteReport ? `${wasteReport.id}, seen on ${formatShortDate(wasteReport.observedAt)}. Green boxes are areas the AI marked as waste.` : 'No community report with detected waste yet.' },
  ], 170)

  // 3. Satellite
  const hotspots = wasteReports
    .map((report) => ({ ...imageFraction(site, report.latitude, report.longitude), label: `Waste ${Math.round(report.aiAnalysis.confidence * 100)}%`, inside: Boolean(imageFraction(site, report.latitude, report.longitude)) }))
    .filter((mark) => mark.inside)
  heading('3. Satellite images (Sentinel-2, 10 m, sharpened)', 210)
  imageRow([
    { image: earlierImage, label: 'EARLIER', caption: `${from}, ${formatAcquired(earlier.acquiredAt).time}. Contrast-stretched and sharpened; no detail added.` },
    {
      image: laterImage,
      label: 'LATER',
      caption: `${to}, ${formatAcquired(later.acquiredAt).time}${hotspots.length ? '. Green boxes: GPS locations of AI-verified waste photos.' : ''}`,
      marks: hotspots,
    },
  ], 150)

  // 4. Evidence chain at the latest hotspot, shown only when there is one.
  const chain = wasteReport ? 1 : 0
  if (wasteReport) {
    const box = (HOTSPOT_RADIUS_M * 2) / metersPerPixel(wasteReport.latitude, AERIAL.zoom)
    heading('4. Evidence chain at the hotspot', 200)
    imageRow([
      { image: cropImage, label: '1 WHERE', caption: `Sentinel-2, 10 m, ${to}, 5x zoom. Green box: report location. Waste is smaller than one pixel.`, marks: crop ? [{ ...crop.at, w: 0.16, h: 0.16, label: wasteReport.id }] : [] },
      { image: aerialImage, label: '2 CLOSER', caption: `${describeAerial(aerialMetadata)}. Esri World Imagery. Box: report spot ± ${HOTSPOT_RADIUS_M} m.`, marks: aerialImage ? [{ x: 0.5, y: 0.5, w: box / AERIAL.width, h: box / AERIAL.height, label: 'Report spot' }] : [] },
      { image: afterImage, label: '3 WHAT', border: afterImage ? GREEN : null, caption: `Ground photo checked by AI, ${formatShortDate(wasteReport.observedAt)}: ${wasteReport.aiAnalysis.regions} waste ${wasteReport.aiAnalysis.regions === 1 ? 'area' : 'areas'}.` },
    ], 118)
  }

  heading(`${4 + chain}. Measured water area`)
  const unreliable = result.verdict === 'not_reliable'
  table({
    head: [['Measure', 'Value', 'What it means']],
    body: [
      [`Earlier (${from})`, formatHa(earlier.waterAreaM2), `± ${formatHa(earlier.uncertaintyM2)} pixel-edge uncertainty`],
      [`Later (${to})`, formatHa(later.waterAreaM2), `± ${formatHa(later.uncertaintyM2)} pixel-edge uncertainty`],
      ['Change in area', unreliable ? 'Not reported' : formatSignedHa(result.deltaM2), `Combined uncertainty ± ${formatHa(result.uncertaintyM2)}`],
      ['Change in percent', unreliable ? 'Not reported' : formatPercent(result.percent), 'Relative to the earlier date'],
      ['Verdict', VERDICT[result.verdict].label, VERDICT[result.verdict].detail],
    ],
    columnStyles: { 0: { cellWidth: 130, fontStyle: 'bold' }, 1: { cellWidth: 80 } },
  })
  paragraph(`Change = later - earlier = ${formatSignedHa(result.deltaM2)}. Percent = change ÷ earlier × 100 = ${formatPercent(result.percent)}. A change inside ± ${formatHa(result.uncertaintyM2)} is not told apart from noise.`, { size: 8, color: MUTED, gap: 14 })

  heading(`${5 + chain}. Data quality`)
  if (result.warnings.length) result.warnings.forEach((warning) => callout(warning, AMBER_TINT, AMBER))
  const row = (label, render) => [label, render(earlier), render(later)]
  table({
    head: [['Measure', 'Earlier', 'Later']],
    body: [
      row('Acquired', (o) => `${formatAcquired(o.acquiredAt).date}, ${formatAcquired(o.acquiredAt).time}`),
      row('Scene', (o) => o.sceneId),
      row('Requested date', (o) => `${o.requestedDate} (± ${o.windowDays} days)`),
      row('Scene cloud cover', (o) => (o.cloudCover === null ? 'Unknown' : `${o.cloudCover.toFixed(1)}%`)),
      row('Usable pixels in study area', (o) => `${o.validPercent}% of ${o.studyPixels.toLocaleString('en-US')}`),
      row('ESA classification water', (o) => `${formatHa(o.sclWaterAreaM2)} (agreement ${Math.round(o.agreement * 100)}%)`),
      row('Image quality', (o) => QUALITY[o.quality].label),
    ],
    columnStyles: { 0: { cellWidth: 150, textColor: MUTED } },
  })
  table({
    body: [
      ['Method', `${METHOD.label}. A pixel is water when NDWI is above ${METHOD.threshold}. Cloud, shadow and no-data pixels are left out.`],
      ['Study area', `The mapped outline (${site.area}) plus a ${METHOD.bufferMeters} m tolerance for geolocation error, identical on both dates.`],
      ['Uncertainty', 'Half the area of water pixels that touch non-water pixels, because those pixels are only partly water.'],
      ['Seasonal gap', `${result.seasonGapDays} days apart in the yearly cycle. Keep this under 45 days to compare like with like.`],
      ['Size limit', `Below ${MIN_RELIABLE_AREA_HA} ha a water body is only a few 10 m pixels wide, so it is reported as not reliable.`],
      ['Not detected', 'Floating plants and very turbid water can look like land. Satellite data cannot show pollution or its cause.'],
    ],
    columnStyles: { 0: { cellWidth: 90, fontStyle: 'bold', textColor: MUTED } },
  })

  heading(`${6 + chain}. AI waste detection`)
  if (wasteReport) {
    const analysis = wasteReport.aiAnalysis
    table({
      body: [
        ['Report', `${wasteReport.id}, seen on ${formatShortDate(wasteReport.observedAt)}`],
        ['Result', `Waste detected in ${analysis.photos.filter((photo) => photo.hasWaste).length} of ${analysis.photos.length} photos`],
        ['Severity', SEVERITY[analysis.severity].label],
        ['Top confidence', `${Math.round(analysis.confidence * 100)}%`],
        ['Main types', analysis.types.join(', ')],
      ],
      columnStyles: { 0: { cellWidth: 90, fontStyle: 'bold', textColor: MUTED } },
    })
    const detections = analysis.photos.flatMap((photo, index) => photo.detections.map((item) => [`Photo ${index + 1}`, item.label, `${Math.round(item.confidence * 100)}%`, describePosition(item.box)]))
    if (detections.length) table({ head: [['Photo', 'Detected', 'Confidence', 'Position in photo']], body: detections, columnStyles: { 0: { cellWidth: 60 }, 2: { cellWidth: 80 } } })
  } else {
    paragraph('No community report with AI-detected waste exists for this water body yet.', { color: MUTED, gap: 14 })
  }

  paragraph('Use the satellite measurement to decide where to look closer, not as proof of encroachment, damage or permanent loss. The AI waste detection is a prototype: marked areas are suggestions and a reviewer must verify the evidence before any action is taken. Satellite imagery: Copernicus Sentinel-2 (ESA), via Earth Search on AWS.', { size: 7.8, color: MUTED })

  const pages = doc.getNumberOfPages()
  for (let page = 1; page <= pages; page += 1) {
    doc.setPage(page)
    doc.setFont('helvetica', 'normal').setFontSize(7.5).setTextColor(...MUTED)
    doc.text(clean(`TerraLink · ${site.name} · site report`), MARGIN, height - 28)
    doc.text(`Page ${page} of ${pages}`, width - MARGIN, height - 28, { align: 'right' })
  }
  return doc.output('blob')
}

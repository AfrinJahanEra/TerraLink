import { REPORT_CATEGORIES } from '../constants/reports'
import { formatCoordinates, formatDateTime, formatShortDate } from '../utils/reports'
import { getPhoto, putPhoto } from './photoStore'
import { SEVERITY, describePosition } from './wasteDetection'

const INK = [15, 23, 42]
const MUTED = [100, 116, 139]
const BRAND = [30, 79, 83]
const GREEN = [22, 163, 74]
const GREEN_TINT = [240, 253, 244]
const RULE = [226, 232, 240]
const MARGIN = 42

function toDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(blob)
  })
}

async function loadImage(photoId) {
  try {
    const blob = await getPhoto(photoId)
    return blob ? await toDataUrl(blob) : null
  } catch {
    return null
  }
}

export const wastePdfFilename = (report) => `TerraLink-${report.id}-waste-detection.pdf`

/** A4 PDF of the AI waste detection attached to a community report. */
export async function createWastePdf(report, siteName) {
  const [{ jsPDF }, { default: autoTable }] = await Promise.all([import('jspdf'), import('jspdf-autotable')])
  const analysis = report.aiAnalysis
  const images = await Promise.all(analysis.photos.map((photo) => loadImage(photo.annotatedPhotoId ?? photo.photoId)))
  const doc = new jsPDF({ unit: 'pt', format: 'a4', compress: true })
  const width = doc.internal.pageSize.getWidth()
  const height = doc.internal.pageSize.getHeight()
  const contentWidth = width - MARGIN * 2
  let y = 0

  doc.setProperties({ title: `${report.id} waste detection`, subject: 'AI waste detection', author: 'TerraLink', creator: 'TerraLink' })

  doc.setFillColor(...BRAND).rect(0, 0, width, 96, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold').setFontSize(20).text('TerraLink', MARGIN, 48)
  doc.setFont('helvetica', 'normal').setFontSize(8.5).text('AI WASTE DETECTION REPORT', MARGIN, 64, { charSpace: 1 })
  doc.setFontSize(10).text(report.id, width - MARGIN, 48, { align: 'right' })
  doc.setFontSize(8.5).text(`Generated ${formatDateTime(new Date().toISOString())}`, width - MARGIN, 64, { align: 'right' })

  doc.setTextColor(...INK).setFont('helvetica', 'bold').setFontSize(18).text('Waste detection summary', MARGIN, 134)
  doc.setFont('helvetica', 'normal').setFontSize(10.5).setTextColor(...MUTED).text(siteName ?? 'Other location', MARGIN, 153)
  y = 176

  const ensureSpace = (needed) => {
    if (y + needed > height - 56) {
      doc.addPage()
      y = MARGIN
    }
  }

  const heading = (text) => {
    ensureSpace(60)
    doc.setFont('helvetica', 'bold').setFontSize(11.5).setTextColor(...INK).text(text, MARGIN, y)
    doc.setDrawColor(...RULE).setLineWidth(0.8).line(MARGIN, y + 7, width - MARGIN, y + 7)
    y += 18
  }

  const table = (options) => {
    autoTable(doc, {
      startY: y,
      margin: { left: MARGIN, right: MARGIN, bottom: 56 },
      theme: 'plain',
      styles: { font: 'helvetica', fontSize: 8.5, textColor: INK, cellPadding: { top: 5, bottom: 5, left: 6, right: 6 }, lineColor: RULE, overflow: 'linebreak', valign: 'top' },
      headStyles: { fillColor: GREEN_TINT, textColor: GREEN, fontStyle: 'bold', fontSize: 8 },
      bodyStyles: { lineWidth: { bottom: 0.6 } },
      ...options,
    })
    y = doc.lastAutoTable.finalY + 20
  }

  // At a glance
  const figures = [
    ['Result', analysis.hasWaste ? 'Waste detected' : 'No waste'],
    ['Severity', analysis.severity ? SEVERITY[analysis.severity].label : '-'],
    ['Waste areas', String(analysis.regions)],
    ['Top confidence', `${Math.round(analysis.confidence * 100)}%`],
  ]
  const cell = contentWidth / 4
  figures.forEach(([label, value], index) => {
    const x = MARGIN + index * cell
    doc.setDrawColor(...RULE).setFillColor(255, 255, 255).roundedRect(x, y, cell - 8, 38, 4, 4, 'FD')
    doc.setFont('helvetica', 'normal').setFontSize(7.5).setTextColor(...MUTED).text(label.toUpperCase(), x + 8, y + 14, { charSpace: 0.4 })
    doc.setFont('helvetica', 'bold').setFontSize(10.5).setTextColor(...(index === 0 && analysis.hasWaste ? GREEN : INK)).text(value, x + 8, y + 29)
  })
  y += 56

  const summary = doc.splitTextToSize(analysis.summary, contentWidth)
  doc.setFont('helvetica', 'normal').setFontSize(9.5).setTextColor(...INK).text(summary, MARGIN, y)
  y += summary.length * 13 + 14

  heading('Report details')
  table({
    body: [
      ['Report', report.id],
      ['Problem type', REPORT_CATEGORIES[report.category]?.label ?? report.category],
      ['Water body', siteName ?? 'Other location, outside the monitored water bodies'],
      ['Location', formatCoordinates(report)],
      ['Observed', formatShortDate(report.observedAt)],
      ['Submitted', formatDateTime(report.createdAt)],
      ['Description', report.description],
    ],
    columnStyles: { 0: { cellWidth: 100, fontStyle: 'bold', textColor: MUTED } },
  })

  analysis.photos.forEach((photo, index) => {
    heading(`Photo ${index + 1}${photo.name ? `: ${photo.name}` : ''}`)
    const box = { width: contentWidth, height: 230 }
    ensureSpace(box.height + 20)
    doc.setFillColor(241, 245, 249).rect(MARGIN, y, box.width, box.height, 'F')
    const image = images[index]
    if (image) {
      const { width: imageWidth, height: imageHeight } = doc.getImageProperties(image)
      const scale = Math.min(box.width / imageWidth, box.height / imageHeight)
      doc.addImage(image, MARGIN + (box.width - imageWidth * scale) / 2, y + (box.height - imageHeight * scale) / 2, imageWidth * scale, imageHeight * scale)
    } else {
      doc.setFontSize(8).setTextColor(...MUTED).text('Photo unavailable in this browser', MARGIN + box.width / 2, y + box.height / 2, { align: 'center' })
    }
    y += box.height + 14

    if (!photo.hasWaste) {
      doc.setFont('helvetica', 'italic').setFontSize(9).setTextColor(...MUTED).text('No visible waste was detected in this photo.', MARGIN, y)
      y += 24
      return
    }
    table({
      head: [['#', 'Detected', 'Confidence', 'Position in photo']],
      body: photo.detections.map((item, n) => [String(n + 1), item.label, `${Math.round(item.confidence * 100)}%`, describePosition(item.box)]),
      columnStyles: { 0: { cellWidth: 26 }, 2: { halign: 'right' } },
    })
  })

  if (analysis.recommendation) {
    heading('Recommended next step')
    const wrapped = doc.splitTextToSize(analysis.recommendation, contentWidth - 20)
    ensureSpace(wrapped.length * 13 + 20)
    doc.setFillColor(...GREEN_TINT).rect(MARGIN, y - 4, contentWidth, wrapped.length * 13 + 14, 'F')
    doc.setFont('helvetica', 'bold').setFontSize(9.5).setTextColor(...GREEN).text(wrapped, MARGIN + 10, y + 8)
    y += wrapped.length * 13 + 26
  }

  const note = doc.splitTextToSize(`Produced by ${analysis.model} on ${formatDateTime(analysis.analysedAt)}. This is a prototype detection for demonstration. Marked areas are suggestions only; a reviewer must verify the evidence before any action is taken, and a detection is not proof of who caused the problem.`, contentWidth)
  ensureSpace(note.length * 11 + 8)
  doc.setFont('helvetica', 'normal').setFontSize(7.8).setTextColor(...MUTED).text(note, MARGIN, y)

  const pages = doc.getNumberOfPages()
  for (let page = 1; page <= pages; page += 1) {
    doc.setPage(page)
    doc.setFontSize(7.5).setTextColor(...MUTED)
    doc.text(`TerraLink · ${report.id} · AI waste detection`, MARGIN, height - 28)
    doc.text(`Page ${page} of ${pages}`, width - MARGIN, height - 28, { align: 'right' })
  }
  return doc.output('blob')
}

/** Generates the PDF and keeps it with the report's evidence. */
export async function attachWastePdf(report, siteName) {
  const blob = await createWastePdf(report, siteName)
  await putPhoto(report.aiAnalysis.pdfId, blob)
  return blob
}

/** The attached PDF, rebuilt from the saved analysis when this browser does not hold a copy. */
export async function getWastePdf(report, siteName) {
  const stored = await getPhoto(report.aiAnalysis.pdfId).catch(() => undefined)
  return stored ?? attachWastePdf(report, siteName)
}

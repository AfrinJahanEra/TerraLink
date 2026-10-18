import { formatReportDate } from '../utils/report'
import { bdt, buildReportTables, reportFilename } from '../utils/reportDocument'
import { getPhoto } from './photoStore'

const INK = [15, 23, 42]
const MUTED = [100, 116, 139]
const BRAND = [30, 79, 83]
const BRAND_TINT = [239, 250, 249]
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

/** A stored photo or an image URL as a data URL for jsPDF, or null when it cannot be read. */
async function loadImage({ photoId, imageUrl }) {
  try {
    const blob = photoId ? await getPhoto(photoId) : await fetch(imageUrl).then((response) => response.ok ? response.blob() : null)
    return blob ? await toDataUrl(blob) : null
  } catch {
    return null
  }
}

/** Builds the report as an A4 PDF made of text and tables. The library is loaded only when a PDF is asked for. */
export async function createReportPdf(report) {
  const [{ jsPDF }, { default: autoTable }] = await Promise.all([import('jspdf'), import('jspdf-autotable')])
  const tables = buildReportTables(report)
  const cleanups = await Promise.all(report.cleanups.map(async (item) => ({ ...item, images: await Promise.all([loadImage(item.before), loadImage(item.after)]) })))
  const doc = new jsPDF({ unit: 'pt', format: 'a4', compress: true })
  const width = doc.internal.pageSize.getWidth()
  const height = doc.internal.pageSize.getHeight()
  const contentWidth = width - MARGIN * 2
  let y = 0

  doc.setProperties({ title: `TerraLink monitoring report: ${tables.scope}`, subject: tables.period, author: 'TerraLink', creator: 'TerraLink' })

  // Cover band
  doc.setFillColor(...BRAND)
  doc.rect(0, 0, width, 104, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold').setFontSize(20).text('TerraLink', MARGIN, 52)
  doc.setFont('helvetica', 'normal').setFontSize(8.5).text('WETLAND MONITORING WORKSPACE', MARGIN, 68, { charSpace: 1 })
  doc.setFontSize(10).text('Monitoring report', width - MARGIN, 52, { align: 'right' })
  doc.setFontSize(8.5).text(tables.period, width - MARGIN, 68, { align: 'right' })

  doc.setTextColor(...INK).setFont('helvetica', 'bold').setFontSize(19)
  doc.text('Wetland observation and response summary', MARGIN, 144)
  doc.setFont('helvetica', 'normal').setFontSize(11).setTextColor(...MUTED)
  doc.text(tables.scope, MARGIN, 164)
  doc.setFontSize(8.5)
  doc.text(`Reporting period: ${tables.period}    Generated: ${tables.generated}    Prepared for: Programme review`, MARGIN, 184)
  y = 208

  const ensureSpace = (needed) => {
    if (y + needed > height - 56) {
      doc.addPage()
      y = MARGIN
    }
  }

  const heading = (number, text) => {
    ensureSpace(60)
    doc.setFont('helvetica', 'bold').setFontSize(11.5).setTextColor(...INK)
    doc.text(number ? `${number}. ${text}` : text, MARGIN, y)
    doc.setDrawColor(...RULE).setLineWidth(0.8).line(MARGIN, y + 7, width - MARGIN, y + 7)
    y += 18
  }

  const table = ({ head, rows, foot, columnStyles = {}, empty }) => {
    if (!rows.length) {
      doc.setFont('helvetica', 'italic').setFontSize(9).setTextColor(...MUTED).text(empty, MARGIN, y + 4)
      y += 26
      return
    }
    autoTable(doc, {
      startY: y,
      head: [head],
      body: rows,
      foot: foot ? [foot] : undefined,
      margin: { left: MARGIN, right: MARGIN, bottom: 56 },
      theme: 'plain',
      styles: { font: 'helvetica', fontSize: 8.5, textColor: INK, cellPadding: { top: 5, bottom: 5, left: 6, right: 6 }, lineColor: RULE, lineWidth: 0, overflow: 'linebreak', valign: 'top' },
      headStyles: { fillColor: BRAND_TINT, textColor: BRAND, fontStyle: 'bold', fontSize: 8 },
      footStyles: { fillColor: BRAND_TINT, textColor: INK, fontStyle: 'bold' },
      bodyStyles: { lineWidth: { bottom: 0.6 } },
      columnStyles,
      // Header and footer cells follow the column's alignment so numbers line up with their headings.
      didParseCell: (data) => {
        const align = columnStyles[data.column.index]?.halign
        if (align && data.section !== 'body') data.cell.styles.halign = align
      },
    })
    y = doc.lastAutoTable.finalY + 22
  }

  // At a glance
  heading('', 'At a glance')
  doc.setFont('helvetica', 'normal')
  const cell = contentWidth / 4
  tables.figures.forEach(([label, value], index) => {
    const column = index % 4
    const row = Math.floor(index / 4)
    const x = MARGIN + column * cell
    const top = y + row * 44
    doc.setDrawColor(...RULE).setFillColor(255, 255, 255).roundedRect(x, top, cell - 8, 36, 4, 4, 'FD')
    doc.setFontSize(7.5).setTextColor(...MUTED).text(label.toUpperCase(), x + 8, top + 14, { charSpace: 0.4 })
    doc.setFont('helvetica', 'bold').setFontSize(10).setTextColor(...INK).text(value, x + 8, top + 28)
    doc.setFont('helvetica', 'normal')
  })
  y += Math.ceil(tables.figures.length / 4) * 44 + 14

  heading('1', 'Water body summary')
  table({ ...tables.sites, columnStyles: { 3: { halign: 'center' } } })

  heading('2', 'Decision and explanation')
  table({ ...tables.decisions, columnStyles: { 0: { cellWidth: 100, fontStyle: 'bold' }, 1: { cellWidth: 110 } } })

  heading('3', 'Community reports')
  table({ ...tables.community, empty: 'No community reports in this period.' })

  // Shown only when a lake has been approved as cleaned; later sections shift by one.
  const shift = cleanups.length ? 1 : 0
  if (shift) {
    heading('4', 'Before and after cleanup')
    const box = { width: (contentWidth - 12) / 2, height: 150 }
    cleanups.forEach((item) => {
      ensureSpace(box.height + 70)
      doc.setFont('helvetica', 'bold').setFontSize(9.5).setTextColor(...INK).text(`${item.siteName} approved as cleaned`, MARGIN, y)
      doc.setFont('helvetica', 'normal').setFontSize(8).setTextColor(...MUTED)
      doc.text(`${item.task.id} · ${item.task.title} · approved by ${item.approvedBy} on ${formatReportDate(item.approvedAt)} · budget ${bdt(item.budget)}, actual cost ${bdt(item.actual)}`, MARGIN, y + 12, { maxWidth: contentWidth })
      y += 22
      ;[['BEFORE', item.before, item.images[0]], ['AFTER', item.after, item.images[1]]].forEach(([label, photo, image], index) => {
        const x = MARGIN + index * (box.width + 12)
        doc.setFillColor(241, 245, 249).rect(x, y, box.width, box.height, 'F')
        if (image) {
          // Fit inside the box without stretching.
          const { width, height: imageHeight } = doc.getImageProperties(image)
          const scale = Math.min(box.width / width, box.height / imageHeight)
          const w = width * scale
          const h = imageHeight * scale
          doc.addImage(image, x + (box.width - w) / 2, y + (box.height - h) / 2, w, h)
        } else {
          doc.setFontSize(8).setTextColor(...MUTED).text('Photo unavailable', x + box.width / 2, y + box.height / 2, { align: 'center' })
        }
        doc.setFillColor(...INK).rect(x + 6, y + 6, 40, 13, 'F')
        doc.setFont('helvetica', 'bold').setFontSize(7).setTextColor(255, 255, 255).text(label, x + 26, y + 15, { align: 'center' })
        doc.setFont('helvetica', 'normal').setFontSize(7.5).setTextColor(...MUTED).text(photo.caption, x, y + box.height + 11, { maxWidth: box.width })
      })
      y += box.height + 22
      if (item.note) {
        const wrapped = doc.splitTextToSize(item.note, contentWidth)
        ensureSpace(wrapped.length * 11)
        doc.setFontSize(8.5).setTextColor(...INK).text(wrapped, MARGIN, y)
        y += wrapped.length * 11
      }
      y += 14
    })
  }

  heading(String(4 + shift), 'Tasks in reporting period')
  table({ head: tables.tasks.head, rows: tables.tasks.rows, foot: tables.tasks.total, columnStyles: { 0: { cellWidth: 170 }, 4: { halign: 'right' }, 5: { halign: 'right' } }, empty: 'No task deadlines fall inside this date range.' })

  heading(String(5 + shift), 'Costs and variance')
  table({ head: tables.costs.head, rows: tables.costs.rows, foot: tables.costs.total, columnStyles: { 1: { halign: 'right' }, 2: { halign: 'right' }, 3: { halign: 'right' } } })

  heading(String(6 + shift), 'Limitations')
  doc.setFont('helvetica', 'normal').setFontSize(8.8).setTextColor(...INK)
  tables.limitations.forEach((line) => {
    const wrapped = doc.splitTextToSize(line, contentWidth - 14)
    ensureSpace(wrapped.length * 12 + 6)
    doc.text('•', MARGIN + 2, y)
    doc.text(wrapped, MARGIN + 14, y)
    y += wrapped.length * 12 + 4
  })
  y += 10

  heading(String(7 + shift), 'Sources and attribution')
  tables.sources.forEach(([label, value]) => {
    const wrapped = doc.splitTextToSize(value, contentWidth - 96)
    ensureSpace(wrapped.length * 12 + 4)
    doc.setFont('helvetica', 'bold').setFontSize(8.8).text(label, MARGIN, y)
    doc.setFont('helvetica', 'normal').text(wrapped, MARGIN + 96, y)
    y += wrapped.length * 12 + 3
  })
  y += 10

  const note = doc.splitTextToSize(tables.disclaimer, contentWidth)
  ensureSpace(note.length * 11 + 8)
  doc.setFontSize(7.8).setTextColor(...MUTED).text(note, MARGIN, y)

  // Footer on every page
  const pages = doc.getNumberOfPages()
  for (let page = 1; page <= pages; page += 1) {
    doc.setPage(page)
    doc.setDrawColor(...RULE).setLineWidth(0.6).line(MARGIN, height - 40, width - MARGIN, height - 40)
    doc.setFont('helvetica', 'normal').setFontSize(7.8).setTextColor(...MUTED)
    doc.text(`TerraLink  |  ${tables.scope}  |  ${tables.period}`, MARGIN, height - 26)
    doc.text(`Page ${page} of ${pages}`, width - MARGIN, height - 26, { align: 'right' })
  }

  return { doc, filename: reportFilename(report) }
}

/** Saves the PDF to the user's device. */
export async function downloadReportPdf(report) {
  const { doc, filename } = await createReportPdf(report)
  doc.save(filename)
  return filename
}

/** The PDF as a base64 data URI, ready to attach to an email. */
export async function reportPdfAttachment(report) {
  const { doc, filename } = await createReportPdf(report)
  const base64 = doc.output('datauristring').split('base64,')[1]
  return { filename, dataUri: `data:application/pdf;base64,${base64}`, bytes: Math.round(base64.length * 0.75) }
}

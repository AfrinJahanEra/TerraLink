import { buildReportTables, reportFilename } from '../utils/reportDocument'

const INK = [15, 23, 42]
const MUTED = [100, 116, 139]
const BRAND = [30, 79, 83]
const BRAND_TINT = [239, 250, 249]
const RULE = [226, 232, 240]
const MARGIN = 42

/** Builds the report as an A4 PDF made of text and tables. The library is loaded only when a PDF is asked for. */
export async function createReportPdf(report) {
  const [{ jsPDF }, { default: autoTable }] = await Promise.all([import('jspdf'), import('jspdf-autotable')])
  const tables = buildReportTables(report)
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

  heading('4', 'Tasks in reporting period')
  table({ ...tables.tasks, columnStyles: { 0: { cellWidth: 170 } }, empty: 'No task deadlines fall inside this date range.' })

  heading('5', 'Costs and variance')
  table({ head: tables.costs.head, rows: tables.costs.rows, foot: tables.costs.total, columnStyles: { 1: { halign: 'right' }, 2: { halign: 'right' }, 3: { halign: 'right' } } })

  heading('6', 'Limitations')
  doc.setFont('helvetica', 'normal').setFontSize(8.8).setTextColor(...INK)
  tables.limitations.forEach((line) => {
    const wrapped = doc.splitTextToSize(line, contentWidth - 14)
    ensureSpace(wrapped.length * 12 + 6)
    doc.text('•', MARGIN + 2, y)
    doc.text(wrapped, MARGIN + 14, y)
    y += wrapped.length * 12 + 4
  })
  y += 10

  heading('7', 'Sources and attribution')
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

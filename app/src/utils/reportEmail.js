import { buildReportTables, reportPeriod, reportScope } from './reportDocument'

const escapeHtml = (value) => String(value ?? '')
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')

const FONT = "font-family:Segoe UI,Helvetica,Arial,sans-serif;"
const cellStyle = `padding:8px 10px;border-bottom:1px solid #e2e8f0;font-size:13px;color:#0f172a;${FONT}`
const headStyle = `padding:8px 10px;background:#effaf9;color:#1e4f53;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.04em;text-align:left;${FONT}`

function htmlTable(head, rows, { alignRight = [], boldLast = false } = {}) {
  const align = (index) => (alignRight.includes(index) ? 'text-align:right;' : '')
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:8px 0 22px">
<thead><tr>${head.map((label, index) => `<th style="${headStyle}${align(index)}">${escapeHtml(label)}</th>`).join('')}</tr></thead>
<tbody>${rows.map((row, rowIndex) => `<tr>${row.map((value, index) => `<td style="${cellStyle}${align(index)}${boldLast && rowIndex === rows.length - 1 ? 'font-weight:700;background:#f8fafc;' : ''}">${escapeHtml(value)}</td>`).join('')}</tr>`).join('')}</tbody>
</table>`
}

/** Subject line for the report email. */
export function reportEmailSubject(report) {
  return `TerraLink monitoring report: ${reportScope(report)} (${reportPeriod(report)})`
}

/**
 * The email body: a greeting, the key figures and the two tables a reader needs most,
 * then a pointer to the attached PDF. Inline styles only, because email clients drop style sheets.
 */
export function buildReportEmailHtml({ report, recipientName, note, filename, link }) {
  const tables = buildReportTables(report)
  const greeting = recipientName ? `Dear ${escapeHtml(recipientName.split(' ')[0])},` : 'Hello,'
  const heading = (text) => `<h2 style="margin:22px 0 4px;font-size:15px;color:#0f172a;${FONT}">${escapeHtml(text)}</h2>`

  return `<div style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;${FONT}">
<div style="background:#1e4f53;padding:22px 26px;color:#ffffff">
<div style="font-size:20px;font-weight:700">TerraLink</div>
<div style="font-size:11px;letter-spacing:.12em;text-transform:uppercase;opacity:.85;margin-top:2px">Wetland monitoring workspace</div>
</div>
<div style="padding:24px 26px;color:#0f172a;font-size:14px;line-height:1.6">
<p style="margin:0 0 12px">${greeting}</p>
<p style="margin:0 0 12px">Please find the monitoring report for <strong>${escapeHtml(tables.scope)}</strong> covering <strong>${escapeHtml(tables.period)}</strong>. The full report is attached as a PDF${filename ? ` (<em>${escapeHtml(filename)}</em>)` : ''}.</p>
${note ? `<p style="margin:0 0 12px;padding:10px 14px;background:#f8fafc;border-left:3px solid #1e6166;white-space:pre-wrap">${escapeHtml(note)}</p>` : ''}
${heading('Summary')}
${htmlTable(['Measure', 'Value'], tables.figures)}
${heading('Water bodies')}
${htmlTable(['Site', 'Water-area change', 'Status'], tables.sites.rows.map((row) => [row[0], row[2], row[4]]))}
${heading('Costs')}
${htmlTable(tables.costs.head, [...tables.costs.rows, tables.costs.total], { alignRight: [1, 2, 3], boldLast: true })}
${link ? `<p style="margin:18px 0 0"><a href="${escapeHtml(link)}" style="display:inline-block;background:#1e6166;color:#ffffff;text-decoration:none;font-weight:600;font-size:13px;padding:10px 16px;border-radius:8px">Open the reports page</a></p>` : ''}
<p style="margin:22px 0 0;font-size:12px;color:#64748b">This is sample data from the TerraLink prototype. Water-area figures appear only where a satellite measurement has been saved.</p>
</div>
</div>`
}

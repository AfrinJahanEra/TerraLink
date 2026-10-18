/**
 * Branded HTML email built from tables and inline styles, so it renders the same in Gmail, Outlook and phone mail apps.
 *   renderEmail({ preheader, eyebrow, title, greeting, intro, rows, note, button, links, footer })
 * Returns { html, text }: the text version is what mail apps show when they cannot render HTML.
 */

const BRAND = '#1e4f53'
const ACCENT = '#16a34a'
const INK = '#0f172a'
const MUTED = '#64748b'
const RULE = '#e2e8f0'

export const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char])

const paragraphs = (text) => String(text ?? '')
  .split(/\n{2,}/)
  .filter(Boolean)
  .map((block) => `<p style="margin:0 0 14px;font-size:14px;line-height:22px;color:${INK}">${escapeHtml(block).replaceAll('\n', '<br>')}</p>`)
  .join('')

export function renderEmail({ preheader = '', eyebrow = 'TerraLink', title, greeting, intro, rows = [], note, noteTitle, button, links = [], footer }) {
  const detailRows = rows.filter(([, value]) => value !== undefined && value !== null && value !== '').map(([label, value], index) => `
          <tr>
            <td style="padding:10px 16px;font-size:12px;color:${MUTED};width:132px;vertical-align:top;${index ? `border-top:1px solid ${RULE};` : ''}">${escapeHtml(label)}</td>
            <td style="padding:10px 16px;font-size:13px;color:${INK};font-weight:600;vertical-align:top;${index ? `border-top:1px solid ${RULE};` : ''}">${escapeHtml(value)}</td>
          </tr>`).join('')

  const buttonHtml = button ? `
      <tr><td style="padding:6px 32px 8px">
        <table role="presentation" cellpadding="0" cellspacing="0"><tr><td style="border-radius:8px;background:${button.color ?? ACCENT}">
          <a href="${escapeHtml(button.url)}" style="display:inline-block;padding:13px 26px;font-size:14px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:8px">${escapeHtml(button.label)}</a>
        </td></tr></table>
        ${button.caption ? `<p style="margin:10px 0 0;font-size:12px;color:${MUTED}">${escapeHtml(button.caption)}</p>` : ''}
      </td></tr>` : ''

  const linksHtml = links.length ? `
      <tr><td style="padding:12px 32px 4px;font-size:13px">
        ${links.map((link) => `<a href="${escapeHtml(link.url)}" style="color:${BRAND};font-weight:600;text-decoration:none;margin-right:18px">${escapeHtml(link.label)} &rarr;</a>`).join('')}
      </td></tr>` : ''

  const html = `<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(title)}</title></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,Helvetica,sans-serif">
  <span style="display:none;max-height:0;overflow:hidden;opacity:0">${escapeHtml(preheader)}</span>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:28px 12px">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:14px;overflow:hidden;border:1px solid ${RULE}">
        <tr><td style="background:${BRAND};padding:22px 32px">
          <div style="font-size:19px;font-weight:700;color:#ffffff;letter-spacing:.2px">TerraLink</div>
          <div style="font-size:10px;letter-spacing:2px;color:#bfe4e2;margin-top:3px">WETLAND MONITORING WORKSPACE</div>
        </td></tr>
        <tr><td style="padding:28px 32px 6px">
          <div style="font-size:11px;font-weight:700;letter-spacing:1.4px;text-transform:uppercase;color:${ACCENT}">${escapeHtml(eyebrow)}</div>
          <h1 style="margin:8px 0 18px;font-size:21px;line-height:28px;color:${INK}">${escapeHtml(title)}</h1>
          ${greeting ? `<p style="margin:0 0 14px;font-size:14px;color:${INK}">${escapeHtml(greeting)}</p>` : ''}
          ${paragraphs(intro)}
        </td></tr>
        ${detailRows ? `<tr><td style="padding:4px 32px 18px">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid ${RULE};border-radius:10px;background:#f8fafc">${detailRows}
          </table>
        </td></tr>` : ''}
        ${note ? `<tr><td style="padding:0 32px 18px">
          <div style="border-left:3px solid ${BRAND};background:#effaf9;padding:12px 16px;border-radius:0 8px 8px 0">
            ${noteTitle ? `<div style="font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:${BRAND};margin-bottom:4px">${escapeHtml(noteTitle)}</div>` : ''}
            <div style="font-size:13px;line-height:20px;color:${INK}">${escapeHtml(note).replaceAll('\n', '<br>')}</div>
          </div>
        </td></tr>` : ''}
        ${buttonHtml}
        ${linksHtml}
        <tr><td style="padding:22px 32px 26px">
          <p style="margin:0;padding-top:16px;border-top:1px solid ${RULE};font-size:11px;line-height:17px;color:${MUTED}">${escapeHtml(footer ?? 'You are receiving this because you are part of a TerraLink monitoring team.')}<br>TerraLink · Dhaka wetland monitoring</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`

  const text = [
    title,
    greeting,
    intro,
    rows.filter(([, value]) => value).map(([label, value]) => `${label}: ${value}`).join('\n'),
    note && `${noteTitle ? `${noteTitle}: ` : ''}${note}`,
    button && `${button.label}: ${button.url}`,
    ...links.map((link) => `${link.label}: ${link.url}`),
  ].filter(Boolean).join('\n\n')

  return { html, text }
}

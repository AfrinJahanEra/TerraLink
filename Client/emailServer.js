import nodemailer from 'nodemailer'

/**
 * SMTP delivery for the local data server. The credentials come from .env without a VITE_ prefix,
 * so they stay on this machine and are never bundled into the browser code.
 *   GET  /api/email/status  -> { configured, from, missing }
 *   POST /api/email         -> { to, toName, subject, text, html, attachments: [{ filename, dataUri }] }
 */
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function createEmailHandler(env) {
  const host = env.SMTP_HOST?.trim() || 'smtp.gmail.com'
  const port = Number(env.SMTP_PORT || 465)
  const user = env.SMTP_USER?.trim()
  // Gmail shows app passwords in groups of four; the spaces are not part of the password.
  const pass = env.SMTP_PASS?.replace(/\s+/g, '')
  const fromName = env.SMTP_FROM_NAME?.trim() || 'TerraLink'
  const replyTo = env.SMTP_REPLY_TO?.trim() || undefined
  const missing = [!user && 'SMTP_USER', !pass && 'SMTP_PASS'].filter(Boolean)
  const transport = missing.length ? null : nodemailer.createTransport({ host, port, secure: port === 465, auth: { user, pass } })

  return {
    status: () => ({ configured: !missing.length, from: user ?? '', missing }),
    async send({ to, toName, subject, text, html, attachments = [] }) {
      if (!transport) throw new Error(`SMTP is not set up. Add ${missing.join(' and ')} to Client/.env and restart the app.`)
      if (!emailPattern.test(String(to ?? ''))) throw new Error('The recipient does not have a valid email address.')
      const info = await transport.sendMail({
        from: { name: fromName, address: user },
        to: toName && toName !== to ? { name: toName, address: to } : to,
        replyTo,
        subject,
        text,
        html,
        attachments: attachments.filter((item) => item?.dataUri).map((item) => ({ filename: item.filename, path: item.dataUri })),
      })
      return { messageId: info.messageId, accepted: info.accepted }
    },
  }
}

import emailjs from '@emailjs/browser'

const templateIds = {
  task_assign: import.meta.env.VITE_EMAILJS_TEMPLATE_TASK_ASSIGN_ID,
  over_budget: import.meta.env.VITE_EMAILJS_TEMPLATE_OVER_BUDGET_ID,
  task_complete: import.meta.env.VITE_EMAILJS_TEMPLATE_TASK_COMPLETE_ID,
  report_summary: import.meta.env.VITE_EMAILJS_TEMPLATE_REPORT_SUMMARY_ID,
  meeting_invite: import.meta.env.VITE_EMAILJS_TEMPLATE_MEETING_INVITE_ID,
  task_reminder: import.meta.env.VITE_EMAILJS_TEMPLATE_TASK_REMINDER_ID,
}

let smtpStatus = null

/**
 * SMTP settings live on a server (the local data server or the deployed Vercel function);
 * the browser only learns whether they are complete. Without that endpoint the SPA host
 * answers with index.html, which is why the content type is checked before parsing.
 */
function fetchSmtpStatus() {
  smtpStatus ??= fetch('/api/email/status', { cache: 'no-store' })
    .then((response) => response.ok && (response.headers.get('content-type') ?? '').includes('application/json') ? response.json() : null)
    .catch(() => null)
  return smtpStatus
}

/**
 * How email goes out: SMTP through the local data server when SMTP_USER and SMTP_PASS are set,
 * otherwise EmailJS from the browser. `missing` names what to add to Client/.env.
 */
export async function resolveEmailSetup() {
  const smtp = await fetchSmtpStatus()
  if (smtp?.configured) return { configured: true, mode: 'smtp', from: smtp.from, missing: [] }
  const emailjsSetup = getEmailConfiguration()
  if (emailjsSetup.configured) return { ...emailjsSetup, mode: 'emailjs' }
  return { configured: false, mode: smtp ? 'smtp' : 'emailjs', missing: smtp ? smtp.missing : emailjsSetup.missing }
}

const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char])

/** A plain branded body for notifications that do not bring their own HTML. */
function notificationHtml({ toName, subject, message, actionUrl }) {
  const paragraphs = String(message ?? '').split(/\n{2,}/).map((block) => `<p style="margin:0 0 12px">${escapeHtml(block).replaceAll('\n', '<br>')}</p>`).join('')
  return `<div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;color:#0f172a">
<div style="background:#1e4f53;color:#fff;padding:16px 20px;border-radius:8px 8px 0 0"><strong style="font-size:16px">TerraLink</strong><div style="font-size:11px;letter-spacing:1px;color:#bfe4e2">WETLAND MONITORING WORKSPACE</div></div>
<div style="border:1px solid #e2e8f0;border-top:0;padding:20px;border-radius:0 0 8px 8px;font-size:14px;line-height:1.55">
<h2 style="font-size:16px;margin:0 0 12px">${escapeHtml(subject)}</h2>
${toName ? `<p style="margin:0 0 12px">Hello ${escapeHtml(toName)},</p>` : ''}${paragraphs}
${actionUrl ? `<p style="margin:16px 0 0"><a href="${escapeHtml(actionUrl)}" style="background:#1e4f53;color:#fff;text-decoration:none;padding:9px 16px;border-radius:6px;display:inline-block">Open in TerraLink</a></p>` : ''}
</div></div>`
}

async function sendViaSmtp({ toName, toEmail, subject, message, actionUrl, extraParams }) {
  const text = [toName ? `Hello ${toName},` : '', message, actionUrl ? `Open in TerraLink: ${actionUrl}` : ''].filter(Boolean).join('\n\n')
  const response = await fetch('/api/email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      to: toEmail,
      toName,
      subject,
      text,
      html: extraParams.message_html || notificationHtml({ toName, subject, message, actionUrl }),
      attachments: extraParams.report_pdf ? [{ filename: extraParams.report_filename || 'report.pdf', dataUri: extraParams.report_pdf }] : [],
    }),
  })
  const body = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(body.error || `The email server returned status ${response.status}.`)
  return body
}

export function getEmailConfiguration() {
  const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY?.trim()
  const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID?.trim()
  const defaultTemplateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID?.trim()
  const configured = Boolean(publicKey && serviceId && defaultTemplateId)

  return {
    configured,
    publicKey,
    serviceId,
    defaultTemplateId,
    missing: [
      !publicKey && 'VITE_EMAILJS_PUBLIC_KEY',
      !serviceId && 'VITE_EMAILJS_SERVICE_ID',
      !defaultTemplateId && 'VITE_EMAILJS_TEMPLATE_ID',
    ].filter(Boolean),
  }
}

export async function sendEmailNotification({
  type,
  toName,
  toEmail,
  subject,
  message,
  task,
  site,
  actionUrl,
  extraParams = {},
}) {
  if (!toEmail) throw new Error('The email recipient does not have an email address.')
  const setup = await resolveEmailSetup()
  if (!setup.configured) throw new Error(`Email is not set up. Add ${setup.missing.join(', ')} to Client/.env and restart the app.`)
  if (setup.mode === 'smtp') return sendViaSmtp({ toName, toEmail, subject, message, actionUrl, extraParams })

  const config = getEmailConfiguration()

  const templateId = templateIds[type]?.trim() || config.defaultTemplateId
  const response = await emailjs.send(
    config.serviceId,
    templateId,
    {
      to_name: toName,
      to_email: toEmail,
      recipient_name: toName,
      recipient_email: toEmail,
      subject,
      message,
      notification_type: type,
      task_id: task?.id ?? '',
      task_title: task?.title ?? '',
      site_name: site?.name ?? task?.site ?? '',
      assignee_name: task?.assignee ?? '',
      due_date: task?.dueDate ?? '',
      action_url: actionUrl ?? '',
      reply_to: import.meta.env.VITE_EMAILJS_REPLY_TO?.trim() || toEmail,
      ...extraParams,
    },
    { publicKey: config.publicKey },
  )

  if (response.status < 200 || response.status >= 300) {
    throw new Error(`EmailJS returned status ${response.status}.`)
  }

  return response
}

export const emailTemplates = {
  taskAssignment(details) {
    return sendEmailNotification({
      type: 'task_assign',
      subject: `New TerraLink task: ${details.task.title}`,
      message: `${details.task.id} has been assigned to you for ${details.task.site}. Deadline: ${details.task.dueDate}.`,
      ...details,
    })
  },
  overBudget(details) {
    return sendEmailNotification({
      type: 'over_budget',
      subject: `Budget alert: ${details.site.name}`,
      message: `${details.site.name} has exceeded its planned budget. Actual: ৳${Number(details.actual).toLocaleString('en-US')}; planned: ৳${Number(details.planned).toLocaleString('en-US')}.`,
      ...details,
    })
  },
  taskComplete(details) {
    return sendEmailNotification({
      type: 'task_complete',
      subject: `Task reported complete: ${details.task.id}`,
      message: `${details.task.assignee} reported “${details.task.title}” complete for ${details.task.site}.`,
      ...details,
    })
  },
  reportSummary(details) {
    return sendEmailNotification({
      type: 'report_summary',
      subject: details.subject ?? 'TerraLink report summary',
      message: details.message ?? 'Your TerraLink monitoring summary is ready for review.',
      ...details,
    })
  },
  meetingInvite(details) {
    return sendEmailNotification({
      type: 'meeting_invite',
      subject: `Invitation: ${details.meeting.title} · ${details.meeting.date} ${details.meeting.startTime}`,
      extraParams: {
        meeting_id: details.meeting.id,
        meeting_title: details.meeting.title,
        meeting_date: details.meeting.date,
        meeting_time: details.meeting.startTime,
        meeting_location: details.meeting.location,
      },
      ...details,
    })
  },
  taskReminder(details) {
    return sendEmailNotification({
      type: 'task_reminder',
      subject: `Reminder: ${details.task.id} is due ${details.task.dueDate}`,
      message: `This is a reminder that “${details.task.title}” for ${details.task.site} is due on ${details.task.dueDate}. Please add a progress note or report completion in TerraLink.`,
      ...details,
    })
  },
}

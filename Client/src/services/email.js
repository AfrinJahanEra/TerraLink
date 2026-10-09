import emailjs from '@emailjs/browser'

const templateIds = {
  task_assign: import.meta.env.VITE_EMAILJS_TEMPLATE_TASK_ASSIGN_ID,
  over_budget: import.meta.env.VITE_EMAILJS_TEMPLATE_OVER_BUDGET_ID,
  task_complete: import.meta.env.VITE_EMAILJS_TEMPLATE_TASK_COMPLETE_ID,
  report_summary: import.meta.env.VITE_EMAILJS_TEMPLATE_REPORT_SUMMARY_ID,
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
}) {
  const config = getEmailConfiguration()
  if (!config.configured) {
    throw new Error(`EmailJS is not configured. Missing ${config.missing.join(', ')}.`)
  }
  if (!toEmail) throw new Error('The email recipient does not have an email address.')

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
}

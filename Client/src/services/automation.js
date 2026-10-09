import { createDeadlineEvent, createGoogleCalendarLink, getGoogleCalendarConfiguration } from './calendar'
import { emailTemplates } from './email'
import { createWhatsAppLink, getTaskLink, openWhatsApp } from './whatsapp'

function logId() {
  return `notification-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function createLog(fields) {
  return {
    id: logId(),
    createdAt: new Date().toISOString(),
    recipient: '',
    channel: '',
    message: '',
    status: 'Sent',
    detail: '',
    actionUrl: '',
    taskId: '',
    ...fields,
  }
}

function errorMessage(error) {
  return error instanceof Error ? error.message : 'The integration request failed.'
}

async function attempt(record, fields, action, failureFields = {}) {
  try {
    const result = await action()
    const log = createLog({ ...fields, status: 'Sent', ...result?.logFields })
    record(log)
    return log
  } catch (error) {
    const log = createLog({ ...fields, ...failureFields, status: 'Failed', detail: errorMessage(error) })
    record(log)
    return log
  }
}

export async function automateTaskAssignment({ task, assignee, site, settings, record }) {
  const actions = []
  const actionUrl = getTaskLink(task)

  if (settings.rules.taskAssignedEmail && task.notifications?.email) {
    actions.push(attempt(record, {
      recipient: `${assignee?.name ?? task.assignee} · ${assignee?.email ?? 'No email'}`,
      channel: 'Email',
      message: `Task assignment: ${task.id} · ${task.title}`,
      taskId: task.id,
      actionUrl,
    }, () => emailTemplates.taskAssignment({
      toName: assignee?.name ?? task.assignee,
      toEmail: assignee?.email,
      task,
      site,
      actionUrl,
    })))
  }

  if (settings.rules.taskAssignedCalendar && task.notifications?.calendar) {
    const fallbackUrl = createGoogleCalendarLink(task)
    actions.push(attempt(record, {
      recipient: 'Connected Google account',
      channel: 'Calendar',
      message: `Deadline event: ${task.id} · ${task.dueDate}`,
      taskId: task.id,
      actionUrl: fallbackUrl,
    }, async () => {
      if (!getGoogleCalendarConfiguration().connected) {
        throw new Error('Google Calendar is not connected. Calendar-link and .ics fallbacks are available.')
      }
      const event = await createDeadlineEvent(task)
      return { logFields: { actionUrl: event.htmlLink ?? fallbackUrl, detail: 'Event created with a one-day popup reminder.' } }
    }, { actionUrl: fallbackUrl }))
  }

  if (settings.rules.taskAssignedWhatsapp && task.notifications?.whatsapp) {
    try {
      const prepared = createWhatsAppLink({
        phone: assignee?.whatsapp,
        type: 'task_assign',
        details: { task },
        language: settings.language,
      })
      record(createLog({
        recipient: `${assignee?.name ?? task.assignee} · ${assignee?.whatsapp ?? 'No number'}`,
        channel: 'WhatsApp',
        message: prepared.message,
        status: 'Sent',
        detail: 'Click-to-chat message prepared; open it from the notification log.',
        actionUrl: prepared.url,
        taskId: task.id,
      }))
    } catch (error) {
      record(createLog({
        recipient: assignee?.name ?? task.assignee,
        channel: 'WhatsApp',
        message: `Task assignment: ${task.id}`,
        status: 'Failed',
        detail: errorMessage(error),
        taskId: task.id,
      }))
    }
  }

  await Promise.allSettled(actions)
}

export async function automateBudgetOverrun({ site, planned, actual, manager, settings, record }) {
  if (!settings.rules.overBudgetEmail) return
  await attempt(record, {
    recipient: `${manager.name} · ${manager.email}`,
    channel: 'Email',
    message: `Budget overrun: ${site.name} reached ৳${Number(actual).toLocaleString('en-US')}`,
    actionUrl: `${window.location.origin}/budget`,
  }, () => emailTemplates.overBudget({
    toName: manager.name,
    toEmail: manager.email,
    site,
    planned,
    actual,
    actionUrl: `${window.location.origin}/budget`,
  }))
}

export async function automateTaskCompletion({ task, manager, settings, record }) {
  const actionUrl = getTaskLink(task)
  const actions = []

  if (settings.rules.taskCompleteEmail && task.notifications?.email) {
    actions.push(attempt(record, {
      recipient: `${manager.name} · ${manager.email}`,
      channel: 'Email',
      message: `Reported complete: ${task.id} · ${task.title}`,
      taskId: task.id,
      actionUrl,
    }, () => emailTemplates.taskComplete({
      toName: manager.name,
      toEmail: manager.email,
      task,
      actionUrl,
    })))
  }

  if (settings.rules.taskCompleteWhatsapp && task.notifications?.whatsapp) {
    try {
      const prepared = createWhatsAppLink({
        phone: manager.whatsapp,
        type: 'task_complete',
        details: { task },
        language: settings.language,
      })
      record(createLog({
        recipient: `${manager.name} · ${manager.whatsapp}`,
        channel: 'WhatsApp',
        message: prepared.message,
        status: 'Sent',
        detail: 'Click-to-chat completion message prepared.',
        actionUrl: prepared.url,
        taskId: task.id,
      }))
    } catch (error) {
      record(createLog({ recipient: manager.name, channel: 'WhatsApp', message: `Reported complete: ${task.id}`, status: 'Failed', detail: errorMessage(error), taskId: task.id }))
    }
  }

  await Promise.allSettled(actions)
}

export function automateOverdueTask({ task, assignee, settings, record }) {
  if (!settings.rules.overdueWhatsapp || !task.notifications?.whatsapp) return
  try {
    const prepared = createWhatsAppLink({
      phone: assignee?.whatsapp,
      type: 'overdue',
      details: { task },
      language: settings.language,
    })
    record(createLog({
      recipient: `${assignee?.name ?? task.assignee} · ${assignee?.whatsapp ?? 'No number'}`,
      channel: 'WhatsApp',
      message: prepared.message,
      status: 'Sent',
      detail: 'Overdue click-to-chat reminder prepared.',
      actionUrl: prepared.url,
      taskId: task.id,
    }))
  } catch (error) {
    record(createLog({ recipient: assignee?.name ?? task.assignee, channel: 'WhatsApp', message: `Overdue reminder: ${task.id}`, status: 'Failed', detail: errorMessage(error), taskId: task.id }))
  }
}

export async function sendReportSummaryEmail({ manager, reportTitle, summary, settings, record }) {
  if (!settings.rules.reportSummaryEmail) throw new Error('Report summary email automation is disabled.')
  return attempt(record, {
    recipient: `${manager.name} · ${manager.email}`,
    channel: 'Email',
    message: `Report summary: ${reportTitle}`,
    actionUrl: `${window.location.origin}/reports`,
  }, () => emailTemplates.reportSummary({
    toName: manager.name,
    toEmail: manager.email,
    subject: `TerraLink report: ${reportTitle}`,
    message: summary,
    actionUrl: `${window.location.origin}/reports`,
  }))
}

export async function runIntegrationTest({ service, manager, settings, record }) {
  const testTask = {
    id: 'TEST-001',
    title: 'Integration connection test',
    description: 'This test verifies the TerraLink notification connection.',
    site: 'TerraLink workspace',
    assignee: manager.name,
    dueDate: new Date(Date.now() + 86_400_000).toISOString().slice(0, 10),
  }

  if (service === 'email') {
    return attempt(record, {
      recipient: `${manager.name} · ${manager.email}`,
      channel: 'Email',
      message: 'Report summary test from TerraLink',
      actionUrl: `${window.location.origin}/integrations`,
    }, () => emailTemplates.reportSummary({
      toName: manager.name,
      toEmail: manager.email,
      subject: 'TerraLink EmailJS connection test',
      message: 'EmailJS is connected. TerraLink can deliver task, budget, completion, and report-summary notifications.',
      actionUrl: `${window.location.origin}/integrations`,
    }))
  }

  if (service === 'calendar') {
    const fallbackUrl = createGoogleCalendarLink(testTask)
    return attempt(record, {
      recipient: 'Connected Google account',
      channel: 'Calendar',
      message: 'Google Calendar connection test',
      actionUrl: fallbackUrl,
      taskId: testTask.id,
    }, async () => {
      if (!getGoogleCalendarConfiguration().connected) throw new Error('Connect Google Calendar before sending a test event.')
      const event = await createDeadlineEvent(testTask)
      return { logFields: { actionUrl: event.htmlLink ?? fallbackUrl, detail: 'Test event created with a one-day reminder.' } }
    }, { actionUrl: fallbackUrl })
  }

  if (service === 'whatsapp') {
    try {
      const prepared = createWhatsAppLink({ phone: manager.whatsapp, type: 'test', language: settings.language })
      openWhatsApp(prepared.url)
      const log = createLog({
        recipient: `${manager.name} · ${manager.whatsapp}`,
        channel: 'WhatsApp',
        message: prepared.message,
        status: 'Opened',
        detail: 'Click-to-chat test opened in a new tab.',
        actionUrl: prepared.url,
      })
      record(log)
      return log
    } catch (error) {
      const log = createLog({ recipient: manager.name, channel: 'WhatsApp', message: 'WhatsApp connection test', status: 'Failed', detail: errorMessage(error) })
      record(log)
      return log
    }
  }

  throw new Error(`Unknown integration service: ${service}.`)
}

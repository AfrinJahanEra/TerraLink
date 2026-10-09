export function normalizeWhatsAppNumber(value) {
  return String(value ?? '').replace(/\D/g, '')
}

export function getTaskLink(task) {
  return `${window.location.origin}/tasks?task=${encodeURIComponent(task.id)}`
}

export function getMeetingLink(meeting) {
  return `${window.location.origin}/schedule?meeting=${encodeURIComponent(meeting.id)}`
}

const messages = {
  en: {
    task_assign: ({ task }) => `TerraLink assignment\n${task.id}: ${task.title}\nSite: ${task.site}\nDeadline: ${task.dueDate}\nOpen task: ${getTaskLink(task)}`,
    task_complete: ({ task }) => `TerraLink completion update\n${task.id}: ${task.title}\n${task.assignee} reported this task complete.\nOpen task: ${getTaskLink(task)}`,
    overdue: ({ task }) => `TerraLink overdue reminder\n${task.id}: ${task.title}\nThe deadline was ${task.dueDate}. Please update progress.\nOpen task: ${getTaskLink(task)}`,
    task_reminder: ({ task }) => `TerraLink task reminder\n${task.id}: ${task.title}\nSite: ${task.site}\nDeadline: ${task.dueDate}\nPlease share a progress update.\nOpen task: ${getTaskLink(task)}`,
    meeting: ({ meeting, dateLabel, timeRange }) => `TerraLink meeting reminder\n${meeting.title}\nDate: ${dateLabel}, ${timeRange}\nLocation: ${meeting.location}\nDetails: ${getMeetingLink(meeting)}`,
    test: () => `TerraLink WhatsApp test\nClick-to-chat is connected and ready.\nWorkspace: ${window.location.origin}`,
  },
  bn: {
    task_assign: ({ task }) => `TerraLink নতুন কাজ\n${task.id}: ${task.title}\nসাইট: ${task.site}\nশেষ তারিখ: ${task.dueDate}\nকাজটি খুলুন: ${getTaskLink(task)}`,
    task_complete: ({ task }) => `TerraLink কাজ সম্পন্ন\n${task.id}: ${task.title}\n${task.assignee} কাজটি সম্পন্ন হিসেবে জানিয়েছেন।\nকাজটি খুলুন: ${getTaskLink(task)}`,
    overdue: ({ task }) => `TerraLink বিলম্বিত কাজের স্মরণিকা\n${task.id}: ${task.title}\nশেষ তারিখ ছিল ${task.dueDate}। অগ্রগতি আপডেট করুন।\nকাজটি খুলুন: ${getTaskLink(task)}`,
    task_reminder: ({ task }) => `TerraLink কাজের স্মরণিকা\n${task.id}: ${task.title}\nসাইট: ${task.site}\nশেষ তারিখ: ${task.dueDate}\nঅনুগ্রহ করে অগ্রগতি জানান।\nকাজটি খুলুন: ${getTaskLink(task)}`,
    meeting: ({ meeting, dateLabel, timeRange }) => `TerraLink সভার স্মরণিকা\n${meeting.title}\nতারিখ: ${dateLabel}, ${timeRange}\nস্থান: ${meeting.location}\nবিস্তারিত: ${getMeetingLink(meeting)}`,
    test: () => `TerraLink WhatsApp পরীক্ষা\nClick-to-chat সংযোগ প্রস্তুত।\nওয়ার্কস্পেস: ${window.location.origin}`,
  },
}

export function buildWhatsAppMessage(type, details, language = 'en') {
  const dictionary = messages[language] ?? messages.en
  const formatter = dictionary[type] ?? messages.en[type]
  if (!formatter) throw new Error(`Unsupported WhatsApp message type: ${type}.`)
  return formatter(details)
}

export function createWhatsAppLink({ phone, type, details = {}, language = 'en' }) {
  const number = normalizeWhatsAppNumber(phone)
  if (!number) throw new Error('The WhatsApp recipient does not have a valid number.')
  const message = buildWhatsAppMessage(type, details, language)
  return {
    url: `https://wa.me/${number}?text=${encodeURIComponent(message)}`,
    message,
  }
}

export function openWhatsApp(url) {
  if (!url?.startsWith('https://wa.me/')) throw new Error('A valid WhatsApp click-to-chat link is required.')
  window.open(url, '_blank', 'noopener,noreferrer')
}

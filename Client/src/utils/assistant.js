import { SITE_STATUS } from '../constants/status'
import { formatBdtBangla, toBanglaNumerals } from './currency'
import { getSiteActual } from './budget'
import { isTaskOverdue } from './tasks'

export const assistantQuestions = [
  { id: 'review', label: 'কেন review দরকার?' },
  { id: 'pending', label: 'কোন কাজ বাকি?' },
  { id: 'overdue', label: 'কোন task overdue?' },
  { id: 'limitations', label: 'রিপোর্টের সীমাবদ্ধতা কী?' },
]

function taskSources(tasks) {
  return tasks.slice(0, 4).map((task) => `Task #${task.id}`)
}

export function buildAssistantAnswer({ questionId, site, tasks, expenses, siteBudgets, decision }) {
  const siteTasks = tasks.filter((task) => task.siteId === site.id)
  const openTasks = siteTasks.filter((task) => task.status !== 'reported_complete')
  const overdueTasks = siteTasks.filter(isTaskOverdue)
  const actualCost = getSiteActual(site.id, tasks, expenses)
  const plannedCost = Number(siteBudgets[site.id] || 0)

  if (questionId === 'review') {
    if (site.status === 'insufficient_data' || site.change === null) {
      return {
        text: `${site.name}-এর imagery-তে clear coverage ${toBanglaNumerals(site.clearCoverage)}। মেঘ ও shadow-এর কারণে নির্ভরযোগ্য তুলনার জন্য তথ্য যথেষ্ট নয়, তাই নতুন imagery বা field evidence দরকার।`,
        sources: ['Observation', 'Dynamic World guide'],
      }
    }
    const direction = site.change < 0 ? 'কমেছে' : 'বেড়েছে'
    const decisionText = decision?.note ? ` Manager-এর ব্যাখ্যা: ${decision.note}` : ' এখনো manager-এর চূড়ান্ত ব্যাখ্যা যোগ করা হয়নি।'
    return {
      text: `${site.name}-এ sample visible-water হিসাব ${toBanglaNumerals(Math.abs(site.change))}% ${direction} এবং clear coverage ${toBanglaNumerals(site.clearCoverage)}। এই পরিবর্তনটি field evidence দিয়ে যাচাই করা দরকার; এটি নিজে থেকে দখল বা স্থায়ী ক্ষতির প্রমাণ নয়।${decisionText}`,
      sources: ['Observation', 'Dynamic World guide'],
    }
  }

  if (questionId === 'pending') {
    if (!openTasks.length) return { text: `${site.name}-এর কোনো বাকি task নেই।`, sources: ['Task register'] }
    const names = openTasks.map((task) => `${task.id} (${task.title})`).join(', ')
    return {
      text: `${site.name}-এ ${toBanglaNumerals(openTasks.length)}টি কাজ বাকি: ${names}। বর্তমান actual cost ${formatBdtBangla(actualCost)}, planned allocation ${formatBdtBangla(plannedCost)}।`,
      sources: [...taskSources(openTasks), 'Budget ledger'],
    }
  }

  if (questionId === 'overdue') {
    if (!overdueTasks.length) return { text: `${site.name}-এ বর্তমানে কোনো overdue task নেই।`, sources: ['Task register'] }
    const names = overdueTasks.map((task) => `${task.id} — ${task.title}, শেষ তারিখ ${toBanglaNumerals(task.dueDate)}`).join('; ')
    return {
      text: `${site.name}-এ ${toBanglaNumerals(overdueTasks.length)}টি overdue task আছে: ${names}।`,
      sources: taskSources(overdueTasks),
    }
  }

  if (questionId === 'limitations') {
    return {
      text: `এই রিপোর্টের measurement illustrative sample। ${site.name}-এর ফল cloud, shadow, seasonality, mixed pixel এবং ১০ মিটার source resolution-এর কারণে বদলাতে পারে। Satellite change একটি review signal; field verification ছাড়া এটি চূড়ান্ত প্রমাণ নয়।`,
      sources: ['Observation', 'Dynamic World guide', 'EOX Sentinel-2'],
    }
  }

  return { text: 'পর্যাপ্ত তথ্য পাওয়া যায়নি', sources: ['Available workspace data'] }
}

export function matchAssistantQuestion(input) {
  const normalized = input.trim().toLowerCase()
  return assistantQuestions.find((question) => normalized === question.label.toLowerCase())?.id ?? null
}

export function getAssistantSiteSummary(site) {
  return `${site.name} · ${site.location} · ${SITE_STATUS[site.status]?.label ?? 'Unknown'}`
}

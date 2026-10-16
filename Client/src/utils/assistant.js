import { isTaskClosed } from '../constants/status'
import { REPORT_CATEGORIES } from '../constants/reports'
import { SITE_STATUS } from '../constants/status'
import { formatBdtBangla, toBanglaNumerals } from './currency'
import { describeComparison } from './observations'
import { getSiteActual } from './budget'
import { isTaskOverdue } from './tasks'

export const assistantQuestions = [
  { id: 'review', label: 'কেন review দরকার?' },
  { id: 'reports', label: 'কোন রিপোর্ট যাচাই বাকি?' },
  { id: 'pending', label: 'কোন কাজ বাকি?' },
  { id: 'overdue', label: 'কোন task overdue?' },
  { id: 'limitations', label: 'রিপোর্টের সীমাবদ্ধতা কী?' },
]

function taskSources(tasks) {
  return tasks.slice(0, 4).map((task) => `Task #${task.id}`)
}

export function buildAssistantAnswer({ questionId, site, tasks, expenses, siteBudgets, decision, communityReports = [], showBudget = true }) {
  const siteTasks = tasks.filter((task) => task.siteId === site.id)
  const openTasks = siteTasks.filter((task) => !isTaskClosed(task))
  const overdueTasks = siteTasks.filter(isTaskOverdue)
  const actualCost = getSiteActual(site.id, tasks, expenses)
  const plannedCost = Number(siteBudgets[site.id] || 0)
  const siteReports = communityReports.filter((report) => report.siteId === site.id)

  if (questionId === 'review') {
    const decisionText = decision?.note ? ` Manager-এর ব্যাখ্যা: ${decision.note}` : ' এখনো manager-এর চূড়ান্ত ব্যাখ্যা যোগ করা হয়নি।'
    if (site.status === 'insufficient_data') {
      return {
        text: `${site.name}-এর মানচিত্রে আঁকা আয়তন ${toBanglaNumerals(site.areaHa.toFixed(1))} হেক্টর, যা ১০ মিটার satellite pixel দিয়ে নির্ভরযোগ্যভাবে তুলনা করার জন্য খুবই ছোট। তাই field photo বা সরেজমিন তথ্য দরকার।${decisionText}`,
        sources: ['Site record', 'Sentinel-2'],
      }
    }
    if (site.measured) {
      return {
        text: `${site.name}-এর সর্বশেষ সংরক্ষিত satellite পরিমাপ: ${describeComparison(site.measured)} এটি পিক্সেল-আকারের অনিশ্চয়তাসহ একটি অনুমান; field evidence দিয়ে যাচাই করা দরকার এবং এটি নিজে থেকে দখল বা স্থায়ী ক্ষতির প্রমাণ নয়।${decisionText}`,
        sources: ['Site record', 'Satellite measurement'],
      }
    }
    return {
      text: `${site.name}-এর পানির আয়তনের পরিবর্তন এখনো পরিমাপ করা হয়নি। এখন পর্যন্ত শুধু বার্ষিক Sentinel-2 ছবি পাশাপাশি দেখে তুলনা করা যায়। যে কোনো পরিবর্তন field evidence দিয়ে যাচাই করা দরকার; এটি নিজে থেকে দখল বা স্থায়ী ক্ষতির প্রমাণ নয়।${decisionText}`,
      sources: ['Site record', 'Sentinel-2'],
    }
  }

  if (questionId === 'reports') {
    const waiting = siteReports.filter((report) => report.status === 'pending' || report.status === 'under_review')
    if (!waiting.length) {
      return { text: `${site.name}-এ যাচাইয়ের অপেক্ষায় কোনো community report নেই। মোট report ${toBanglaNumerals(siteReports.length)}টি।`, sources: ['Community reports'] }
    }
    const names = waiting.map((report) => `${report.id} (${REPORT_CATEGORIES[report.category].label})`).join(', ')
    return {
      text: `${site.name}-এ ${toBanglaNumerals(waiting.length)}টি community report যাচাইয়ের অপেক্ষায় আছে: ${names}। যাচাই হওয়া report মানে প্রমাণ দেখা হয়েছে, পুরো জলাশয়ের অবস্থা নিশ্চিত হয়েছে তা নয়।`,
      sources: waiting.slice(0, 4).map((report) => `Report ${report.id}`),
    }
  }

  if (questionId === 'pending') {
    if (!openTasks.length) return { text: `${site.name}-এর কোনো বাকি task নেই।`, sources: ['Task register'] }
    const names = openTasks.map((task) => `${task.id} (${task.title})`).join(', ')
    return {
      text: `${site.name}-এ ${toBanglaNumerals(openTasks.length)}টি কাজ বাকি: ${names}।${showBudget ? ` বর্তমান actual cost ${formatBdtBangla(actualCost)}, planned allocation ${formatBdtBangla(plannedCost)}।` : ''}`,
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
      text: `${site.name}-এর জলাশয়ের সীমানা OpenStreetMap থেকে নেওয়া এবং এখনো যাচাই করা হয়নি। পানির আয়তনের পরিবর্তন পরিমাপ করা হয়নি। বার্ষিক composite-এ মৌসুমি পানির উচ্চতার প্রভাব থাকে এবং ১০ মিটার resolution-এ ছোট জলাশয় ধরা কঠিন। Satellite ছবি একটি review signal; field verification ছাড়া এটি চূড়ান্ত প্রমাণ নয়।`,
      sources: ['Site record', 'OpenStreetMap', 'Sentinel-2'],
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

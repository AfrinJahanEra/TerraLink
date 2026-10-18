import { isTaskClosed } from '../constants/status'

/** The money given for a task: the amount set when it was assigned plus any extra the manager approved. */
export const taskBudget = (task) => Number(task.budget ?? task.estimatedCost ?? 0)

export function getDirectSiteExpenses(siteId, tasks, expenses) {
  const taskIds = new Set(tasks.filter((task) => task.siteId === siteId).map((task) => task.id))
  return expenses
    .filter((expense) => expense.approvalStatus === 'approved' && expense.siteId === siteId && (!expense.taskId || !taskIds.has(expense.taskId)))
    .reduce((sum, expense) => sum + Number(expense.amount || 0), 0)
}

export function getSiteActual(siteId, tasks, expenses) {
  const taskActual = tasks
    .filter((task) => task.siteId === siteId)
    .reduce((sum, task) => sum + Number(task.actualCost || 0), 0)
  return taskActual + getDirectSiteExpenses(siteId, tasks, expenses)
}

export function buildSiteBudgetRows(sites, tasks, siteBudgets, expenses) {
  return sites.map((site) => {
    const planned = Number(siteBudgets[site.id] || 0)
    const actual = getSiteActual(site.id, tasks, expenses)
    return {
      id: site.id,
      name: site.name,
      location: site.location,
      planned,
      actual,
      remaining: planned - actual,
      overBudget: actual > planned,
      taskCount: tasks.filter((task) => task.siteId === site.id).length,
    }
  })
}

export function buildTaskBudgetRows(tasks) {
  return tasks.map((task) => {
    const planned = taskBudget(task)
    const actual = Number(task.actualCost || 0)
    return {
      id: task.id,
      name: task.title,
      location: task.site,
      planned,
      actual,
      remaining: planned - actual,
      overBudget: actual > planned,
      taskCount: 1,
    }
  })
}

export function calculateBudgetSummary(siteRows, tasks) {
  const total = siteRows.reduce((sum, row) => sum + row.planned, 0)
  const spent = siteRows.reduce((sum, row) => sum + row.actual, 0)
  const pending = tasks
    .filter((task) => !isTaskClosed(task))
    .reduce((sum, task) => sum + Math.max(taskBudget(task) - Number(task.actualCost || 0), 0), 0)

  return {
    total,
    spent,
    pending,
    remaining: total - spent,
    overBudget: spent > total,
    overBudgetCount: siteRows.filter((row) => row.overBudget).length,
  }
}

/**
 * Why a task exists, when it came out of a review: a community report the manager verified, or a
 * manager's site review. Returns null for work assigned directly.
 */
export function verifiedOrigin(task, reports) {
  const report = task.reportId ? reports.find((item) => item.id === task.reportId) : null
  if (report?.status === 'verified') {
    const verified = report.history.findLast((entry) => entry.status === 'verified')
    return { kind: 'report', label: `Verified report ${report.id}`, at: verified?.at ?? null, by: verified?.by ?? '' }
  }
  const fromReview = task.source === 'site_review' || task.activityHistory?.some((entry) => / analysis$/.test(entry.action))
  return fromReview ? { kind: 'review', label: 'Site review', at: task.createdAt ?? null, by: task.assignedBy ?? '' } : null
}

/** Per lake, the tasks assigned after a verified review, with their estimate and approved spend. */
export function buildVerifiedWorkRows(sites, tasks, reports, siteBudgets) {
  return sites.map((site) => {
    const jobs = tasks
      .filter((task) => task.siteId === site.id && task.status !== 'cancelled')
      .map((task) => ({ task, origin: verifiedOrigin(task, reports) }))
      .filter((item) => item.origin)
      .sort((a, b) => (b.task.assignedAt ?? b.task.createdAt ?? '').localeCompare(a.task.assignedAt ?? a.task.createdAt ?? ''))
    return {
      site,
      planned: Number(siteBudgets[site.id] || 0),
      jobs,
      estimated: jobs.reduce((sum, { task }) => sum + taskBudget(task), 0),
      actual: jobs.reduce((sum, { task }) => sum + Number(task.actualCost || 0), 0),
      pending: jobs.reduce((sum, { task }) => sum + Number(task.pendingCost || 0), 0),
    }
  }).filter((row) => row.jobs.length)
}

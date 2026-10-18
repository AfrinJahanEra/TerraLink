/**
 * The workspace's derived state: task costs, which reports are resolved, and each water body's status.
 * Shared by the web app (AppContext) and the Discord bot, so both always say the same thing about a lake.
 * Pure functions of the saved workspace; no React and no browser APIs.
 */
import { OPEN_REPORT_STATUSES } from '../constants/reports'
import { buildSite, dashboardSites } from '../data/dashboard'
import { describeComparison } from './observations'
import { dueLabel } from './tasks'

/** Turns a stored custom site record into the same shape as the pilot sites. */
export function toSite(record) {
  const { body, ...details } = record
  return buildSite(body, { ...details, custom: true })
}

/** A task's budget is what was given plus approved extra; its actual cost is the sum of accepted expenses. */
export function deriveTasks(workspace) {
  return workspace.tasks.map((task) => {
    const own = workspace.expenses.filter((expense) => expense.taskId === task.id)
    const sum = (status) => own.filter((expense) => expense.approvalStatus === status).reduce((total, expense) => total + Number(expense.amount || 0), 0)
    const extraBudget = (task.budgetTopUps ?? []).reduce((total, item) => total + Number(item.amount || 0), 0)
    const budget = Number(task.estimatedCost || 0) + extraBudget
    const actualCost = sum('approved')
    return { ...task, due: dueLabel(task.dueDate), actualCost, pendingCost: sum('pending'), extraBudget, budget, remainingBudget: budget - actualCost }
  })
}

/** A report counts as resolved once a task opened from it is completed with the outcome Resolved. */
export function deriveReports(workspace, tasks) {
  return workspace.communityReports.map((report) => {
    const linked = tasks.filter((task) => task.reportId === report.id)
    return {
      ...report,
      tasks: linked.map((task) => ({ id: task.id, title: task.title, status: task.status, resolution: task.resolution ?? null })),
      resolved: linked.some((task) => task.status === 'completed' && task.resolution?.outcome === 'resolved'),
    }
  })
}

/** Every water body with its current status, latest measurement and number of open reports. */
export function deriveSites(workspace, communityReports) {
  return [...dashboardSites, ...(workspace.customSites ?? []).map(toSite)].map((site) => {
    const openReports = communityReports.filter((report) => report.siteId === site.id && !report.resolved && OPEN_REPORT_STATUSES.includes(report.status)).length
    const measured = workspace.comparisons.find((item) => item.siteId === site.id) ?? null
    const merged = { ...site, ...workspace.siteUpdates[site.id], openReports, measured }
    // A manager decision always wins. Then a measurement replaces the sample classification, and open community reports flag the site.
    if (!workspace.decisions[site.id] && measured) {
      if (measured.result.verdict === 'decrease') merged.status = 'needs_review'
      else if (measured.result.reliable && measured.result.verdict !== 'not_reliable') merged.status = 'no_change'
      merged.reviewNote = describeComparison(measured)
    }
    return !workspace.decisions[site.id] && openReports ? { ...merged, status: 'reported_issue' } : merged
  })
}

/** Everything derived at once, for consumers outside React. */
export function deriveWorkspace(workspace) {
  const tasks = deriveTasks(workspace)
  const communityReports = deriveReports(workspace, tasks)
  return { tasks, communityReports, sites: deriveSites(workspace, communityReports) }
}

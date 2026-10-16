import { isTaskClosed } from '../constants/status'

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
    const planned = Number(task.estimatedCost || 0)
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
    .reduce((sum, task) => sum + Math.max(Number(task.estimatedCost || 0) - Number(task.actualCost || 0), 0), 0)

  return {
    total,
    spent,
    pending,
    remaining: total - spent,
    overBudget: spent > total,
    overBudgetCount: siteRows.filter((row) => row.overBudget).length,
  }
}

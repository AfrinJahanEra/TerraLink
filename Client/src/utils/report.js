import { SITE_STATUS } from '../constants/status'
import { METHOD } from '../constants/observations'
import { buildSiteBudgetRows } from './budget'

function inDateRange(value, from, to) {
  if (!value) return false
  const date = String(value).slice(0, 10)
  return (!from || date >= from) && (!to || date <= to)
}

export function formatReportDate(value) {
  if (!value) return 'Not recorded'
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
  }).format(new Date(`${String(value).slice(0, 10)}T12:00:00`))
}

export function buildReportData({ sites, tasks, decisions, expenses, siteBudgets, communityReports = [], siteId, from, to }) {
  const selectedSites = siteId === 'all' ? sites : sites.filter((site) => site.id === siteId)
  const selectedSiteIds = new Set(selectedSites.map((site) => site.id))
  const selectedTasks = tasks.filter((task) => selectedSiteIds.has(task.siteId) && inDateRange(task.dueDate, from, to))
  const selectedExpenses = expenses.filter((expense) => selectedSiteIds.has(expense.siteId) && inDateRange(expense.date, from, to))
  const budgetRows = buildSiteBudgetRows(selectedSites, selectedTasks, siteBudgets, selectedExpenses)
  const observations = selectedSites.map((site) => {
    return {
      ...site,
      measured: site.measured ?? null,
      reports: communityReports.filter((item) => item.siteId === site.id && item.status !== 'rejected'),
      statusLabel: SITE_STATUS[site.status]?.label ?? 'Unknown',
      decision: decisions[site.id] ?? null,
    }
  })

  return {
    generatedAt: new Date().toISOString(),
    siteId,
    from,
    to,
    sites: selectedSites,
    observations,
    reports: communityReports.filter((item) => selectedSiteIds.has(item.siteId) && inDateRange(item.observedAt, from, to)),
    tasks: selectedTasks,
    expenses: selectedExpenses,
    budgetRows,
    totals: budgetRows.reduce((total, row) => ({
      planned: total.planned + row.planned,
      actual: total.actual + row.actual,
      variance: total.variance + row.remaining,
    }), { planned: 0, actual: 0, variance: 0 }),
    sources: { imagery: 'Sentinel-2 L2A scenes, dated as shown', provider: METHOD.source, resolution: '10 m source imagery', measurement: METHOD.label },
  }
}

export function buildReportEmailSummary(report) {
  const completed = report.tasks.filter((task) => task.status === 'completed').length
  const overBudget = report.budgetRows.filter((row) => row.overBudget).length
  const scope = report.siteId === 'all' ? 'All monitored sites' : report.sites[0]?.name ?? 'Selected site'
  return [
    `Scope: ${scope}`,
    `Period: ${formatReportDate(report.from)} to ${formatReportDate(report.to)}`,
    `Water bodies: ${report.observations.length}`,
    `Community reports: ${report.reports.length} (${report.reports.filter((item) => item.status === 'verified').length} verified)`,
    `Tasks: ${report.tasks.length} (${completed} reported complete)`,
    `Actual cost: ৳${report.totals.actual.toLocaleString('en-US')}`,
    `Sites over budget: ${overBudget}`,
    `Measured water-area change: ${report.observations.filter((item) => item.measured).length} of ${report.observations.length} water bodies; others are not yet measured.`,
  ].join('\n')
}

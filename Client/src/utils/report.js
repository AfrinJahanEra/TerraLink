import { SITE_STATUS } from '../constants/status'
import { analysisSources, getSiteComparisons } from '../data/siteAnalysis'
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

export function buildReportData({ sites, tasks, decisions, expenses, siteBudgets, siteId, from, to }) {
  const selectedSites = siteId === 'all' ? sites : sites.filter((site) => site.id === siteId)
  const selectedSiteIds = new Set(selectedSites.map((site) => site.id))
  const selectedTasks = tasks.filter((task) => selectedSiteIds.has(task.siteId) && inDateRange(task.dueDate, from, to))
  const selectedExpenses = expenses.filter((expense) => selectedSiteIds.has(expense.siteId) && inDateRange(expense.date, from, to))
  const budgetRows = buildSiteBudgetRows(selectedSites, selectedTasks, siteBudgets, selectedExpenses)
  const observations = selectedSites.map((site) => {
    const comparison = getSiteComparisons(site).find((item) => item.id === '2021-2024') ?? getSiteComparisons(site)[0]
    return {
      ...site,
      comparison,
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
    tasks: selectedTasks,
    expenses: selectedExpenses,
    budgetRows,
    totals: budgetRows.reduce((total, row) => ({
      planned: total.planned + row.planned,
      actual: total.actual + row.actual,
      variance: total.variance + row.remaining,
    }), { planned: 0, actual: 0, variance: 0 }),
    sources: analysisSources,
  }
}

export function buildReportEmailSummary(report) {
  const completed = report.tasks.filter((task) => task.status === 'reported_complete').length
  const overBudget = report.budgetRows.filter((row) => row.overBudget).length
  const scope = report.siteId === 'all' ? 'All monitored sites' : report.sites[0]?.name ?? 'Selected site'
  return [
    `Scope: ${scope}`,
    `Period: ${formatReportDate(report.from)} to ${formatReportDate(report.to)}`,
    `Observations: ${report.observations.length}`,
    `Tasks: ${report.tasks.length} (${completed} reported complete)`,
    `Actual cost: ৳${report.totals.actual.toLocaleString('en-US')}`,
    `Sites over budget: ${overBudget}`,
    'Measurements are illustrative sample calculations; imagery sources are attributed in the full report.',
  ].join('\n')
}

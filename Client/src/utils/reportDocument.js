import { REPORT_CATEGORIES, REPORT_STATUS } from '../constants/reports'
import { TASK_STATUS } from '../constants/status'
import { formatPercent, formatSignedHa } from './observations'
import { formatReportDate } from './report'

/**
 * The report as plain tables of text, shared by the PDF and the email so both say the same thing.
 * Text is limited to what the PDF's built-in font can print: the taka sign becomes "BDT" and the
 * typographic minus becomes a hyphen.
 */
export function plain(text) {
  return String(text ?? '')
    .replaceAll('৳', 'BDT ')
    .replaceAll('−', '-')
    .replaceAll(/[^\x20-\x7E\xA0-\xFF\u2013\u2014\u2018\u2019\u201C\u201D\u2022\u2026]/g, '')
    .replaceAll(/\s+/g, ' ')
    .trim()
}

export const bdt = (value) => {
  const amount = Math.round(Number(value) || 0)
  return `${amount < 0 ? '-' : ''}BDT ${Math.abs(amount).toLocaleString('en-US')}`
}

export function reportScope(report) {
  return report.siteId === 'all' ? 'All monitored wetlands' : report.sites[0]?.name ?? 'Selected site'
}

export function reportPeriod(report) {
  return `${formatReportDate(report.from)} to ${formatReportDate(report.to)}`
}

function waterChange(item) {
  if (!item.measured) return 'Not yet measured'
  if (item.measured.result.verdict === 'not_reliable') return 'Not reliable'
  return `${formatSignedHa(item.measured.result.deltaM2)} (${formatPercent(item.measured.result.percent)})`
}

export function buildReportTables(report) {
  const completed = report.tasks.filter((task) => task.status === 'completed').length
  const verified = report.reports.filter((item) => item.status === 'verified').length
  const measured = report.observations.filter((item) => item.measured).length
  const overBudget = report.budgetRows.filter((row) => row.overBudget).length
  const siteName = (id) => report.sites.find((site) => site.id === id)?.name ?? ''

  return {
    scope: plain(reportScope(report)),
    period: plain(reportPeriod(report)),
    generated: plain(formatReportDate(report.generatedAt)),
    figures: [
      ['Water bodies', String(report.observations.length)],
      ['Community reports', `${report.reports.length} (${verified} verified)`],
      ['Tasks in period', `${report.tasks.length} (${completed} completed)`],
      ['Water area measured', `${measured} of ${report.observations.length}`],
      ['Planned budget', bdt(report.totals.planned)],
      ['Actual cost', bdt(report.totals.actual)],
      ['Sites over budget', String(overBudget)],
    ],
    sites: {
      head: ['Site', 'Mapped area', 'Water-area change', 'Reports', 'Status'],
      rows: report.observations.map((item) => [plain(`${item.name}, ${item.location}`), plain(item.area), plain(waterChange(item)), String(item.reports.length), plain(item.statusLabel)]),
    },
    decisions: {
      head: ['Site', 'Decision', 'Reason'],
      rows: report.observations.map((item) => [
        plain(item.name),
        item.decision ? `${plain(item.statusLabel)}\n${plain(`${item.decision.decidedBy}, ${item.decision.displayDate}`)}` : 'Decision pending',
        plain(item.decision?.note || item.reviewNote || 'No decision recorded.'),
      ]),
    },
    community: {
      head: ['Report', 'Water body', 'Problem', 'Observed', 'Review status'],
      rows: report.reports.map((item) => [item.id, plain(siteName(item.siteId)), plain(REPORT_CATEGORIES[item.category]?.label), plain(formatReportDate(item.observedAt)), plain(REPORT_STATUS[item.status]?.label)]),
    },
    tasks: {
      head: ['Task', 'Site', 'Assignee', 'Due', 'Status'],
      rows: report.tasks.map((task) => [plain(`${task.id}  ${task.title}`), plain(task.site), plain(task.assignee), plain(formatReportDate(task.dueDate)), plain(TASK_STATUS[task.status]?.label ?? 'Unknown')]),
    },
    costs: {
      head: ['Site', 'Planned', 'Actual', 'Difference'],
      rows: report.budgetRows.map((row) => [plain(row.name), bdt(row.planned), bdt(row.actual), bdt(row.remaining)]),
      total: ['Total', bdt(report.totals.planned), bdt(report.totals.actual), bdt(report.totals.variance)],
    },
    limitations: [
      'Water-area change appears only where a saved satellite measurement exists. It is an estimate from 10 m pixels with the stated uncertainty, not a survey.',
      'Cloud, shadow, seasonality, floating plants, mixed pixels and 10 m source resolution can affect interpretation.',
      'A mapped change is a review signal, not proof of encroachment or permanent wetland loss.',
      'Task and cost totals reflect the workspace records at the time the report was generated.',
    ],
    sources: [
      ['Imagery', plain(report.sources.imagery)],
      ['Provider', plain(report.sources.provider)],
      ['Reference layer', 'Water-body outlines from OpenStreetMap contributors (community-mapped, unverified).'],
      ['Resolution', plain(report.sources.resolution)],
    ],
    disclaimer: 'Sample-data disclaimer. TerraLink is a frontend demonstration. Site classifications, decisions, tasks, people, contacts and costs are illustrative. Water-body outlines and satellite imagery are real third-party data and keep their provider attribution.',
  }
}

export function reportFilename(report) {
  const slug = plain(reportScope(report)).toLowerCase().replaceAll(/[^a-z0-9]+/g, '-').replaceAll(/^-|-$/g, '') || 'report'
  return `terralink-report-${slug}-${report.from}-to-${report.to}.pdf`
}

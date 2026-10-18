import { REPORT_STATUS } from '../constants/reports'
import { SEVERITY } from '../services/wasteDetection'
import { formatAcquired, formatHa, formatPercent, formatSignedHa } from './observations'
import { formatShortDate } from './reports'

/** Reports at this site in which the AI detected waste, newest first. */
export function wasteReportsFor(reports, siteId) {
  return reports
    .filter((report) => report.siteId === siteId && report.aiAnalysis?.hasWaste)
    .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))
}

function satellitePoint(earlier, later, result) {
  const from = formatAcquired(earlier.acquiredAt).date
  const to = formatAcquired(later.acquiredAt).date
  const before = formatHa(earlier.waterAreaM2)
  const after = formatHa(later.waterAreaM2)
  const margin = `± ${formatHa(result.uncertaintyM2)}`
  if (result.verdict === 'decrease') {
    return { tone: 'warn', title: 'Water area: shrinking', text: `The open water fell from ${before} on ${from} to ${after} on ${to}, a loss of ${formatSignedHa(result.deltaM2).replace('−', '')} (${formatPercent(result.percent)}). That is more than the ${margin} margin of error, so the loss is real at satellite scale. Filling, encroachment or floating plants can all cause it; only a field visit can tell which.` }
  }
  if (result.verdict === 'increase') {
    return { tone: 'ok', title: 'Water area: growing', text: `The open water grew from ${before} on ${from} to ${after} on ${to} (${formatSignedHa(result.deltaM2)}, ${formatPercent(result.percent)}), more than the ${margin} margin of error. Usually this is a higher water level or cleared floating plants.` }
  }
  if (result.verdict === 'within_uncertainty') {
    return { tone: 'ok', title: 'Water area: no real change', text: `Satellite images from ${from} and ${to} show about ${before} and ${after} of open water. The ${formatSignedHa(result.deltaM2)} difference is smaller than the ${margin} margin of error, so the lake has not measurably shrunk or grown.` }
  }
  return { tone: 'info', title: 'Water area: cannot be measured reliably', text: 'The water body is too small for 10 m satellite pixels, or the images are not clear enough, so the satellite numbers should not be used here.' }
}

function qualityPoint(earlier, later, result) {
  if (result.warnings.length) return { tone: 'warn', title: 'Image quality: use with care', text: result.warnings.join(' ') }
  const cloud = (o) => (o.cloudCover === null ? 'unknown' : `${o.cloudCover.toFixed(0)}%`)
  const both = (a, b, unit) => (a === b ? `${a} ${unit} on both dates` : `${a} and ${b} ${unit}`)
  const season = result.seasonGapDays === 0 ? 'at the same time of year' : `${result.seasonGapDays} days apart in the yearly cycle`
  return {
    tone: 'ok',
    title: 'Image quality: good',
    text: `Both images were clear (${both(cloud(earlier), cloud(later), 'cloud cover')}, ${both(`${earlier.validPercent}%`, `${later.validPercent}%`, 'of the lake visible')}) and were taken ${season}, so the two dates are comparable.`,
  }
}

function wastePoint(report) {
  if (!report) return { tone: 'ok', title: 'Ground evidence: no waste reported', text: 'No community report with AI-detected waste exists for this water body yet.' }
  const analysis = report.aiAnalysis
  return {
    tone: 'warn',
    title: 'Ground evidence: waste found',
    text: `Community report ${report.id}, seen on ${formatShortDate(report.observedAt)}, shows ${analysis.regions} waste ${analysis.regions === 1 ? 'area' : 'areas'}, mainly ${analysis.types.join(', ').toLowerCase()}. AI severity ${SEVERITY[analysis.severity].label.toLowerCase()}, confidence ${Math.round(analysis.confidence * 100)}%. Review status: ${REPORT_STATUS[report.status].label.toLowerCase()}.`,
  }
}

/** Turns the satellite measurement and the ground evidence into sentences a non-specialist can act on. */
export function buildSiteSummary({ earlier, later, result, wasteReport }) {
  const losing = result.verdict === 'decrease'
  const waste = Boolean(wasteReport)
  let headline
  let conclusion
  if (waste && losing) {
    headline = 'Water loss and waste dumping'
    conclusion = 'Both signals point to a problem: the lake is losing open water and waste is being dumped on it. Treat this site as a priority.'
  } else if (waste) {
    headline = 'Waste dumping, no water loss'
    conclusion = 'The satellite shows no loss of water area, but ground photos show waste dumping. 10 m satellite pixels cannot see waste, so the ground evidence is what matters here.'
  } else if (losing) {
    headline = 'Water loss, no ground evidence yet'
    conclusion = 'The satellite shows a loss of water area but nobody has reported what is happening on the ground. A field visit is needed to find out why.'
  } else {
    headline = 'No sign of a problem'
    conclusion = 'Neither the satellite nor community reports show a problem at this water body right now.'
  }
  const nextStep = waste
    ? wasteReport.aiAnalysis.recommendation
    : losing ? 'Schedule a field visit to photograph the shoreline where water was lost.' : 'Keep monitoring with the next yearly comparison.'
  return {
    headline,
    tone: waste || losing ? 'warn' : 'ok',
    points: [satellitePoint(earlier, later, result), qualityPoint(earlier, later, result), wastePoint(wasteReport)],
    conclusion,
    nextStep,
  }
}

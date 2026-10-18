import { hectares, VERDICT } from '../constants/observations'

export function formatAcquired(iso) {
  const date = new Date(iso)
  return {
    date: new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(date),
    time: `${new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' }).format(date)} UTC`,
  }
}

export const formatHa = (squareMeters) => `${hectares(squareMeters).toFixed(1)} ha`
export const formatSignedHa = (squareMeters) => `${squareMeters > 0 ? '+' : squareMeters < 0 ? '−' : ''}${Math.abs(hectares(squareMeters)).toFixed(1)} ha`
export const formatPercent = (value) => (value === null || value === undefined ? 'Unavailable' : `${value > 0 ? '+' : value < 0 ? '−' : ''}${Math.abs(value).toFixed(1)}%`)

/** One-line description of a saved comparison, for lists, notes and the assistant. */
export function describeComparison(comparison) {
  const { result, earlier, later } = comparison
  const span = `${formatAcquired(earlier.acquiredAt).date} to ${formatAcquired(later.acquiredAt).date}`
  if (result.verdict === 'not_reliable') return `Measured water area between ${span} is not reliable enough to report.`
  return `${VERDICT[result.verdict].label} between ${span}: ${formatSignedHa(result.deltaM2)} (${formatPercent(result.percent)}), uncertainty ±${formatHa(result.uncertaintyM2)}.`
}

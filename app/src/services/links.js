/**
 * Deep links that notification emails and calendar events point back to.
 * They always open the deployed site, never the machine the email was sent from, so a message sent while
 * running locally does not carry a localhost address. Set VITE_APP_URL to use a different domain.
 */
const DEFAULT_APP_URL = 'https://terralink-probah.vercel.app'

export const getAppUrl = () => (import.meta.env.VITE_APP_URL?.trim() || DEFAULT_APP_URL).replace(/\/+$/, '')

export function getTaskLink(task) {
  return `${getAppUrl()}/tasks?task=${encodeURIComponent(task.id)}`
}

export function getReportsLink() {
  return `${getAppUrl()}/reports`
}

export function getBudgetLink() {
  return `${getAppUrl()}/budget`
}

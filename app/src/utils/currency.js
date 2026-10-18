const BANGLA_DIGITS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯']

export function formatBdt(value) {
  const amount = Number(value) || 0
  const sign = amount < 0 ? '−' : ''
  return `${sign}৳${Math.abs(Math.round(amount)).toLocaleString('en-US')}`
}

export function toBanglaNumerals(value) {
  return String(value).replace(/\d/g, (digit) => BANGLA_DIGITS[Number(digit)])
}

export function formatBdtBangla(value) {
  return toBanglaNumerals(formatBdt(value))
}

import { formatDateShort } from './dates'

export const formatMoney = (value) => {
  const num = Number(value) || 0
  const sign = num < 0 ? '−' : ''
  return `${sign}${Math.abs(Math.round(num)).toLocaleString('en-IN')}`
}

export const formatMoneyExact = (value) => {
  const num = Number(value) || 0
  const sign = num < 0 ? '−' : ''
  return `${sign}৳${Math.abs(num).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

export const formatNumber = (value) => {
  const num = Number(value) || 0
  return num.toLocaleString('en-IN')
}

export const formatPct = (value, digits = 1) => {
  const num = Number(value)
  if (!Number.isFinite(num)) return '—'
  return `${num.toFixed(digits)}%`
}

export const formatPercentVal = (part, total) => {
  const denominator = Number(total) || 0
  if (!denominator) return '0.0%'
  return `${((Number(part) || 0) / denominator * 100).toFixed(1)}%`
}

/** Compact BDT for chart axes / tight table cells. */
export const formatCompact = (value) => {
  const num = Number(value) || 0
  const sign = num < 0 ? '−' : ''
  const abs = Math.abs(num)
  if (abs >= 10000000) return `${sign}৳${(abs / 10000000).toFixed(2)}Cr`
  if (abs >= 100000) return `${sign}৳${(abs / 100000).toFixed(1)}L`
  if (abs >= 1000) return `${sign}৳${Math.round(abs / 1000)}k`
  return `${sign}৳${Math.round(abs)}`
}

export const formatDate = formatDateShort

const DATE_OPTIONS = { year: 'numeric', month: 'short', day: 'numeric' }
const DATETIME_OPTIONS = { ...DATE_OPTIONS, hour: '2-digit', minute: '2-digit' }

function toDate(value) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

export function formatDate(value) {
  const date = toDate(value)
  return date ? date.toLocaleDateString(undefined, DATE_OPTIONS) : '—'
}

export function formatDateTime(value) {
  const date = toDate(value)
  return date ? date.toLocaleString(undefined, DATETIME_OPTIONS) : '—'
}

export function formatRelativeTime(value) {
  const date = toDate(value)
  if (!date) return '—'
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000)
  if (seconds < 60) return 'just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`
  return formatDate(value)
}

export function formatCurrency(amount, currency = 'USD') {
  const value = Number(amount)
  return Number.isFinite(value)
    ? value.toLocaleString(undefined, { style: 'currency', currency, maximumFractionDigits: 0 })
    : '—'
}

export function formatNumber(value) {
  const number = Number(value)
  return Number.isFinite(number) ? number.toLocaleString() : '—'
}

export function formatPercent(value) {
  const number = Number(value)
  return Number.isFinite(number) ? `${number.toFixed(1)}%` : '—'
}

export function truncate(text, max = 60) {
  const string = String(text ?? '')
  return string.length > max ? `${string.slice(0, max - 1)}…` : string
}

export function initials(name) {
  const parts = String(name ?? '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
  if (!parts.length) return '?'
  return parts
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('')
}

export function titleCase(value) {
  return String(value ?? '')
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

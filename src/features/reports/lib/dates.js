/** Local-time date helpers shared by the accounting engine. */

export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

export const MONTHS_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
]

const pad = (value) => String(value).padStart(2, '0')

/** Convert a Date to a YYYY-MM-DD string using local calendar values. */
export function isoDate(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

/** Today's local ISO date. */
export function todayISO() {
  return isoDate(new Date())
}

/** Parse YYYY-MM-DD into a local Date (avoids UTC shifts). */
export function parseISO(value) {
  if (!value) return new Date(NaN)
  const [y, m, d] = String(value).slice(0, 10).split('-').map(Number)
  return new Date(y, (m || 1) - 1, d || 1)
}

export function addDays(value, days) {
  const date = parseISO(value)
  date.setDate(date.getDate() + Number(days || 0))
  return isoDate(date)
}

export function addMonths(value, months) {
  const date = parseISO(value)
  date.setDate(1)
  date.setMonth(date.getMonth() + Number(months || 0))
  return isoDate(date)
}

export function firstOfMonth(year, monthIndex) {
  return isoDate(new Date(year, monthIndex, 1))
}

export function lastOfMonth(year, monthIndex) {
  return isoDate(new Date(year, monthIndex + 1, 0))
}

export function daysInMonth(year, monthIndex) {
  return new Date(year, monthIndex + 1, 0).getDate()
}

/** Whole days from `from` to `to` (positive when `to` is later). */
export function daysBetween(from, to) {
  const a = parseISO(from)
  const b = parseISO(to)
  return Math.round((b.getTime() - a.getTime()) / 86400000)
}

export function minISO(a, b) {
  return a <= b ? a : b
}

export function maxISO(a, b) {
  return a >= b ? a : b
}

export function formatDateShort(value) {
  const date = parseISO(value)
  if (Number.isNaN(date.getTime())) return '—'
  return `${date.getDate()} ${MONTHS_SHORT[date.getMonth()]} ${date.getFullYear()}`
}

export function formatDateCompact(value) {
  const date = parseISO(value)
  if (Number.isNaN(date.getTime())) return '—'
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${String(date.getFullYear()).slice(2)}`
}

export function monthLabel(monthIndex, year) {
  return `${MONTH_NAMES[monthIndex]} ${year}`
}

/** Inclusive month window, capped at today for the current month. */
export function monthWindow(year, monthIndex, now = new Date()) {
  const from = firstOfMonth(year, monthIndex)
  const monthEnd = lastOfMonth(year, monthIndex)
  const today = isoDate(now)
  const to = monthIndex === now.getMonth() && year === now.getFullYear() ? minISO(monthEnd, today) : monthEnd
  return { from, to: to < from ? from : to, monthEnd }
}

/** Preset period ranges used by the statement pages. */
export function periodPresets(now = new Date()) {
  const today = isoDate(now)
  const y = now.getFullYear()
  const m = now.getMonth()

  const thisMonth = { from: firstOfMonth(y, m), to: today }
  const prev = new Date(y, m - 1, 1)
  const lastMonth = {
    from: firstOfMonth(prev.getFullYear(), prev.getMonth()),
    to: lastOfMonth(prev.getFullYear(), prev.getMonth()),
  }
  const prev2 = new Date(y, m - 2, 1)

  const quarterStartMonth = Math.floor(m / 3) * 3
  const thisQuarter = { from: firstOfMonth(y, quarterStartMonth), to: today }
  const ytd = { from: `${y}-01-01`, to: today }
  const last6 = {
    from: firstOfMonth(prev2.getFullYear(), prev2.getMonth()),
    to: today,
  }

  return [
    { value: 'this_month', label: 'This month', ...thisMonth },
    { value: 'last_month', label: 'Last month', ...lastMonth },
    { value: 'this_quarter', label: 'This quarter', ...thisQuarter },
    { value: 'ytd', label: 'Year to date', ...ytd },
    { value: 'last_6_months', label: 'Last 6 months', ...last6 },
  ]
}

/** Resolve a preset value to a range, falling back to "this month". */
export function resolvePreset(value, now = new Date()) {
  const presets = periodPresets(now)
  return presets.find((preset) => preset.value === value) ?? presets[0]
}

/** Comparison window of the same length immediately before `from`. */
export function previousWindow(from, to) {
  const start = parseISO(from)
  const length = Math.max(0, daysBetween(from, to)) + 1
  const prevEnd = new Date(start)
  prevEnd.setDate(prevEnd.getDate() - 1)
  const prevStart = new Date(prevEnd)
  prevStart.setDate(prevStart.getDate() - (length - 1))
  return { from: isoDate(prevStart), to: isoDate(prevEnd) }
}

/** Same month-to-date window in the previous month (for like-for-like KPIs). */
export function previousMonthToDate(from, to) {
  const start = parseISO(from)
  const elapsed = Math.max(0, daysBetween(from, to)) + 1
  const prevStart = new Date(start.getFullYear(), start.getMonth() - 1, 1)
  const lastDay = new Date(prevStart.getFullYear(), prevStart.getMonth() + 1, 0).getDate()
  const endDay = Math.min(elapsed, lastDay)
  const prevEnd = new Date(prevStart.getFullYear(), prevStart.getMonth(), endDay)
  return { from: isoDate(prevStart), to: isoDate(prevEnd) }
}

/** Same calendar dates one year earlier (standard comparative period). */
export function priorYearWindow(from, to) {
  const start = parseISO(from)
  const end = parseISO(to)
  const priorStart = new Date(start.getFullYear() - 1, start.getMonth(), start.getDate())
  const priorEnd = new Date(end.getFullYear() - 1, end.getMonth(), end.getDate())
  return { from: isoDate(priorStart), to: isoDate(priorEnd) }
}

/** Human label for an arbitrary range. */
export function rangeLabel(from, to) {
  if (!from || !to) return '—'
  return `${formatDateShort(from)} — ${formatDateShort(to)}`
}

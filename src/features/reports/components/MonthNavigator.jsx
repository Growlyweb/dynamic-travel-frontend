import { ChevronLeft, ChevronRight } from 'lucide-react'
import { MONTH_NAMES } from '../lib/dates'

const selectClass =
  'h-8 rounded-lg border border-slate-200 bg-white px-2 text-[11.5px] font-semibold text-slate-700 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15'

export default function MonthNavigator({ year, month, onChange, years = [], label }) {
  const now = new Date()
  const atCurrent = year === now.getFullYear() && month === now.getMonth()

  const step = (delta) => {
    const date = new Date(year, month + delta, 1)
    onChange({ year: date.getFullYear(), month: date.getMonth() })
  }

  const yearOptions = [...new Set([now.getFullYear(), year, ...years])].sort((a, b) => b - a)

  return (
    <div className="flex flex-wrap items-center gap-2">
      {label ? (
        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">{label}</span>
      ) : null}
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => step(-1)}
          aria-label="Previous month"
          className="grid size-8 place-items-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50"
        >
          <ChevronLeft className="size-4" />
        </button>
        <select
          value={month}
          aria-label="Month"
          onChange={(event) => onChange({ year, month: Number(event.target.value) })}
          className={selectClass}
        >
          {MONTH_NAMES.map((name, index) => (
            <option key={name} value={index}>
              {name}
            </option>
          ))}
        </select>
        <select
          value={year}
          aria-label="Year"
          onChange={(event) => onChange({ year: Number(event.target.value), month })}
          className={selectClass}
        >
          {yearOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => step(1)}
          disabled={atCurrent}
          aria-label="Next month"
          className="grid size-8 place-items-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>
      {!atCurrent ? (
        <button
          type="button"
          onClick={() => onChange({ year: now.getFullYear(), month: now.getMonth() })}
          className="rounded-lg px-2 py-1 text-[11px] font-semibold text-primary transition hover:bg-[#E6F2FD]"
        >
          This month
        </button>
      ) : (
        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-wide text-emerald-700">
          <span className="size-1.5 rounded-full bg-emerald-500" />
          Live month
        </span>
      )}
    </div>
  )
}

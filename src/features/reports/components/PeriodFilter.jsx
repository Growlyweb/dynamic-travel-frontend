import { CalendarDays } from 'lucide-react'
import { periodPresets, rangeLabel } from '../accounting/dates'

const inputClass =
  'h-8 rounded-lg border border-slate-200 bg-white px-2 text-[11.5px] font-medium text-slate-700 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15'

export default function PeriodFilter({ from, to, onChange, className = '', showPresets = true }) {
  const presets = periodPresets()
  const active = presets.find((preset) => preset.from === from && preset.to === to)?.value

  const update = (next) => {
    if (!next.from || !next.to) return
    if (next.from > next.to) {
      onChange({ from: next.to, to: next.from, label: rangeLabel(next.to, next.from) })
      return
    }
    onChange({ ...next, label: rangeLabel(next.from, next.to) })
  }

  return (
    <div
      className={`flex flex-col gap-2.5 rounded-2xl border border-slate-200/80 bg-white px-3.5 py-3 shadow-[0_4px_24px_rgba(15,23,42,0.03)] lg:flex-row lg:items-center lg:justify-between ${className}`}
    >
      <div className="flex flex-wrap items-center gap-1">
        <span className="mr-1 inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
          <CalendarDays className="size-3.5 text-primary" />
          Period
        </span>
        {showPresets &&
          presets.map((preset) => (
            <button
              key={preset.value}
              type="button"
              onClick={() => update({ from: preset.from, to: preset.to })}
              className={`rounded-lg px-2.5 py-1.5 text-[11.5px] font-semibold transition ${
                active === preset.value
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {preset.label}
            </button>
          ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <input
          type="date"
          aria-label="From date"
          value={from}
          max={to}
          onChange={(event) => update({ from: event.target.value, to })}
          className={inputClass}
        />
        <span className="text-[11px] font-medium text-slate-400">to</span>
        <input
          type="date"
          aria-label="To date"
          value={to}
          min={from}
          onChange={(event) => update({ from, to: event.target.value })}
          className={inputClass}
        />
        <span className="hidden rounded-md bg-slate-50 px-2 py-1 text-[11px] font-semibold text-slate-500 sm:inline">
          {rangeLabel(from, to)}
        </span>
      </div>
    </div>
  )
}

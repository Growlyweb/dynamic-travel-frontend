import { ArrowDownRight, ArrowUpRight } from 'lucide-react'

const TONES = {
  primary: { chip: 'bg-[#E6F2FD] text-[#0879E8]', value: 'text-slate-900', accent: 'bg-[#0879E8]' },
  success: { chip: 'bg-emerald-50 text-emerald-600', value: 'text-emerald-700', accent: 'bg-emerald-500' },
  warning: { chip: 'bg-amber-50 text-amber-600', value: 'text-slate-900', accent: 'bg-amber-500' },
  danger: { chip: 'bg-rose-50 text-rose-600', value: 'text-rose-600', accent: 'bg-rose-500' },
  violet: { chip: 'bg-violet-50 text-violet-600', value: 'text-slate-900', accent: 'bg-violet-500' },
  slate: { chip: 'bg-slate-100 text-slate-600', value: 'text-slate-900', accent: 'bg-slate-400' },
}

export default function MetricCard({
  label,
  value,
  hint,
  delta,
  deltaSuffix = 'vs previous period',
  icon: Icon,
  tone = 'primary',
  onClick,
  footer,
  invertDelta = false,
}) {
  const current = TONES[tone] || TONES.primary
  const hasDelta = Number.isFinite(delta)
  const positive = hasDelta && delta >= 0
  const favourable = invertDelta ? !positive : positive

  return (
    <div
      onClick={onClick}
      className={`group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_4px_24px_rgba(15,23,42,0.035)] transition-all ${
        onClick ? 'cursor-pointer hover:-translate-y-0.5 hover:shadow-[0_10px_30px_rgba(15,23,42,0.08)]' : ''
      }`}
    >
      <span className={`absolute inset-x-0 top-0 h-0.5 ${current.accent} opacity-70`} aria-hidden="true" />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.09em] text-slate-500">{label}</p>
          <p className={`mt-2 text-[25px] font-bold leading-none tracking-tight tabular-nums ${current.value}`}>
            {value}
          </p>
        </div>
        {Icon ? (
          <span className={`grid size-9 shrink-0 place-items-center rounded-xl border border-white/60 ${current.chip}`}>
            <Icon className="size-4.5" />
          </span>
        ) : null}
      </div>

      <div className="mt-3 flex min-h-4 items-center gap-1.5 text-[11.5px]">
        {hasDelta ? (
          <span
            className={`inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 font-bold ${
              favourable ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-600'
            }`}
          >
            {positive ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}
            {Math.abs(delta).toFixed(1)}%
          </span>
        ) : null}
        <span className="truncate text-slate-500">{hint || deltaSuffix}</span>
      </div>

      {footer ? <div className="mt-3 border-t border-slate-100 pt-2.5 text-[11px] text-slate-500">{footer}</div> : null}
    </div>
  )
}

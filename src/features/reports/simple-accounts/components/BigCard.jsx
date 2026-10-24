const TONES = {
  blue: { value: 'text-slate-900', accent: 'bg-[#2F80ED]', chip: 'bg-[#E6F2FD] text-[#2F80ED]' },
  green: { value: 'text-emerald-700', accent: 'bg-emerald-500', chip: 'bg-emerald-50 text-emerald-700' },
  amber: { value: 'text-amber-700', accent: 'bg-amber-500', chip: 'bg-amber-50 text-amber-700' },
  red: { value: 'text-rose-600', accent: 'bg-rose-500', chip: 'bg-rose-50 text-rose-600' },
  slate: { value: 'text-slate-900', accent: 'bg-slate-400', chip: 'bg-slate-100 text-slate-600' },
}

export default function BigCard({ label, value, hint, tone = 'blue', icon: Icon, footer }) {
  const style = TONES[tone] || TONES.blue
  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <span className={`absolute inset-x-0 top-0 h-1 ${style.accent}`} />
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-base font-semibold text-slate-600">{label}</p>
          <p className={`mt-3 text-4xl font-bold tracking-tight tabular-nums ${style.value}`}>{value}</p>
          {hint ? <p className="mt-2 text-sm text-slate-500">{hint}</p> : null}
        </div>
        {Icon ? (
          <span className={`grid size-12 shrink-0 place-items-center rounded-xl ${style.chip}`}>
            <Icon className="size-6" />
          </span>
        ) : null}
      </div>
      {footer ? <div className="mt-4 border-t border-slate-100 pt-3 text-sm text-slate-500">{footer}</div> : null}
    </div>
  )
}

import { formatMoney } from '../lib/format'

export default function AgingBars({ aging = [], total, columns = 5 }) {
  const sum = total ?? aging.reduce((acc, item) => acc + (Number(item.amount) || 0), 0)

  return (
    <div>
      <div className="flex h-3 w-full overflow-hidden rounded-full bg-slate-100">
        {aging.map((bucket) => {
          const value = Number(bucket.amount) || 0
          if (value <= 0) return null
          return (
            <div
              key={bucket.label}
              title={`${bucket.label}: ${formatMoney(value)}`}
              style={{ width: `${sum > 0 ? (value / sum) * 100 : 0}%`, backgroundColor: bucket.color }}
              className="h-full transition-all"
            />
          )
        })}
      </div>

      <div
        className={`mt-3.5 grid gap-x-4 gap-y-2.5 ${
          columns === 5 ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5' : 'grid-cols-2 sm:grid-cols-3'
        }`}
      >
        {aging.map((bucket) => {
          const value = Number(bucket.amount) || 0
          const pct = sum > 0 ? (value / sum) * 100 : 0
          return (
            <div key={bucket.label} className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="size-2 shrink-0 rounded-sm" style={{ backgroundColor: bucket.color }} />
                <span className="truncate text-[10.5px] font-medium text-slate-500">{bucket.label}</span>
              </div>
              <p className="mt-0.5 truncate text-[12.5px] font-bold tabular-nums text-slate-800">
                {formatMoney(value)}
              </p>
              <p className="text-[10px] text-slate-400">{pct.toFixed(1)}%</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}

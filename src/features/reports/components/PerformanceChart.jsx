import { formatCompact, formatMoney } from '../lib/format'

/**
 * Revenue / total cost columns with a net-profit line on the same scale.
 * Pure SVG so it stays dependency-free and theme-aware.
 */
export default function PerformanceChart({
  data = [],
  height = 250,
  title,
  subtitle,
  revenueLabel = 'Revenue',
  costLabel = 'Cost & expenses',
  profitLabel = 'Net profit',
}) {
  if (!data.length) {
    return (
      <div className="flex h-56 items-center justify-center text-sm text-slate-400">
        No monthly data available
      </div>
    )
  }

  const width = 680
  const pad = { top: 18, right: 16, bottom: 30, left: 58 }
  const plotWidth = width - pad.left - pad.right
  const plotHeight = height - pad.top - pad.bottom

  const maxValue = Math.max(
    1,
    ...data.map((row) => Math.max(Number(row.revenue) || 0, Number(row.cost) || 0))
  )
  const ceiling = Math.ceil(maxValue / 100000) * 100000
  const baseline = pad.top + plotHeight
  const slot = plotWidth / data.length
  const barWidth = Math.min(20, Math.max(9, slot * 0.26))

  const y = (value) => baseline - (Math.max(0, Number(value) || 0) / ceiling) * plotHeight
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((fraction) => ({
    y: baseline - fraction * plotHeight,
    value: Math.round(ceiling * fraction),
  }))

  const points = data.map((row, index) => ({
    x: pad.left + index * slot + slot / 2,
    y: y(row.profit),
  }))
  const linePath = points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ')

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        {title ? <p className="text-[12.5px] font-bold text-slate-800">{title}</p> : null}
        <div className="flex flex-wrap items-center gap-3 text-[10.5px] font-medium text-slate-500">
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2.5 rounded-sm bg-[#0879E8]" /> {revenueLabel}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2.5 rounded-sm bg-[#CBD5E1]" /> {costLabel}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-0.5 w-3.5 rounded-full bg-emerald-500" /> {profitLabel}
          </span>
        </div>
      </div>

      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" role="img" aria-label={title || 'Monthly performance'}>
        {ticks.map((tick) => (
          <g key={tick.value}>
            <line
              x1={pad.left}
              x2={width - pad.right}
              y1={tick.y}
              y2={tick.y}
              stroke="#E2E8F0"
              strokeDasharray="3 4"
            />
            <text x={pad.left - 8} y={tick.y + 3.5} textAnchor="end" fontSize="9" fill="#94A3B8">
              {formatCompact(tick.value).replace('৳', '')}
            </text>
          </g>
        ))}

        {data.map((row, index) => {
          const center = pad.left + index * slot + slot / 2
          const revenueHeight = Math.max(2, baseline - y(row.revenue))
          const costHeight = Math.max(2, baseline - y(row.cost))
          return (
            <g key={row.label}>
              <rect
                x={center - barWidth - 1.5}
                y={baseline - revenueHeight}
                width={barWidth}
                height={revenueHeight}
                rx="3"
                fill="#0879E8"
                opacity="0.92"
              >
                <title>{`${row.label} revenue: ${formatMoney(row.revenue)}`}</title>
              </rect>
              <rect
                x={center + 1.5}
                y={baseline - costHeight}
                width={barWidth}
                height={costHeight}
                rx="3"
                fill="#CBD5E1"
              >
                <title>{`${row.label} cost: ${formatMoney(row.cost)}`}</title>
              </rect>
              <text x={center} y={height - 10} textAnchor="middle" fontSize="10" fill="#64748B" fontWeight="600">
                {row.label}
              </text>
            </g>
          )
        })}

        <path d={linePath} fill="none" stroke="#10B981" strokeWidth="2" strokeLinejoin="round" />
        {points.map((point, index) => (
          <g key={`point-${data[index].label}`}>
            <circle cx={point.x} cy={point.y} r="3.2" fill="#fff" stroke="#10B981" strokeWidth="2">
              <title>{`${data[index].label} net profit: ${formatMoney(data[index].profit)}`}</title>
            </circle>
          </g>
        ))}
      </svg>
      {subtitle ? <p className="mt-1 text-[10.5px] text-slate-400">{subtitle}</p> : null}
    </div>
  )
}

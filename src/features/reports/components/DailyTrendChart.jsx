import React from 'react'
import { formatMoney } from '../reports.api'

/**
 * DailyTrendChart
 * Daily selling price vs cost price bars matching project styling (.card, .chart, .chart__tick)
 */
export default function DailyTrendChart({
  days = [],
  height = 230,
  title = 'Daily Selling vs Cost',
}) {
  if (!days || days.length === 0) {
    return (
      <div className="card">
        <p className="card__title">{title}</p>
        <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
          No daily records for this month
        </div>
      </div>
    )
  }

  const width = 720
  const pad = { top: 20, right: 16, bottom: 26, left: 48 }
  const plotWidth = width - pad.left - pad.right
  const plotHeight = height - pad.top - pad.bottom

  const maxVal = Math.max(1, ...days.map((d) => Math.max(d.sell || 0, d.cost || 0)))
  const ceiling = Math.ceil(maxVal / 50000) * 50000 || 50000
  const baseline = pad.top + plotHeight

  const ticks = [0, 0.5, 1].map((f) => ({
    y: baseline - f * plotHeight,
    label: `${Math.round((ceiling * f) / 1000)}k`,
  }))

  const count = days.length
  const step = plotWidth / count
  const barWidth = Math.max(3, (step - 3) / 2)

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-3">
        <p className="card__title mb-0">{title}</p>
        <div className="flex items-center gap-4 text-xs font-medium text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-xs bg-[#0879E8]" />
            <span>Selling price</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-xs bg-[#dc2626]" />
            <span>Cost price</span>
          </div>
        </div>
      </div>

      <svg className="chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={title}>
        {ticks.map((tick) => (
          <g key={tick.y}>
            <line
              x1={pad.left}
              x2={width - pad.right}
              y1={tick.y}
              y2={tick.y}
              stroke="var(--color-border)"
              strokeDasharray="4 4"
            />
            <text x={pad.left - 8} y={tick.y + 4} textAnchor="end" className="chart__tick">
              {tick.label}
            </text>
          </g>
        ))}

        {days.map((d, i) => {
          const groupX = pad.left + i * step
          const sellH = ((d.sell || 0) / ceiling) * plotHeight
          const costH = ((d.cost || 0) / ceiling) * plotHeight

          const sellX = groupX + 1
          const costX = groupX + barWidth + 2

          const sellY = baseline - sellH
          const costY = baseline - costH

          const showDayLabel = count <= 16 || d.day % 2 === 1

          return (
            <g key={d.day}>
              <rect
                x={sellX}
                y={sellY}
                width={barWidth}
                height={Math.max(0, sellH)}
                rx="2"
                fill="#0879E8"
                className="transition-opacity hover:opacity-80 cursor-pointer"
              >
                <title>{`Day ${d.day}: Selling ${formatMoney(d.sell)}`}</title>
              </rect>

              <rect
                x={costX}
                y={costY}
                width={barWidth}
                height={Math.max(0, costH)}
                rx="2"
                fill="#dc2626"
                className="transition-opacity hover:opacity-80 cursor-pointer"
              >
                <title>{`Day ${d.day}: Cost ${formatMoney(d.cost)}`}</title>
              </rect>

              {showDayLabel && (
                <text
                  x={groupX + step / 2}
                  y={height - 8}
                  textAnchor="middle"
                  className="chart__tick"
                >
                  {d.day}
                </text>
              )}
            </g>
          )
        })}
      </svg>
    </div>
  )
}

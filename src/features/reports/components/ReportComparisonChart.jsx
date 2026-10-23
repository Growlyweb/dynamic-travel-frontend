import React from 'react'
import { formatMoney } from '../reports.api'

/**
 * ReportComparisonChart
 * Displays Selling Price vs Direct Cost bars matching the project's SVG chart design:
 * uses .chart, .chart__tick, stroke="var(--color-border)"
 */
export default function ReportComparisonChart({
  data = [],
  height = 240,
  title = 'Revenue vs Direct Costs (Last 6 Months)',
}) {
  if (!data || data.length === 0) {
    return (
      <div className="card">
        <p className="card__title">{title}</p>
        <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
          No monthly data available
        </div>
      </div>
    )
  }

  const width = 640
  const pad = { top: 20, right: 16, bottom: 28, left: 52 }
  const plotWidth = width - pad.left - pad.right
  const plotHeight = height - pad.top - pad.bottom

  const maxVal = Math.max(1, ...data.map((d) => Math.max(d.revenue || 0, d.cost || 0)))
  const ceiling = Math.ceil(maxVal / 100000) * 100000 || 100000
  const baseline = pad.top + plotHeight

  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => ({
    y: baseline - f * plotHeight,
    label: `${Math.round((ceiling * f) / 1000)}k`,
  }))

  const slot = plotWidth / data.length
  const barWidth = Math.min(22, (slot - 14) / 2)

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-3">
        <p className="card__title mb-0">{title}</p>
        <div className="flex items-center gap-4 text-xs font-medium text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-xs bg-[#0879E8]" />
            <span>Revenue</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-xs bg-[#dc2626]" />
            <span>Direct Cost</span>
          </div>
        </div>
      </div>

      <svg className="chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={title}>
        {/* Y Grid lines */}
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

        {/* Dual Bars */}
        {data.map((d, index) => {
          const revHeight = ((d.revenue || 0) / ceiling) * plotHeight
          const costHeight = ((d.cost || 0) / ceiling) * plotHeight

          const centerX = pad.left + index * slot + slot / 2
          const revX = centerX - barWidth - 1.5
          const costX = centerX + 1.5

          const revY = baseline - revHeight
          const costY = baseline - costHeight

          return (
            <g key={d.label || index}>
              <rect
                x={revX}
                y={revY}
                width={barWidth}
                height={Math.max(2, revHeight)}
                rx="4"
                fill="#0879E8"
                className="transition-opacity hover:opacity-80"
              >
                <title>{`${d.label} Revenue: ${formatMoney(d.revenue)}`}</title>
              </rect>

              <rect
                x={costX}
                y={costY}
                width={barWidth}
                height={Math.max(2, costHeight)}
                rx="4"
                fill="#dc2626"
                className="transition-opacity hover:opacity-80"
              >
                <title>{`${d.label} Cost: ${formatMoney(d.cost)}`}</title>
              </rect>

              <text x={centerX} y={height - 8} textAnchor="middle" className="chart__tick font-medium">
                {d.label}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}

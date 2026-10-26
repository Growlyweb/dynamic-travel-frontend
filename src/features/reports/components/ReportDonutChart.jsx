import React from 'react'
import { formatMoney } from '../reports.api'

/**
 * ReportDonutChart
 * Adheres to project's DonutChart styling (.chart-donut, .chart-legend, .chart__value, .chart__tick)
 */
export default function ReportDonutChart({
  segments = [],
  centerLabel = '',
  centerSub = 'Total Sales',
  title = 'Channel Breakdown',
  size = 200,
  thickness = 24,
  bare = false,
}) {
  const total = segments.reduce((sum, s) => sum + (Number(s.value) || 0), 0) || 1
  const displayTotal = centerLabel || formatMoney(total)

  const radius = (size - thickness) / 2
  const center = size / 2
  const circumference = 2 * Math.PI * radius

  let consumed = 0
  const activeSegments = segments
    .filter((s) => (Number(s.value) || 0) > 0)
    .map((s) => {
      const fraction = s.value / total
      const result = {
        ...s,
        dash: fraction * circumference,
        gap: circumference - fraction * circumference,
        offset: -consumed * circumference,
      }
      consumed += fraction
      return result
    })

  return (
    <div className={bare ? '' : 'card'}>
      {title && <p className="card__title">{title}</p>}

      <div className="chart-donut">
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          role="img"
          aria-label={title}
          className="shrink-0"
        >
          <g transform={`rotate(-90 ${center} ${center})`}>
            {/* Background ring */}
            <circle
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke="var(--color-border)"
              strokeWidth={thickness}
            />

            {/* Segment arcs */}
            {activeSegments.map((segment) => (
              <circle
                key={segment.label}
                cx={center}
                cy={center}
                r={radius}
                fill="none"
                stroke={segment.color || 'var(--color-primary)'}
                strokeWidth={thickness}
                strokeDasharray={`${segment.dash} ${segment.gap}`}
                strokeDashoffset={segment.offset}
                className="transition-all duration-300"
              >
                <title>{`${segment.label}: ${formatMoney(segment.value)} (${((segment.value / total) * 100).toFixed(1)}%)`}</title>
              </circle>
            ))}
          </g>

          <text
            x={center}
            y={center - 2}
            textAnchor="middle"
            className="chart__value"
            style={{ fontSize: 16 }}
          >
            {displayTotal}
          </text>
          <text
            x={center}
            y={center + 18}
            textAnchor="middle"
            className="chart__tick"
            style={{ fontSize: 11 }}
          >
            {centerSub}
          </text>
        </svg>

        <ul className="chart-legend">
          {segments.map((segment) => {
            const val = Number(segment.value) || 0
            const pct = Math.round((val / total) * 100)
            return (
              <li key={segment.label}>
                <span
                  className="chart-legend__dot"
                  style={{ background: segment.color || 'var(--color-primary)' }}
                />
                <span className="font-medium text-slate-700">{segment.label}</span>
                <span className="muted font-semibold">{formatMoney(val)}</span>
                <span className="text-xs text-muted-foreground ml-1 font-normal">
                  ({pct}%)
                </span>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}

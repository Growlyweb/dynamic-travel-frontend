import { CHART_COLORS } from '../../utils/constants'
import { formatNumber } from '../../utils/formatters'

export default function DonutChart({ data = [], size = 200, thickness = 24, centerLabel = 'Total' }) {
  const total = data.reduce((sum, segment) => sum + segment.value, 0)
  const radius = (size - thickness) / 2
  const center = size / 2
  const circumference = 2 * Math.PI * radius

  let consumed = 0
  const segments = data
    .filter((segment) => segment.value > 0)
    .map((segment, index) => {
      const fraction = total > 0 ? segment.value / total : 0
      const result = {
        ...segment,
        color: segment.color ?? CHART_COLORS[index % CHART_COLORS.length],
        dash: fraction * circumference,
        gap: circumference - fraction * circumference,
        offset: -consumed * circumference,
      }
      consumed += fraction
      return result
    })

  return (
    <div className="chart-donut">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label="Donut chart">
        <g transform={`rotate(-90 ${center} ${center})`}>
          <circle cx={center} cy={center} r={radius} fill="none" stroke="var(--color-border)" strokeWidth={thickness} />
          {segments.map((segment) => (
            <circle
              key={segment.label}
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke={segment.color}
              strokeWidth={thickness}
              strokeDasharray={`${segment.dash} ${segment.gap}`}
              strokeDashoffset={segment.offset}
            />
          ))}
        </g>
        <text x={center} y={center - 2} textAnchor="middle" className="chart__value">
          {formatNumber(total)}
        </text>
        <text x={center} y={center + 18} textAnchor="middle" className="chart__tick">
          {centerLabel}
        </text>
      </svg>
      <ul className="chart-legend">
        {segments.map((segment) => (
          <li key={segment.label}>
            <span className="chart-legend__dot" style={{ background: segment.color }} />
            <span>{segment.label}</span>
            <span className="muted">{total ? `${Math.round((segment.value / total) * 100)}%` : '0%'}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

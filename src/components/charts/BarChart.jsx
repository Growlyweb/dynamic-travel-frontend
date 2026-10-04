import EmptyState from '../common/EmptyState'

export default function BarChart({ data = [], height = 240, color = 'var(--color-primary)', formatValue = (v) => v }) {
  if (!data.length) {
    return <EmptyState icon="📊" title="No data yet" description="The chart will render once data is available." />
  }

  const width = 680
  const pad = { top: 20, right: 14, bottom: 28, left: 48 }
  const plotWidth = width - pad.left - pad.right
  const plotHeight = height - pad.top - pad.bottom
  const max = Math.max(...data.map((point) => point.value), 1)
  const slot = plotWidth / data.length
  const barWidth = Math.min(40, slot * 0.6)
  const baseline = pad.top + plotHeight
  const labelEvery = Math.max(1, Math.ceil(data.length / 8))
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((fraction) => ({
    y: baseline - fraction * plotHeight,
    label: formatValue(Math.round(max * fraction)),
  }))

  return (
    <svg className="chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Bar chart">
      {ticks.map((tick) => (
        <g key={tick.y}>
          <line x1={pad.left} x2={width - pad.right} y1={tick.y} y2={tick.y} stroke="var(--color-border)" strokeDasharray="4 4" />
          <text x={pad.left - 8} y={tick.y + 4} textAnchor="end" className="chart__tick">
            {tick.label}
          </text>
        </g>
      ))}
      {data.map((point, index) => {
        const barHeight = (point.value / max) * plotHeight
        const x = pad.left + index * slot + (slot - barWidth) / 2
        const y = baseline - barHeight
        return (
          <g key={point.label}>
            <rect x={x} y={y} width={barWidth} height={barHeight} rx="6" fill={color} opacity="0.85" />
            {slot > 44 ? (
              <text x={x + barWidth / 2} y={y - 6} textAnchor="middle" className="chart__tick">
                {formatValue(point.value)}
              </text>
            ) : null}
            {index % labelEvery === 0 ? (
              <text x={x + barWidth / 2} y={height - 8} textAnchor="middle" className="chart__tick">
                {point.label}
              </text>
            ) : null}
          </g>
        )
      })}
    </svg>
  )
}

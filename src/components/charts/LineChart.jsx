import EmptyState from '../common/EmptyState'

export default function LineChart({ data = [], height = 240, color = 'var(--color-primary)', formatValue = (v) => v }) {
  if (!data.length) {
    return <EmptyState icon="📉" title="No data yet" description="The chart will render once data is available." />
  }

  const width = 680
  const pad = { top: 14, right: 14, bottom: 28, left: 48 }
  const plotWidth = width - pad.left - pad.right
  const plotHeight = height - pad.top - pad.bottom
  const max = Math.max(...data.map((point) => point.value), 1)
  const stepX = data.length > 1 ? plotWidth / (data.length - 1) : 0
  const baseline = pad.top + plotHeight

  const points = data.map((point, index) => [
    pad.left + (data.length > 1 ? index * stepX : plotWidth / 2),
    baseline - (point.value / max) * plotHeight,
  ])
  const line = points.map((point) => point.map((n) => n.toFixed(1)).join(',')).join(' ')
  const area = `${points[0][0].toFixed(1)},${baseline} ${line} ${points[points.length - 1][0].toFixed(1)},${baseline}`
  const labelEvery = Math.max(1, Math.ceil(data.length / 8))
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((fraction) => ({
    y: baseline - fraction * plotHeight,
    label: formatValue(Math.round(max * fraction)),
  }))

  return (
    <svg className="chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Line chart">
      {ticks.map((tick) => (
        <g key={tick.y}>
          <line x1={pad.left} x2={width - pad.right} y1={tick.y} y2={tick.y} stroke="var(--color-border)" strokeDasharray="4 4" />
          <text x={pad.left - 8} y={tick.y + 4} textAnchor="end" className="chart__tick">
            {tick.label}
          </text>
        </g>
      ))}
      <polygon points={area} fill={color} opacity="0.12" />
      <polyline points={line} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {points.map((point, index) => (
        <circle key={index} cx={point[0]} cy={point[1]} r="3.5" fill="var(--color-surface)" stroke={color} strokeWidth="2" />
      ))}
      {data.map((point, index) =>
        index % labelEvery === 0 ? (
          <text key={point.label} x={points[index][0]} y={height - 8} textAnchor="middle" className="chart__tick">
            {point.label}
          </text>
        ) : null,
      )}
    </svg>
  )
}

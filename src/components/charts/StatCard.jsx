import { cn } from '../../utils/helpers'

export default function StatCard({
  label,
  value,
  delta,
  deltaDirection = 'up',
  icon,
  hint,
  active = false,
  onClick,
  className,
}) {
  return (
    <div
      className={cn(
        'card stat-card',
        onClick && 'cursor-pointer transition-all hover:shadow-md select-none',
        active && 'ring-2 ring-primary ring-offset-1 border-primary',
        className,
      )}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                onClick(event)
              }
            }
          : undefined
      }
    >
      {icon ? (
        <div className="stat-card__icon" aria-hidden>
          {icon}
        </div>
      ) : null}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p className="stat-card__label">{label}</p>
        <p className="stat-card__value">{value}</p>
        {delta ? (
          <p className={cn('stat-card__delta', deltaDirection === 'up' ? 'is-up' : 'is-down')}>
            {deltaDirection === 'up' ? '▲' : '▼'} {delta}
            {hint ? <span className="stat-card__hint"> {hint}</span> : null}
          </p>
        ) : hint ? (
          <p className="stat-card__hint text-xs mt-0.5" title={typeof hint === 'string' ? hint : undefined}>
            {hint}
          </p>
        ) : null}
      </div>
    </div>
  )
}


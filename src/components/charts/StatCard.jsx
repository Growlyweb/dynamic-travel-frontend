import { cn } from '../../utils/helpers'

export default function StatCard({ label, value, delta, deltaDirection = 'up', icon, hint }) {
  return (
    <div className="card stat-card">
      {icon ? (
        <div className="stat-card__icon" aria-hidden>
          {icon}
        </div>
      ) : null}
      <div>
        <p className="stat-card__label">{label}</p>
        <p className="stat-card__value">{value}</p>
        {delta ? (
          <p className={cn('stat-card__delta', deltaDirection === 'up' ? 'is-up' : 'is-down')}>
            {deltaDirection === 'up' ? '▲' : '▼'} {delta}
            {hint ? <span className="stat-card__hint"> {hint}</span> : null}
          </p>
        ) : null}
      </div>
    </div>
  )
}

import { formatRelativeTime } from '../../../utils/formatters'
import EmptyState from '../../../components/common/EmptyState'

export default function RecentActivities({ items = [] }) {
  return (
    <div className="card">
      <p className="card__title">Recent activity</p>
      {items.length === 0 ? (
        <EmptyState icon="🕒" title="No activity yet" />
      ) : (
        <ul className="stack stack--sm" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
          {items.map((activity) => (
            <li key={activity.id} className="row" style={{ alignItems: 'flex-start' }}>
              <span aria-hidden>•</span>
              <div>
                <p>
                  <span className="strong">{activity.actor}</span> {activity.action}
                </p>
                <p className="muted small">{formatRelativeTime(activity.at)}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

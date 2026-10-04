import Badge from '../../../components/common/Badge'
import { formatRelativeTime, titleCase } from '../../../utils/formatters'

const TYPE_ICONS = { visa: '🛂', tour: '🧳', b2b: '🤝', system: '⚙️' }
const TYPE_TONES = { visa: 'info', tour: 'primary', b2b: 'warning', system: 'neutral' }

export default function NotificationItem({ notification, onMarkRead }) {
  return (
    <button
      type="button"
      className={`notification-item${notification.read ? '' : ' is-unread'}`}
      onClick={() => onMarkRead?.(notification)}
    >
      <span className="notification-item__icon" aria-hidden>
        {TYPE_ICONS[notification.type] ?? '🔔'}
      </span>
      <div className="flex-1">
        <p className="notification-item__title">
          {notification.title}
          <Badge tone={TYPE_TONES[notification.type] ?? 'neutral'}>{titleCase(notification.type)}</Badge>
          {!notification.read ? <span className="notification-item__dot" aria-label="Unread" /> : null}
        </p>
        <p className="notification-item__body">{notification.body}</p>
        <p className="notification-item__time">{formatRelativeTime(notification.createdAt)}</p>
      </div>
    </button>
  )
}

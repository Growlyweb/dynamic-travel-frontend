import PageHeader from '../../../components/layout/PageHeader'
import Button from '../../../components/common/Button'
import EmptyState from '../../../components/common/EmptyState'
import NotificationItem from '../components/NotificationItem'
import { useNotifications } from '../../../context/NotificationContext'

export default function Notifications() {
  const { notifications, unreadCount, markAsRead, markAllRead } = useNotifications()

  return (
    <div className="stack">
      <PageHeader
        title="Notifications"
        description="Everything that needs your attention."
        breadcrumbs={[{ label: 'Notifications' }]}
        actions={
          unreadCount > 0 ? (
            <Button variant="ghost" onClick={() => markAllRead()}>
              Mark all read
            </Button>
          ) : null
        }
      />

      <div className="card" style={{ padding: 0 }}>
        {notifications.length === 0 ? (
          <EmptyState
            icon="🔔"
            title="No notifications"
            description="You are all caught up. New events will show up here."
          />
        ) : (
          notifications.map((notification) => (
            <NotificationItem key={notification.id} notification={notification} onMarkRead={(item) => markAsRead(item.id)} />
          ))
        )}
      </div>
    </div>
  )
}

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { notificationsApi } from '../features/notifications/notifications.api'

const NotificationContext = createContext(null)

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([])

  useEffect(() => {
    let active = true
    notificationsApi
      .list()
      .then((result) => {
        if (active) setNotifications(result.items ?? [])
      })
      .catch(() => {
        // Notifications are non-critical; ignore load failures.
      })
    return () => {
      active = false
    }
  }, [])

  const push = useCallback((notification) => {
    setNotifications((list) => [
      {
        id: crypto.randomUUID(),
        type: 'system',
        read: false,
        createdAt: new Date().toISOString(),
        ...notification,
      },
      ...list,
    ])
  }, [])

  const markAsRead = useCallback(async (id) => {
    setNotifications((list) => list.map((item) => (item.id === id ? { ...item, read: true } : item)))
    await notificationsApi.markAsRead(id).catch(() => {})
  }, [])

  const markAllRead = useCallback(async () => {
    setNotifications((list) => list.map((item) => ({ ...item, read: true })))
    await notificationsApi.markAllRead().catch(() => {})
  }, [])

  const value = useMemo(() => {
    const unreadCount = notifications.filter((item) => !item.read).length
    return { notifications, unreadCount, push, markAsRead, markAllRead }
  }, [notifications, push, markAsRead, markAllRead])

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>
}

export function useNotifications() {
  const context = useContext(NotificationContext)
  if (!context) throw new Error('useNotifications must be used within a NotificationProvider')
  return context
}

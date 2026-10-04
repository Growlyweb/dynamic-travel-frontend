import { useMemo } from 'react'
import { useAuth } from './useAuth'
import { hasAnyPermission, hasPermission } from '../utils/permissions'

export function usePermission() {
  const { user } = useAuth()

  return useMemo(
    () => ({
      role: user?.role ?? null,
      can: (permission) => hasPermission(user, permission),
      canAny: (permissions) => hasAnyPermission(user, permissions),
    }),
    [user],
  )
}

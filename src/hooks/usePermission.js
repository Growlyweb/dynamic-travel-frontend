import { useCallback, useMemo } from 'react'
import { useAuth } from './useAuth'
import { hasAnyPermission, hasPermission } from '../utils/permissions'

export function usePermission() {
  const { user } = useAuth()

  const can = useCallback((permission) => hasPermission(user, permission), [user])
  const canAny = useCallback((permissions) => hasAnyPermission(user, permissions), [user])

  return useMemo(
    () => ({
      role: user?.role ?? null,
      roles: user?.roles ?? [],
      isAdmin: Boolean(user?.isAdmin),
      isStaff: Boolean(user) && !user.isAdmin,
      permissions: user?.permissions ?? [],
      can,
      canAny,
    }),
    [user, can, canAny],
  )
}

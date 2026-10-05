import { useState, useEffect, useMemo, useCallback } from 'react'
import { useAuth } from './useAuth'
import { hasAnyPermission, hasPermission, getStaffPermissions } from '../utils/permissions'

export function usePermission() {
  const { user } = useAuth()
  const [staffPerms, setStaffPerms] = useState(() => getStaffPermissions())

  useEffect(() => {
    const handleUpdate = () => {
      setStaffPerms(getStaffPermissions())
    }

    window.addEventListener('staff-permissions-updated', handleUpdate)
    window.addEventListener('storage', handleUpdate)

    return () => {
      window.removeEventListener('staff-permissions-updated', handleUpdate)
      window.removeEventListener('storage', handleUpdate)
    }
  }, [])

  const can = useCallback(
    (permission) => hasPermission(user, permission),
    [user, staffPerms],
  )

  const canAny = useCallback(
    (permissions) => hasAnyPermission(user, permissions),
    [user, staffPerms],
  )

  return useMemo(
    () => ({
      role: user?.role ?? null,
      isAdmin: user?.role === 'admin',
      isStaff: user?.role !== 'admin',
      can,
      canAny,
      staffPerms,
    }),
    [user, can, canAny, staffPerms],
  )
}

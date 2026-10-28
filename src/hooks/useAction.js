import { useCallback } from 'react'
import { useToast } from '../context/ToastContext'
import { errorMessage } from '../utils/errors'

/**
 * Runs something the person asked for (save, delete, send) and tells them how it went.
 *
 *   const run = useAction()
 *   const { ok } = await run(() => visaApi.removeVisaType(id), { success: 'Visa type deleted.' })
 *
 * A failure becomes a message in the corner, never an uncaught error.
 */
export function useAction() {
  const toast = useToast()
  return useCallback(
    async (action, { success } = {}) => {
      try {
        const value = await action()
        if (success) toast.success(success)
        return { ok: true, value }
      } catch (error) {
        toast.error(errorMessage(error))
        return { ok: false, error }
      }
    },
    [toast],
  )
}

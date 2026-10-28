import { createContext, useCallback, useContext, useMemo, useState } from 'react'

const ToastContext = createContext(null)
let nextId = 1

// Short messages in the corner for what just happened: saved, failed, nothing to do.
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const dismiss = useCallback((id) => setToasts((list) => list.filter((toast) => toast.id !== id)), [])

  const show = useCallback(
    (tone, message) => {
      const id = nextId++
      setToasts((list) => [...list, { id, tone, message }])
      setTimeout(() => dismiss(id), tone === 'error' ? 7000 : 4000)
    },
    [dismiss],
  )

  const toast = useMemo(
    () => ({ success: (message) => show('success', message), error: (message) => show('error', message), info: (message) => show('info', message) }),
    [show],
  )

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="toast-stack" role="status" aria-live="polite">
        {toasts.map((item) => (
          <div key={item.id} className={`toast toast--${item.tone}`}>
            <span>{item.message}</span>
            <button type="button" onClick={() => dismiss(item.id)} aria-label="Dismiss">
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) throw new Error('useToast must be used within a ToastProvider')
  return context
}

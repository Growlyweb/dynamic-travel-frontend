import { SidebarProvider } from '@/components/ui/sidebar'
import { AuthProvider } from '../context/AuthContext'
import { NotificationProvider } from '../context/NotificationContext'
import { CurrencyProvider } from '../context/CurrencyContext'
import { ToastProvider } from '../context/ToastContext'

export default function Providers({ children }) {
  return (
    <AuthProvider>
      <CurrencyProvider>
        <SidebarProvider>
          <NotificationProvider>
            <ToastProvider>
              <main className='w-full'>
                {children}
              </main>
            </ToastProvider>
          </NotificationProvider>
        </SidebarProvider>
      </CurrencyProvider>
    </AuthProvider>
  )
}

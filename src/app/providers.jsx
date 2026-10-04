import { SidebarProvider } from '@/components/ui/sidebar'
import { AuthProvider } from '../context/AuthContext'
import { NotificationProvider } from '../context/NotificationContext'
import { CurrencyProvider } from '../context/CurrencyContext'

export default function Providers({ children }) {
  return (
    <AuthProvider>
      <CurrencyProvider>
        <SidebarProvider>
          <NotificationProvider>
            <main className='w-full'>
              {children}
            </main>
          </NotificationProvider>
        </SidebarProvider>
      </CurrencyProvider>
    </AuthProvider>
  )
}

import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { AuthProvider } from '../context/AuthContext'
import { NotificationProvider } from '../context/NotificationContext'

export default function Providers({ children }) {
  return (
    <AuthProvider>
      <SidebarProvider>
        <NotificationProvider>
          <main className='w-full'>
            {children}
          </main>
        </NotificationProvider>
      </SidebarProvider>
    </AuthProvider>
  )
}

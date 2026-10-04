import { Suspense, useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'
import MobileSidebar from './MobileSidebar'
import AppSidebar from './AppSidebar'
import { SidebarInset } from '../ui/sidebar'
import AppHeader from './AppHeader'

export default function DashboardLayout() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()

  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname])

  return (
    <div className="flex h-full w-full min-w-0">
      <Suspense>
      <AppSidebar />
      </Suspense>
      <SidebarInset className='flex flex-1 flex-col'>
        {/* <MobileSidebar open={mobileOpen} onClose={() => setMobileOpen(false)} /> */}
          <AppHeader onMenuClick={() => setMobileOpen(true)} />
          <main className='mx-auto size-full max-w-360 flex-1 px-4 py-6 sm:px-6'>
            <Outlet />
          </main>
      </SidebarInset>
    </div>
  )
}

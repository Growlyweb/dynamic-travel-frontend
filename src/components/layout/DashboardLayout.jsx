import { Suspense } from 'react'
import { Outlet } from 'react-router-dom'
import AppSidebar from './AppSidebar'
import { SidebarInset } from '../ui/sidebar'
import AppHeader from './AppHeader'

export default function DashboardLayout() {
  return (
    <div className="flex h-full w-full min-w-0">
      <Suspense>
        <AppSidebar />
      </Suspense>
      <SidebarInset className='flex min-w-0 flex-1 flex-col'>
        <AppHeader />
        <main className='mx-auto size-full w-full min-w-0 max-w-360 flex-1 px-4 py-6 sm:px-6'>
          <Outlet />
        </main>
      </SidebarInset>
    </div>
  )
}

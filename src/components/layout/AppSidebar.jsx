// src/components/layout/Sidebar.jsx
import { Link, NavLink, useMatch, useNavigate } from 'react-router-dom'
import { Compass, LogOut } from 'lucide-react'

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from '@/components/ui/sidebar'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

import { usePermission } from '@/hooks/usePermission'
import { useAuth } from '@/hooks/useAuth'
import { APP_ROUTES, NAV_SECTIONS } from '@/utils/constants'
import { ROLE_LABELS } from '@/utils/roles'
import { initials } from '@/utils/formatters'

function NavItem({ item }) {
  const { setOpenMobile } = useSidebar()
  const match = useMatch({ path: item.to, end: item.end ?? false })
  const Icon = item.icon

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        tooltip={item.label}
        isActive={!!match}
        className="data-active:bg-primary! data-active:text-background!"
        render={<NavLink to={item.to} end={item.end} />}
        onClick={() => setOpenMobile(false)}
      >
        {Icon && <Icon />}
        <span className="min-w-0 flex-1 truncate">{item.label}</span>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}

export default function AppSidebar() {
  const { can } = usePermission()
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    await logout()
    navigate(APP_ROUTES.LOGIN, { replace: true })
  }

  return (
    <Sidebar collapsible="icon" variant="sidebar">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              className="gap-2.5 bg-transparent!"
              render={<Link to={APP_ROUTES.DASHBOARD} />}
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-transparent">
                <img src="/favicon_io/favicon-32x32.png" alt="ABL Travel Logo" className="size-7 object-contain" />
              </div>
              <div className="flex flex-col items-start leading-tight">
                <span className="text-base font-bold text-nowrap tracking-tight">ABL Travel</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent className="group-data-[collapsible=icon]:overflow-y-auto">
        {NAV_SECTIONS.map((section) => {
          const items = section.items.filter((item) => !item.permission || can(item.permission))
          if (!items.length) return null

          return (
            <SidebarGroup key={section.label}>
              <SidebarGroupLabel className="tracking-wider text-sidebar-foreground/50 uppercase">
                {section.label}
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {items.map((item) => (
                    <NavItem key={item.to} item={item} />
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          )
        })}
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" className="group pr-2">
              <Avatar className="size-8 rounded-lg">
                <AvatarFallback className="rounded-lg text-xs">{initials(user?.name)}</AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left leading-tight min-w-0">
                <span className="truncate text-sm font-medium">{user?.name ?? 'Signed out'}</span>
                <span className="truncate text-xs text-muted-foreground">
                  {ROLE_LABELS[user?.role] ?? user?.role ?? '—'}
                </span>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                aria-label="Log out"
                title="Log out"
                className="ml-auto flex-shrink-0 rounded-md p-1.5 text-muted-foreground opacity-0 transition-opacity hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
              >
                <LogOut className="size-4" />
              </button>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
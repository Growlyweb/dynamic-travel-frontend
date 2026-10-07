import { useState, useEffect } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import {
  Building2,
  ChevronDown,
  ChevronsUpDown,
  Circle,
  CircleUser,
  CreditCard,
  Handshake,
  LayoutDashboard,
  LogOut,
  Luggage,
  Settings,
  ShieldCheck,
  Stamp,
  UserCog,
  UserRound,
} from 'lucide-react'

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
  useSidebar,
} from '@/components/ui/sidebar'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

import { usePermission } from '@/hooks/usePermission'
import { useAuth } from '@/hooks/useAuth'
import { APP_ROUTES, NAV_SECTIONS } from '@/utils/constants'
import { ROLE_LABELS } from '@/utils/roles'
import { initials } from '@/utils/formatters'
import { cn } from '@/utils/helpers'

const SECTION_ICONS = {
  Overview: LayoutDashboard,
  Vendors: Building2,
  Visa: Stamp,
  Tours: Luggage,
  'Partners · B2B': Handshake,
  'Customers · B2C': UserRound,
  Membership: CreditCard,
  Administration: UserCog,
}

function CollapsibleNavSection({ section, can, onNavigate }) {
  const { setOpenMobile, state, setOpen } = useSidebar()
  const location = useLocation()
  const pathname = location.pathname

  const items = section.items.filter((item) => !item.permission || can(item.permission))

  const isItemActive = (item) => {
    return item.end ? pathname === item.to : pathname.startsWith(item.to)
  }

  const hasActiveItem = items.some(isItemActive)

  const [isOpen, setIsOpen] = useState(hasActiveItem || section.label === 'Overview')

  useEffect(() => {
    if (hasActiveItem) {
      setIsOpen(true)
    }
  }, [hasActiveItem])

  if (!items.length) return null

  const SectionIcon = SECTION_ICONS[section.label] || items[0]?.icon || Circle

  const handleHeaderClick = () => {
    // If sidebar is collapsed into icons and user clicks a section header,
    // expand sidebar and open the section for smooth UX
    if (state === 'collapsed') {
      setOpen(true)
      setIsOpen(true)
      return
    }
    setIsOpen((prev) => !prev)
  }

  return (
    <SidebarMenuItem className="list-none">
      {/* Collapsible Section Header Button */}
      <SidebarMenuButton
        size="lg"
        tooltip={section.label}
        onClick={handleHeaderClick}
        className={cn(
          'w-full justify-between h-11 px-3 text-[14.5px] font-semibold cursor-pointer rounded-lg transition-colors',
          'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
          'group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:size-9! group-data-[collapsible=icon]:p-0!',
          hasActiveItem && 'text-sidebar-foreground font-bold'
        )}
      >
        <div className="flex items-center gap-3 min-w-0 group-data-[collapsible=icon]:gap-0 group-data-[collapsible=icon]:justify-center">
          {SectionIcon && (
            <SectionIcon
              className={cn(
                'size-5 shrink-0 transition-colors',
                hasActiveItem ? 'text-primary' : 'text-sidebar-foreground/70'
              )}
            />
          )}
          <span className="truncate group-data-[collapsible=icon]:hidden">{section.label}</span>
        </div>
        <ChevronDown
          className={cn(
            'size-4.5 shrink-0 text-muted-foreground transition-transform duration-200 group-data-[collapsible=icon]:hidden',
            isOpen && 'rotate-180'
          )}
        />
      </SidebarMenuButton>

      {/* Sub-items under collapsible button */}
      {isOpen && (
        <SidebarMenuSub className="ml-3.5 pl-3 border-l border-sidebar-border/60 my-1 flex flex-col gap-1 group-data-[collapsible=icon]:hidden">
          {items.map((item) => {
            const isActive = isItemActive(item)
            const Icon = item.icon
            return (
              <SidebarMenuSubItem key={item.to}>
                <SidebarMenuSubButton
                  isActive={isActive}
                  className={cn(
                    'h-10 px-3 text-[14px] font-medium rounded-md gap-3 transition-colors',
                    isActive
                      ? 'bg-primary! text-primary-foreground! font-semibold shadow-xs [&>svg]:text-primary-foreground!'
                      : 'text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground [&>svg]:text-muted-foreground hover:[&>svg]:text-sidebar-accent-foreground'
                  )}
                  render={<NavLink to={item.to} end={item.end} />}
                  onClick={() => {
                    setOpenMobile(false)
                    onNavigate?.()
                  }}
                >
                  {Icon && (
                    <Icon
                      className={cn(
                        'size-4.5 shrink-0 transition-colors',
                        isActive ? 'text-primary-foreground!' : 'text-current'
                      )}
                    />
                  )}
                  <span className="truncate">{item.label}</span>
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
            )
          })}
        </SidebarMenuSub>
      )}
    </SidebarMenuItem>
  )
}

export default function AppSidebar({ onNavigate }) {
  const { can } = usePermission()
  const { user, logout } = useAuth()
  const { isMobile, setOpenMobile } = useSidebar()
  const navigate = useNavigate()
  const location = useLocation()
  const pathname = location.pathname

  async function handleLogout() {
    await logout()
    navigate(APP_ROUTES.LOGIN, { replace: true })
  }

  // Filter out the 'Account' section from the main sidebar items
  const mainNavSections = NAV_SECTIONS.filter((section) => section.label !== 'Account')

  // Check if current route is an account/settings route
  const isProfileActive = pathname === APP_ROUTES.SETTINGS_PROFILE
  const isSettingsActive = pathname === APP_ROUTES.SETTINGS_GENERAL
  const isSecurityActive = pathname === APP_ROUTES.SETTINGS_SECURITY
  const isAccountActive = isProfileActive || isSettingsActive || isSecurityActive

  return (
    <Sidebar collapsible="icon" variant="sidebar">
      {/* Brand Header */}
      <SidebarHeader className="p-2 border-b border-sidebar-border/40">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              className="gap-2.5 bg-transparent! group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:size-9! group-data-[collapsible=icon]:p-0! hover:bg-sidebar-accent/50 cursor-pointer transition-colors"
              render={<Link to={APP_ROUTES.DASHBOARD} />}
              tooltip="ABL Travel"
              onClick={() => {
                setOpenMobile(false)
                onNavigate?.()
              }}
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-transparent shrink-0">
                <img
                  src="/favicon_io/favicon-32x32.png"
                  alt="ABL Travel Logo"
                  className="size-7 object-contain"
                />
              </div>
              <div className="flex flex-col items-start leading-tight min-w-0 group-data-[collapsible=icon]:hidden">
                <span className="text-[15px] font-bold text-nowrap tracking-tight text-sidebar-foreground">
                  ABL Travel
                </span>
                <span className="text-[11px] text-muted-foreground font-medium">
                  Management Portal
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      {/* Nav Content with Collapsible Sections (Account moved to profile bottom) */}
      <SidebarContent className="group-data-[collapsible=icon]:overflow-y-auto p-2">
        <SidebarMenu className="gap-1.5">
          {mainNavSections.map((section) => (
            <CollapsibleNavSection
              key={section.label}
              section={section}
              can={can}
              onNavigate={onNavigate}
            />
          ))}
        </SidebarMenu>
      </SidebarContent>

      {/* Footer Profile with Account Dropdown Menu */}
      <SidebarFooter className="p-2 border-t border-sidebar-border/60">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <SidebarMenuButton
                    size="lg"
                    className={cn(
                      'w-full h-12 px-2.5 rounded-xl cursor-pointer transition-colors',
                      'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                      'data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground',
                      'group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:size-9! group-data-[collapsible=icon]:p-0!',
                      isAccountActive && 'bg-sidebar-accent/70 font-semibold'
                    )}
                  />
                }
              >
                <div className="flex items-center gap-3 w-full min-w-0 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-0">
                  <Avatar className="size-8.5 rounded-lg shrink-0 border border-sidebar-border/50">
                    <AvatarFallback className="rounded-lg text-xs font-bold bg-primary text-primary-foreground">
                      {initials(user?.name ?? 'ABL')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left leading-tight min-w-0 group-data-[collapsible=icon]:hidden">
                    <span className="truncate text-[13.5px] font-semibold text-sidebar-foreground">
                      {user?.name ?? 'Signed out'}
                    </span>
                    <span className="truncate text-[11.5px] text-muted-foreground">
                      {ROLE_LABELS[user?.role] ?? user?.role ?? '—'}
                    </span>
                  </div>
                  <ChevronsUpDown className="ml-auto size-4 shrink-0 text-muted-foreground group-data-[collapsible=icon]:hidden" />
                </div>
              </DropdownMenuTrigger>

              <DropdownMenuContent
                className="w-60 rounded-xl p-1.5 shadow-xl border border-sidebar-border/80 bg-popover text-popover-foreground"
                side={isMobile ? 'bottom' : 'top'}
                align="end"
              // sideOffset={10}
              >
                <DropdownMenuGroup>
                  <DropdownMenuLabel className="p-2 font-normal">
                    <div className="flex items-center gap-3">
                      <Avatar className="size-9 rounded-lg shrink-0 border border-border/40">
                        <AvatarFallback className="rounded-lg text-xs font-bold bg-primary text-primary-foreground">
                          {initials(user?.name ?? 'ABL')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="grid flex-1 text-left leading-tight min-w-0">
                        <span className="truncate text-sm font-semibold text-foreground">
                          {user?.name ?? 'Signed out'}
                        </span>
                        <span className="truncate text-xs font-medium text-primary">
                          {ROLE_LABELS[user?.role] ?? user?.role ?? '—'}
                        </span>
                        <span className="truncate text-[11px] text-muted-foreground">
                          {user?.email ?? 'ABL Travel Portal'}
                        </span>
                      </div>
                    </div>
                  </DropdownMenuLabel></DropdownMenuGroup>
                <DropdownMenuSeparator />

                <DropdownMenuGroup>
                  <DropdownMenuItem
                    render={<Link to={APP_ROUTES.SETTINGS_PROFILE} />}
                    className={cn(
                      'gap-2.5 px-2.5 py-2 cursor-pointer rounded-lg text-sm transition-colors',
                      isProfileActive &&
                      'bg-primary! text-primary-foreground! font-medium shadow-xs [&_svg]:text-primary-foreground!'
                    )}
                    onClick={() => {
                      setOpenMobile(false)
                      onNavigate?.()
                    }}
                  >
                    <CircleUser className="size-4 shrink-0" />
                    <span>Profile</span>
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    render={<Link to={APP_ROUTES.SETTINGS_GENERAL} />}
                    className={cn(
                      'gap-2.5 px-2.5 py-2 cursor-pointer rounded-lg text-sm transition-colors',
                      isSettingsActive &&
                      'bg-primary! text-primary-foreground! font-medium shadow-xs [&_svg]:text-primary-foreground!'
                    )}
                    onClick={() => {
                      setOpenMobile(false)
                      onNavigate?.()
                    }}
                  >
                    <Settings className="size-4 shrink-0" />
                    <span>Settings</span>
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    render={<Link to={APP_ROUTES.SETTINGS_SECURITY} />}
                    className={cn(
                      'gap-2.5 px-2.5 py-2 cursor-pointer rounded-lg text-sm transition-colors',
                      isSecurityActive &&
                      'bg-primary! text-primary-foreground! font-medium shadow-xs [&_svg]:text-primary-foreground!'
                    )}
                    onClick={() => {
                      setOpenMobile(false)
                      onNavigate?.()
                    }}
                  >
                    <ShieldCheck className="size-4 shrink-0" />
                    <span>Security</span>
                  </DropdownMenuItem>
                </DropdownMenuGroup>

                <DropdownMenuSeparator />

                <DropdownMenuItem
                  onClick={handleLogout}
                  className="gap-2.5 px-2.5 py-2 cursor-pointer rounded-lg text-sm text-destructive focus:bg-destructive/10 focus:text-destructive dark:focus:bg-destructive/20"
                  variant="destructive"
                >
                  <LogOut className="size-4 shrink-0" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
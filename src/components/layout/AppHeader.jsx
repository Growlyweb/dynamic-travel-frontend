// src/components/layout/Header.jsx
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Bell, ChevronsUpDown, LogOut, Search, Settings, ShieldCheck, User } from 'lucide-react'

import { SidebarTrigger } from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

import { useAuth } from '@/hooks/useAuth'
import { useNotifications } from '@/context/NotificationContext'
import { useCurrency } from '@/context/CurrencyContext'
import { APP_ROUTES } from '@/utils/constants'
import { ROLE_LABELS } from '@/utils/roles'
import { formatRelativeTime, initials, titleCase } from '@/utils/formatters'

const NOTIFICATION_ICONS = {
  visa: '🛂',
  tour: '🧳',
  b2b: '🤝',
  system: '⚙️',
}

export default function AppHeader() {
  const { user, logout } = useAuth()
  const { notifications, unreadCount, markAllRead } = useNotifications()
  const { currency, setCurrency, SUPPORTED_CURRENCIES } = useCurrency()
  const [notifOpen, setNotifOpen] = useState(false)
  const navigate = useNavigate()

  async function handleLogout() {
    await logout()
    navigate(APP_ROUTES.LOGIN, { replace: true })
  }

  const visibleNotifications = notifications.slice(0, 4)
  const roleLabel = ROLE_LABELS[user?.role] ?? titleCase(user?.role)
  const selectedCurrency = SUPPORTED_CURRENCIES.find((c) => c.code === currency)

  return (
    <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 border-b bg-background px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 h-4" />

      {/* Search */}
      <div className="relative w-full max-w-md">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search applications, tours, partners…"
          aria-label="Search"
          className="pl-8"
        />
      </div>

      <div className="ml-auto flex items-center gap-2">
        {/* User Profile Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-10 gap-2 px-2">
              <Avatar className="size-8">
                <AvatarFallback className="bg-primary text-white font-bold">{initials(user?.name ?? 'ABL Travel')}</AvatarFallback>
              </Avatar>
              <div className="hidden text-left text-sm leading-tight md:grid">
                <span className="font-semibold text-foreground">{user?.name ?? 'Admin'}</span>
                <span className="text-xs font-medium text-primary">{roleLabel}</span>
              </div>
              <ChevronsUpDown className="hidden size-4 text-muted-foreground md:block" />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="font-normal">
              <p className="text-sm font-semibold">{user?.name ?? 'Admin'}</p>
              <p className="text-xs font-medium text-primary">
                {roleLabel} · ABL Travel
              </p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />

            <DropdownMenuItem asChild>
              <Link to={APP_ROUTES.SETTINGS_PROFILE}>
                <User /> Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to={APP_ROUTES.SETTINGS_GENERAL}>
                <Settings /> Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to={APP_ROUTES.SETTINGS_SECURITY}>
                <ShieldCheck /> Security
              </Link>
            </DropdownMenuItem>

            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={handleLogout} variant="destructive">
              <LogOut /> Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
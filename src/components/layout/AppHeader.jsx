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
  const [notifOpen, setNotifOpen] = useState(false)
  const navigate = useNavigate()

  async function handleLogout() {
    await logout()
    navigate(APP_ROUTES.LOGIN, { replace: true })
  }

  const visibleNotifications = notifications.slice(0, 4)
  const roleLabel = ROLE_LABELS[user?.role] ?? titleCase(user?.role)

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
        {/* Notifications */}
        <Popover open={notifOpen} onOpenChange={setNotifOpen}>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
              <Bell className="size-5" />
              {unreadCount > 0 && (
                <Badge className="absolute -right-1 -top-1 h-4 min-w-4 justify-center rounded-full px-1 text-[10px]">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>

          <PopoverContent align="end" className="w-80 p-0">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <span className="text-sm font-semibold">Notifications</span>
              {unreadCount > 0 && (
                <Button variant="link" size="sm" className="h-auto p-0" onClick={() => markAllRead()}>
                  Mark all read
                </Button>
              )}
            </div>

            <ScrollArea className="max-h-80">
              {visibleNotifications.length === 0 ? (
                <p className="px-4 py-6 text-center text-sm text-muted-foreground">
                  No notifications yet.
                </p>
              ) : (
                <ul className="divide-y">
                  {visibleNotifications.map((n) => (
                    <li key={n.id} className="flex gap-3 px-4 py-3">
                      <span aria-hidden className="mt-0.5">
                        {NOTIFICATION_ICONS[n.type] ?? '🔔'}
                      </span>
                      <div className="min-w-0 space-y-0.5">
                        <p className="text-sm font-medium leading-snug">{n.title}</p>
                        <p className="text-xs text-muted-foreground">{n.body}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatRelativeTime(n.createdAt)}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </ScrollArea>

            <div className="border-t p-2 text-center">
              <Button asChild variant="ghost" size="sm" className="w-full">
                <Link to={APP_ROUTES.NOTIFICATIONS} onClick={() => setNotifOpen(false)}>
                  View all notifications
                </Link>
              </Button>
            </div>
          </PopoverContent>
        </Popover>

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-10 gap-2 px-2">
              <Avatar className="size-8">
                <AvatarFallback>{initials(user?.name)}</AvatarFallback>
              </Avatar>
              <div className="hidden text-left text-sm leading-tight md:grid">
                <span className="font-medium">{user?.name}</span>
                <span className="text-xs text-muted-foreground">{roleLabel}</span>
              </div>
              <ChevronsUpDown className="hidden size-4 text-muted-foreground md:block" />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="font-normal">
              <p className="text-sm font-medium">{user?.name}</p>
              <p className="text-xs text-muted-foreground">{roleLabel}</p>
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
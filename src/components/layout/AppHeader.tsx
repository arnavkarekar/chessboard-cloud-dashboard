import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Bell, CheckCheck, Menu, Settings, Swords, Trash2, UserRound } from 'lucide-react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { Button } from '@/components/ui/button'
import { Dialog, SheetContent } from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { UserAvatar } from '@/components/common/UserAvatar'
import { useAccount } from '@/context/AccountContext'
import { useGameSession } from '@/context/GameSessionContext'
import { cn, formatRelative } from '@/lib/utils'
import { Brand, SidebarFooter, SidebarNav } from './AppSidebar'
import { ThemeToggle } from './ThemeToggle'
import { titleForPath } from './nav'

function Notifications() {
  const { notifications, markAllRead, markRead, clearNotifications } = useAccount()
  const unread = notifications.filter((n) => !n.read).length
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={`Notifications (${unread} unread)`} className="relative">
          <Bell />
          {unread > 0 && (
            <span className="absolute right-1.5 top-1.5 flex min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-white">
              {unread}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b px-3 py-2">
          <span className="text-sm font-semibold">Notifications</span>
          <span className="text-[11px] text-muted-foreground">Mock data</span>
        </div>
        <div className="scrollbar-thin max-h-80 overflow-y-auto p-1">
          {notifications.length === 0 ? (
            <p className="px-3 py-8 text-center text-sm text-muted-foreground">You're all caught up.</p>
          ) : (
            notifications.map((n) => (
              <DropdownMenuItem
                key={n.id}
                onSelect={(e) => {
                  e.preventDefault()
                  markRead(n.id)
                }}
                className="flex-col items-start gap-0.5 py-2"
              >
                <span className="flex w-full items-center gap-2">
                  {!n.read && <span className="size-1.5 rounded-full bg-primary" />}
                  <span className={cn('text-sm', !n.read && 'font-semibold')}>{n.title}</span>
                  <span className="ml-auto text-[11px] text-muted-foreground">{formatRelative(n.createdAt)}</span>
                </span>
                <span className="text-xs text-muted-foreground">{n.body}</span>
              </DropdownMenuItem>
            ))
          )}
        </div>
        {notifications.length > 0 && (
          <div className="flex gap-1 border-t p-1">
            <DropdownMenuItem onSelect={(e) => (e.preventDefault(), markAllRead())} className="flex-1 justify-center" disabled={unread === 0}>
              <CheckCheck /> Mark all read
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={clearNotifications} className="flex-1 justify-center">
              <Trash2 /> Clear
            </DropdownMenuItem>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function AppHeader() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { profile } = useAccount()
  const { modals } = useGameSession()

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-2 border-b bg-background/85 px-4 backdrop-blur-md sm:px-6">
      <Dialog open={mobileOpen} onOpenChange={setMobileOpen}>
        <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open navigation" onClick={() => setMobileOpen(true)}>
          <Menu />
        </Button>
        <SheetContent aria-describedby={undefined}>
          <DialogPrimitive.Title className="sr-only">Navigation</DialogPrimitive.Title>
          <div className="flex h-16 items-center px-5">
            <Brand />
          </div>
          <div className="flex-1 overflow-y-auto px-3 py-2">
            <SidebarNav onNavigate={() => setMobileOpen(false)} />
          </div>
          <div className="p-3">
            <SidebarFooter onNavigate={() => setMobileOpen(false)} />
          </div>
        </SheetContent>
      </Dialog>

      <h1 className="truncate text-base font-semibold tracking-tight sm:text-lg">{titleForPath(pathname)}</h1>

      <div className="ml-auto flex items-center gap-1">
        <Button size="sm" className="mr-1 hidden sm:inline-flex" onClick={() => modals.openCreate()}>
          <Swords /> Play now
        </Button>
        <Notifications />
        <ThemeToggle />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button type="button" className="ml-1 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label="Account menu">
              <UserAvatar player={profile} size="sm" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>
              <span className="block text-sm text-foreground">{profile.displayName}</span>
              <span className="font-normal">@{profile.username} · mock account</span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => navigate('/profile')}>
              <UserRound /> Profile
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => navigate('/settings')}>
              <Settings /> Settings
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}

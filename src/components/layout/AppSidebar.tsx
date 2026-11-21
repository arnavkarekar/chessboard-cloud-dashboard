import { NavLink } from 'react-router-dom'
import { Crown } from 'lucide-react'
import { useDevice } from '@/context/DeviceContext'
import { useGameSession } from '@/context/GameSessionContext'
import { cn } from '@/lib/utils'
import { NAV_ITEMS } from './nav'

export function Brand() {
  return (
    <div className="flex items-center gap-2.5">
      <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
        <Crown className="size-5" />
      </span>
      <div className="leading-tight">
        <p className="text-sm font-semibold tracking-tight">Smart Chessboard</p>
        <p className="text-[11px] text-muted-foreground">Connected dashboard</p>
      </div>
    </div>
  )
}

export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const { session, outcome } = useGameSession()
  const live = !!session && !outcome
  return (
    <nav aria-label="Main" className="flex flex-col gap-0.5">
      {NAV_ITEMS.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to === '/'}
          onClick={onNavigate}
          className={({ isActive }) =>
            cn(
              'group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-accent/70 hover:text-foreground',
              isActive && 'bg-sidebar-accent text-accent-foreground shadow-xs [&_svg]:text-primary',
            )
          }
        >
          <item.icon className="size-4 text-muted-foreground transition-colors group-hover:text-foreground" />
          {item.label}
          {item.to === '/play' && live && (
            <span className="ml-auto flex items-center gap-1 text-[10px] font-semibold text-primary uppercase">
              <span className="size-1.5 animate-pulse rounded-full bg-primary" /> Live
            </span>
          )}
        </NavLink>
      ))}
    </nav>
  )
}

export function SidebarFooter({ onNavigate }: { onNavigate?: () => void }) {
  const { state } = useDevice()
  return (
    <NavLink
      to="/chessboard"
      onClick={onNavigate}
      className="flex items-center gap-3 rounded-lg border bg-card/60 p-3 text-xs transition hover:border-primary/40"
    >
      <span className={cn('size-2 rounded-full', state.online ? 'bg-success' : 'bg-destructive')} />
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{state.info.name}</p>
        <p className="text-muted-foreground">{state.online ? 'Online' : 'Offline'} · simulated</p>
      </div>
    </NavLink>
  )
}

export function AppSidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r bg-sidebar lg:flex">
      <div className="flex h-16 items-center px-5">
        <Brand />
      </div>
      <div className="scrollbar-thin flex-1 overflow-y-auto px-3 py-2">
        <SidebarNav />
      </div>
      <div className="p-3">
        <SidebarFooter />
      </div>
    </aside>
  )
}

import { BarChart3, CircuitBoard, History, LayoutDashboard, Settings, Swords, Trophy, UserRound, type LucideIcon } from 'lucide-react'

export interface NavItem {
  to: string
  label: string
  icon: LucideIcon
}

export const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/play', label: 'Play Chess', icon: Swords },
  { to: '/games', label: 'My Games', icon: History },
  { to: '/analysis', label: 'Analysis', icon: BarChart3 },
  { to: '/leaderboard', label: 'Leaderboard', icon: Trophy },
  { to: '/chessboard', label: 'My Chessboard', icon: CircuitBoard },
  { to: '/profile', label: 'Profile', icon: UserRound },
  { to: '/settings', label: 'Settings', icon: Settings },
]

export function titleForPath(pathname: string) {
  if (pathname.startsWith('/games/')) return 'Game details'
  const match = NAV_ITEMS.find((n) => (n.to === '/' ? pathname === '/' : pathname.startsWith(n.to)))
  return match?.label ?? 'Not found'
}

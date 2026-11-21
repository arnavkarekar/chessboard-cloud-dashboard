import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { GameRecord, GameResult } from '@/types/game'
import type { UserProfile } from '@/types/player'
import { CURRENT_USER } from '@/data/mockPlayers'
import { MOCK_ACTIVITY, MOCK_NOTIFICATIONS } from '@/data/mockDevices'
import { fetchGameHistory } from '@/services/mockApi'
import { uid } from '@/lib/utils'

export interface AccountStats {
  total: number
  wins: number
  losses: number
  draws: number
  winRate: number
  streak: { result: GameResult | null; count: number }
}

export interface NotificationItem {
  id: string
  title: string
  body: string
  createdAt: string
  read: boolean
  kind: 'invite' | 'device' | 'rating' | 'summary' | 'game'
}

export interface ActivityItem {
  id: string
  kind: 'game' | 'device' | 'rating' | 'achievement' | 'profile'
  text: string
  createdAt: string
  link?: string
}

interface AccountContextValue {
  profile: UserProfile
  setProfile: (p: UserProfile) => void
  games: GameRecord[]
  gamesLoading: boolean
  addLocalGame: (g: GameRecord) => void
  getGame: (id: string) => GameRecord | undefined
  stats: AccountStats
  notifications: NotificationItem[]
  pushNotification: (n: Omit<NotificationItem, 'id' | 'createdAt' | 'read'>) => void
  markAllRead: () => void
  markRead: (id: string) => void
  clearNotifications: () => void
  activity: ActivityItem[]
  logActivity: (a: Omit<ActivityItem, 'id' | 'createdAt'>) => void
}

const AccountContext = createContext<AccountContextValue | null>(null)

const ago = (minutes: number) => new Date(Date.now() - minutes * 60_000).toISOString()

export function computeStats(games: GameRecord[]): AccountStats {
  const wins = games.filter((g) => g.result === 'win').length
  const losses = games.filter((g) => g.result === 'loss').length
  const draws = games.filter((g) => g.result === 'draw').length
  const sorted = [...games].sort((a, b) => +new Date(b.date) - +new Date(a.date))
  let count = 0
  const first = sorted[0]?.result ?? null
  for (const g of sorted) {
    if (g.result !== first) break
    count++
  }
  return {
    total: games.length,
    wins,
    losses,
    draws,
    winRate: games.length ? Math.round((wins / games.length) * 100) : 0,
    streak: { result: first, count },
  }
}

export function AccountProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<UserProfile>(CURRENT_USER)
  const [mockGames, setMockGames] = useState<GameRecord[]>([])
  const [localGames, setLocalGames] = useState<GameRecord[]>([])
  const [gamesLoading, setGamesLoading] = useState(true)
  const [notifications, setNotifications] = useState<NotificationItem[]>(() =>
    MOCK_NOTIFICATIONS.map((n, i) => ({ ...n, createdAt: ago(n.minutesAgo), read: i > 1 })),
  )
  const [activity, setActivity] = useState<ActivityItem[]>(() =>
    MOCK_ACTIVITY.map((a) => ({ id: a.id, kind: a.kind, text: a.text, createdAt: ago(a.minutesAgo) })),
  )

  useEffect(() => {
    let cancelled = false
    fetchGameHistory().then((g) => {
      if (cancelled) return
      setMockGames(g)
      setGamesLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [])

  const games = useMemo(
    () => [...localGames, ...mockGames].sort((a, b) => +new Date(b.date) - +new Date(a.date)),
    [localGames, mockGames],
  )
  const stats = useMemo(() => computeStats(games), [games])

  const logActivity = useCallback((a: Omit<ActivityItem, 'id' | 'createdAt'>) => {
    setActivity((list) => [{ ...a, id: uid('act'), createdAt: new Date().toISOString() }, ...list].slice(0, 40))
  }, [])

  const addLocalGame = useCallback((g: GameRecord) => {
    setLocalGames((list) => [g, ...list.filter((x) => x.id !== g.id)])
  }, [])

  const getGame = useCallback((id: string) => games.find((g) => g.id === id), [games])

  const pushNotification = useCallback((n: Omit<NotificationItem, 'id' | 'createdAt' | 'read'>) => {
    setNotifications((list) => [{ ...n, id: uid('ntf'), createdAt: new Date().toISOString(), read: false }, ...list].slice(0, 30))
  }, [])

  const markAllRead = useCallback(() => setNotifications((l) => l.map((n) => ({ ...n, read: true }))), [])
  const markRead = useCallback((id: string) => setNotifications((l) => l.map((n) => (n.id === id ? { ...n, read: true } : n))), [])
  const clearNotifications = useCallback(() => setNotifications([]), [])

  const value = useMemo(
    () => ({
      profile,
      setProfile,
      games,
      gamesLoading,
      addLocalGame,
      getGame,
      stats,
      notifications,
      pushNotification,
      markAllRead,
      markRead,
      clearNotifications,
      activity,
      logActivity,
    }),
    [profile, games, gamesLoading, addLocalGame, getGame, stats, notifications, pushNotification, markAllRead, markRead, clearNotifications, activity, logActivity],
  )

  return <AccountContext.Provider value={value}>{children}</AccountContext.Provider>
}

export function useAccount() {
  const ctx = useContext(AccountContext)
  if (!ctx) throw new Error('useAccount must be used within AccountProvider')
  return ctx
}

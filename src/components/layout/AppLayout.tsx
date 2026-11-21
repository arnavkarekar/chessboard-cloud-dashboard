import { Suspense, useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { LoadingState } from '@/components/common/LoadingState'
import { CreateGameModal } from '@/components/game/CreateGameModal'
import { JoinGameModal } from '@/components/game/JoinGameModal'
import { GameLobby } from '@/components/game/GameLobby'
import { GameResultDialog } from '@/components/game/GameResultDialog'
import { AppHeader } from './AppHeader'
import { AppSidebar } from './AppSidebar'

export function AppLayout() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [pathname])

  return (
    <div className="min-h-dvh">
      <a href="#main" className="sr-only z-50 rounded-md bg-primary px-3 py-2 text-primary-foreground focus:not-sr-only focus:fixed focus:left-3 focus:top-3">
        Skip to content
      </a>
      <AppSidebar />
      <div className="flex min-h-dvh flex-col lg:pl-64">
        <AppHeader />
        <main id="main" className="flex-1">
          <Suspense fallback={<LoadingState label="Loading page…" className="py-24" />}>
            <Outlet />
          </Suspense>
        </main>
        <footer className="border-t px-6 py-4 text-center text-xs text-muted-foreground">
          Frontend demonstration · all players, games, devices, and online play are simulated locally.
        </footer>
      </div>
      <CreateGameModal />
      <JoinGameModal />
      <GameLobby />
      <GameResultDialog />
    </div>
  )
}

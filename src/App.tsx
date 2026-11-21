import { Route, Routes } from 'react-router-dom'
import { Toaster } from 'sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AppLayout } from '@/components/layout/AppLayout'
import { SettingsProvider, useSettings } from '@/context/SettingsContext'
import { AccountProvider } from '@/context/AccountContext'
import { DeviceProvider } from '@/context/DeviceContext'
import { GameSessionProvider } from '@/context/GameSessionContext'
import { lazy } from 'react'

const Dashboard = lazy(() => import('@/pages/Dashboard'))
const Play = lazy(() => import('@/pages/Play'))
const MyGames = lazy(() => import('@/pages/MyGames'))
const GameDetail = lazy(() => import('@/pages/GameDetail'))
const Analysis = lazy(() => import('@/pages/Analysis'))
const Leaderboard = lazy(() => import('@/pages/Leaderboard'))
const MyChessboard = lazy(() => import('@/pages/MyChessboard'))
const Profile = lazy(() => import('@/pages/Profile'))
const SettingsPage = lazy(() => import('@/pages/Settings'))
const NotFound = lazy(() => import('@/pages/NotFound'))

function ThemedToaster() {
  const { resolvedTheme } = useSettings()
  return <Toaster theme={resolvedTheme} richColors closeButton position="bottom-right" />
}

export default function App() {
  return (
    <SettingsProvider>
      <AccountProvider>
        <DeviceProvider>
          <GameSessionProvider>
            <TooltipProvider delayDuration={300}>
              <Routes>
                <Route element={<AppLayout />}>
                  <Route index element={<Dashboard />} />
                  <Route path="play" element={<Play />} />
                  <Route path="games" element={<MyGames />} />
                  <Route path="games/:id" element={<GameDetail />} />
                  <Route path="analysis" element={<Analysis />} />
                  <Route path="leaderboard" element={<Leaderboard />} />
                  <Route path="chessboard" element={<MyChessboard />} />
                  <Route path="profile" element={<Profile />} />
                  <Route path="settings" element={<SettingsPage />} />
                  <Route path="*" element={<NotFound />} />
                </Route>
              </Routes>
              <ThemedToaster />
            </TooltipProvider>
          </GameSessionProvider>
        </DeviceProvider>
      </AccountProvider>
    </SettingsProvider>
  )
}

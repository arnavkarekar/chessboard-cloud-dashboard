import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, Flame, Hash, Minus, Percent, Play, Swords, Trophy, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PageContainer } from '@/components/layout/PageContainer'
import { StatsCard } from '@/components/dashboard/StatsCard'
import { QuickActions } from '@/components/dashboard/QuickActions'
import { RecentGames } from '@/components/dashboard/RecentGames'
import { DeviceStatusCard } from '@/components/dashboard/DeviceStatusCard'
import { ActivityFeed } from '@/components/dashboard/ActivityFeed'
import { useAccount } from '@/context/AccountContext'
import { useGameSession } from '@/context/GameSessionContext'

function greeting() {
  const h = new Date().getHours()
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'
}

export default function Dashboard() {
  const { profile, stats, games, gamesLoading, activity } = useAccount()
  const { modals, session, outcome } = useGameSession()
  const navigate = useNavigate()
  const live = !!session && !outcome

  const streakLabel = stats.streak.result
    ? `${stats.streak.count} ${stats.streak.result === 'win' ? 'win' : stats.streak.result === 'loss' ? 'loss' : 'draw'}${stats.streak.count > 1 ? (stats.streak.result === 'loss' ? 'es' : 's') : ''}`
    : '—'

  return (
    <PageContainer>
      <section className="relative mb-6 overflow-hidden rounded-2xl border bg-gradient-to-br from-primary/12 via-card to-card p-6 sm:p-8">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-10 -top-10 hidden size-72 rotate-12 opacity-[0.07] sm:block"
          style={{
            backgroundImage: 'repeating-conic-gradient(currentColor 0% 25%, transparent 0% 50%)',
            backgroundSize: '25% 25%',
          }}
        />
        <p className="text-sm font-medium text-primary">{greeting()},</p>
        <h2 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">{profile.displayName}</h2>
        <p className="mt-2 max-w-xl text-sm text-muted-foreground sm:text-base">
          Play online, against a local mock AI, or face-to-face — and mirror every move on your Smart Connected Chessboard.
          This dashboard is a frontend preview with simulated players and hardware.
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <Button size="lg" onClick={() => modals.openCreate()}>
            <Swords /> Play now
          </Button>
          {live && (
            <Button size="lg" variant="outline" onClick={() => navigate('/play')}>
              <Play /> Resume current game
            </Button>
          )}
        </div>
      </section>

      <section aria-label="Quick actions" className="mb-6">
        <QuickActions />
      </section>

      <section aria-label="Statistics" className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <StatsCard label="Total games" value={stats.total} icon={Hash} loading={gamesLoading} />
        <StatsCard label="Wins" value={stats.wins} icon={Trophy} tone="success" loading={gamesLoading} />
        <StatsCard label="Losses" value={stats.losses} icon={X} tone="destructive" loading={gamesLoading} />
        <StatsCard label="Draws" value={stats.draws} icon={Minus} tone="muted" loading={gamesLoading} />
        <StatsCard label="Win rate" value={`${stats.winRate}%`} icon={Percent} loading={gamesLoading} />
        <StatsCard label="Current streak" value={streakLabel} icon={Flame} tone="brass" loading={gamesLoading} />
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Recent games</CardTitle>
            <Button asChild variant="ghost" size="sm">
              <Link to="/games">
                View all <ArrowRight />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <RecentGames games={games} loading={gamesLoading} />
          </CardContent>
        </Card>
        <div className="space-y-6">
          <DeviceStatusCard />
          <Card>
            <CardHeader>
              <CardTitle>Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <ActivityFeed items={activity} limit={6} />
            </CardContent>
          </Card>
        </div>
      </div>
    </PageContainer>
  )
}

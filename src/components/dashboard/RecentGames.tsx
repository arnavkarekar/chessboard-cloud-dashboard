import { Link } from 'react-router-dom'
import { ChevronRight, History } from 'lucide-react'
import type { GameRecord } from '@/types/game'
import { UserAvatar } from '@/components/common/UserAvatar'
import { EmptyState } from '@/components/common/EmptyState'
import { SkeletonRows } from '@/components/common/LoadingState'
import { ModeLabel, ResultBadge } from '@/components/game/GameBadges'
import { formatDate, formatDuration } from '@/lib/utils'

export function RecentGames({ games, loading, limit = 5 }: { games: GameRecord[]; loading?: boolean; limit?: number }) {
  if (loading) return <SkeletonRows rows={limit} />
  if (games.length === 0) return <EmptyState icon={History} title="No games yet" description="Finished games will appear here." />
  return (
    <ul className="-mx-2 divide-y">
      {games.slice(0, limit).map((g) => (
        <li key={g.id}>
          <Link
            to={`/games/${g.id}`}
            className="group flex items-center gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-accent/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <UserAvatar player={g.opponent} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">
                vs {g.opponent.username}
                {g.source === 'local' && <span className="ml-1.5 text-[11px] font-normal text-primary">· this session</span>}
              </p>
              <p className="flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
                <span>{formatDate(g.date)}</span>
                <span aria-hidden>·</span>
                <ModeLabel mode={g.mode} />
                <span aria-hidden>·</span>
                <span>{formatDuration(g.durationSeconds)}</span>
              </p>
            </div>
            <ResultBadge result={g.result} />
            <ChevronRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
          </Link>
        </li>
      ))}
    </ul>
  )
}

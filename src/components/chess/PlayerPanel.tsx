import type { ReactNode } from 'react'
import type { Player } from '@/types/player'
import type { PieceColor } from '@/types/game'
import type { PieceSymbol } from '@/lib/chess'
import { UserAvatar } from '@/components/common/UserAvatar'
import { cn } from '@/lib/utils'
import { CapturedPieces } from './CapturedPieces'
import { ChessClock } from './ChessClock'

export interface PlayerPanelProps {
  player: Player
  color: PieceColor
  isTurn: boolean
  captured: PieceSymbol[]
  advantage: number
  clock?: { enabled: boolean; ms: number; active: boolean; flagged: boolean; paused?: boolean }
  badge?: ReactNode
  isYou?: boolean
}

export function PlayerPanel({ player, color, isTurn, captured, advantage, clock, badge, isYou }: PlayerPanelProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-xl border bg-card px-3 py-2 transition-colors',
        isTurn && 'border-primary/50 ring-1 ring-primary/25',
      )}
    >
      <div className="relative">
        <UserAvatar player={player} />
        <span
          className={cn(
            'absolute -bottom-0.5 -right-0.5 size-3.5 rounded-full border-2 border-card',
            color === 'w' ? 'bg-white ring-1 ring-black/20' : 'bg-neutral-900',
          )}
          aria-label={color === 'w' ? 'Plays White' : 'Plays Black'}
        />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
          <span className="truncate text-sm font-semibold">{player.username}</span>
          {isYou && <span className="text-xs text-muted-foreground">(you)</span>}
          {player.rating > 0 && <span className="tabular text-xs text-muted-foreground">{player.rating}</span>}
          {badge}
          {isTurn && (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-primary">
              <span className="size-1.5 animate-pulse rounded-full bg-primary" /> to move
            </span>
          )}
        </div>
        <CapturedPieces pieces={captured} capturedColor={color === 'w' ? 'b' : 'w'} advantage={advantage} />
      </div>
      {clock && <ChessClock {...clock} />}
    </div>
  )
}

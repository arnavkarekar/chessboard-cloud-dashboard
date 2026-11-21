import { useSettings } from '@/context/SettingsContext'
import { PIECE_SETS } from '@/lib/boardThemes'
import type { PieceSymbol } from '@/lib/chess'
import type { PieceColor } from '@/types/game'

/** Shows pieces of `capturedColor` that have been taken, plus a material lead label. */
export function CapturedPieces({ pieces, capturedColor, advantage }: { pieces: PieceSymbol[]; capturedColor: PieceColor; advantage: number }) {
  const { settings } = useSettings()
  const set = PIECE_SETS[settings.pieceStyle]
  return (
    <div className="flex min-h-5 flex-wrap items-center gap-x-0.5" aria-label={`Captured: ${pieces.join(', ') || 'none'}`}>
      {pieces.map((p, i) => {
        const Render = set[`${capturedColor}${p.toUpperCase()}`]
        const sameAsPrev = i > 0 && pieces[i - 1] === p
        return (
          <span key={i} className={sameAsPrev ? '-ml-2.5 size-5' : 'size-5'}>
            {Render?.()}
          </span>
        )
      })}
      {advantage > 0 && <span className="ml-1 text-xs font-semibold text-muted-foreground">+{advantage}</span>}
    </div>
  )
}

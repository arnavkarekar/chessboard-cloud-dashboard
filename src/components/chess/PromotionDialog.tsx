import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useSettings } from '@/context/SettingsContext'
import { PIECE_SETS } from '@/lib/boardThemes'
import type { PieceColor } from '@/types/game'

const OPTIONS = [
  { type: 'q', label: 'Queen' },
  { type: 'r', label: 'Rook' },
  { type: 'b', label: 'Bishop' },
  { type: 'n', label: 'Knight' },
] as const

export function PromotionDialog({
  open,
  color,
  onSelect,
  onCancel,
}: {
  open: boolean
  color: PieceColor
  onSelect: (piece: 'q' | 'r' | 'b' | 'n') => void
  onCancel: () => void
}) {
  const { settings } = useSettings()
  const pieces = PIECE_SETS[settings.pieceStyle]
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onCancel()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Promote pawn</DialogTitle>
          <DialogDescription>Choose the piece your pawn becomes.</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-4 gap-2">
          {OPTIONS.map((o) => {
            const Render = pieces[`${color}${o.type.toUpperCase()}`]
            return (
              <button
                key={o.type}
                type="button"
                onClick={() => onSelect(o.type)}
                className="flex flex-col items-center gap-1 rounded-lg border bg-muted/40 p-2 text-xs font-medium transition hover:border-primary hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label={`Promote to ${o.label}`}
              >
                <span className="block size-12">{Render?.()}</span>
                {o.label}
              </button>
            )
          })}
        </div>
      </DialogContent>
    </Dialog>
  )
}

import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import { Chessboard } from 'react-chessboard'
import { Chess, type Square } from 'chess.js'
import { useSettings } from '@/context/SettingsContext'
import { BOARD_THEMES, PIECE_SETS } from '@/lib/boardThemes'
import { isPromotionMove } from '@/lib/chess'
import type { MoveInput } from '@/hooks/useChessGame'
import type { BoardOrientation, PieceColor } from '@/types/game'
import { cn } from '@/lib/utils'
import { PromotionDialog } from './PromotionDialog'

export type Movable = PieceColor | 'both' | 'none'

export interface ChessBoardProps {
  id: string
  fen: string
  orientation: BoardOrientation
  movable: Movable
  onMove?: (move: MoveInput) => boolean
  lastMove?: { from: string; to: string } | null
  checkSquare?: string | null
  pendingMove?: { from: string; to: string } | null
  className?: string
}

const LAST_MOVE_BG = 'rgba(250, 204, 21, 0.42)'
const SELECTED_BG = 'rgba(20, 184, 166, 0.5)'
const PENDING_BG = 'rgba(59, 130, 246, 0.5)'
const DOT = 'radial-gradient(circle, rgba(15, 23, 42, 0.28) 21%, transparent 23%)'
const RING = 'radial-gradient(circle, transparent 57%, rgba(15, 23, 42, 0.3) 59%, rgba(15, 23, 42, 0.3) 70%, transparent 72%)'
const CHECK = 'radial-gradient(circle, rgba(239, 68, 68, 0.95) 0%, rgba(239, 68, 68, 0.55) 38%, transparent 72%)'

export function ChessBoard({ id, fen, orientation, movable, onMove, lastMove, checkSquare, pendingMove, className }: ChessBoardProps) {
  const { settings } = useSettings()
  const chess = useMemo(() => new Chess(fen), [fen])
  const turn = chess.turn() as PieceColor
  const [selected, setSelected] = useState<Square | null>(null)
  const [promotion, setPromotion] = useState<{ from: Square; to: Square } | null>(null)

  useEffect(() => setSelected(null), [fen, movable])

  const canMoveTurn = movable === 'both' || movable === turn
  const targets = useMemo(
    () => (selected && canMoveTurn ? chess.moves({ square: selected, verbose: true }) : []),
    [chess, selected, canMoveTurn],
  )

  const tryMove = (from: Square, to: Square) => {
    if (!onMove || !canMoveTurn) return false
    if (isPromotionMove(chess, from, to)) {
      setPromotion({ from, to })
      setSelected(null)
      return false
    }
    const ok = onMove({ from, to })
    setSelected(null)
    return ok
  }

  const onSquareClick = ({ square, piece }: { square: string; piece: { pieceType: string } | null }) => {
    if (!canMoveTurn) return
    const sq = square as Square
    if (selected && targets.some((m) => m.to === sq)) {
      tryMove(selected, sq)
      return
    }
    if (piece && piece.pieceType[0] === turn) {
      setSelected(selected === sq ? null : sq)
      return
    }
    setSelected(null)
  }

  const squareStyles = useMemo(() => {
    const styles: Record<string, CSSProperties> = {}
    const add = (sq: string, style: CSSProperties) => {
      styles[sq] = { ...styles[sq], ...style }
    }
    if (lastMove) {
      add(lastMove.from, { backgroundColor: LAST_MOVE_BG })
      add(lastMove.to, { backgroundColor: LAST_MOVE_BG })
    }
    if (pendingMove) {
      add(pendingMove.from, { backgroundColor: PENDING_BG })
      add(pendingMove.to, { backgroundColor: PENDING_BG })
    }
    if (checkSquare) add(checkSquare, { backgroundImage: CHECK })
    if (selected) add(selected, { backgroundColor: SELECTED_BG })
    if (settings.highlightLegalMoves) {
      for (const m of targets) add(m.to, { backgroundImage: chess.get(m.to) ? RING : DOT, cursor: 'pointer' })
    }
    return styles
  }, [lastMove, pendingMove, checkSquare, selected, targets, settings.highlightLegalMoves, chess])

  const theme = BOARD_THEMES[settings.boardTheme]

  return (
    <div className={cn('relative w-full select-none', className)} aria-label="Chessboard" role="group">
      <Chessboard
        options={{
          id,
          position: fen,
          boardOrientation: orientation,
          pieces: PIECE_SETS[settings.pieceStyle],
          showAnimations: settings.animations,
          animationDurationInMs: 180,
          allowDragging: movable !== 'none',
          allowDrawingArrows: true,
          squareStyles,
          lightSquareStyle: { backgroundColor: theme.light },
          darkSquareStyle: { backgroundColor: theme.dark },
          lightSquareNotationStyle: { color: theme.dark, fontWeight: 600 },
          darkSquareNotationStyle: { color: theme.light, fontWeight: 600 },
          boardStyle: { borderRadius: '10px', overflow: 'hidden', boxShadow: '0 10px 30px -12px rgba(0,0,0,0.45)' },
          canDragPiece: ({ piece }) => canMoveTurn && piece.pieceType[0] === turn,
          onPieceDrag: ({ square }) => {
            if (square) setSelected(square as Square)
          },
          onPieceDrop: ({ sourceSquare, targetSquare }) => {
            if (!targetSquare || sourceSquare === targetSquare) return false
            return tryMove(sourceSquare as Square, targetSquare as Square)
          },
          onSquareClick,
        }}
      />
      <PromotionDialog
        open={!!promotion}
        color={turn}
        onCancel={() => setPromotion(null)}
        onSelect={(piece) => {
          if (promotion && onMove) onMove({ ...promotion, promotion: piece })
          setPromotion(null)
        }}
      />
    </div>
  )
}

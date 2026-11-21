import { useCallback, useMemo, useRef, useState } from 'react'
import { Chess, DEFAULT_POSITION, type Move, type Square } from 'chess.js'
import { detectOutcome, findKingInCheck, safeValidateFen } from '@/lib/chess'
import type { GameOutcome, PieceColor } from '@/types/game'

export interface MoveInput {
  from: Square
  to: Square
  promotion?: 'q' | 'r' | 'b' | 'n'
}

export interface ChessGameOptions {
  initialFen?: string
  initialPgn?: string
  /** When true, moving while browsing an earlier position discards later moves (analysis). */
  allowBranching?: boolean
}

export type LoadResult = { ok: true } | { ok: false; error: string }

/**
 * Wraps a single chess.js instance. chess.js is the only source of truth for the
 * position; React state is a version counter that triggers re-renders after mutations.
 */
export function useChessGame(options: ChessGameOptions = {}) {
  const chessRef = useRef<Chess | null>(null)
  const startFenRef = useRef<string>(DEFAULT_POSITION)
  if (chessRef.current === null) {
    const chess = new Chess(options.initialFen ?? DEFAULT_POSITION)
    startFenRef.current = chess.fen()
    if (options.initialPgn) {
      try {
        chess.loadPgn(options.initialPgn)
        startFenRef.current = chess.getHeaders().FEN ?? DEFAULT_POSITION
      } catch {
        chess.reset()
      }
    }
    chessRef.current = chess
  }
  const chess = chessRef.current
  const [version, setVersion] = useState(0)
  const [viewIndex, setViewIndex] = useState<number | null>(null)
  const bump = useCallback(() => setVersion((v) => v + 1), [])
  const allowBranching = options.allowBranching ?? false

  const derived = useMemo(() => {
    const history = chess.history({ verbose: true }) as Move[]
    const fen = chess.fen()
    const outcome: GameOutcome | null = detectOutcome(chess)
    return { history, fen, outcome, turn: chess.turn() as PieceColor, checkSquare: findKingInCheck(chess) }
  }, [version, chess])

  const { history } = derived
  const displayedPly = viewIndex === null ? history.length : Math.min(viewIndex, history.length)
  const isViewingHistory = viewIndex !== null && viewIndex < history.length

  const displayFen = displayedPly === history.length ? derived.fen : displayedPly === 0 ? startFenRef.current : history[displayedPly - 1].after

  const displayState = useMemo(() => {
    if (!isViewingHistory) return { checkSquare: derived.checkSquare, turn: derived.turn }
    const c = new Chess(displayFen)
    return { checkSquare: findKingInCheck(c), turn: c.turn() as PieceColor }
  }, [isViewingHistory, displayFen, derived.checkSquare, derived.turn])

  const lastMove = displayedPly > 0 ? history[displayedPly - 1] : null

  /**
   * Plays a move at the live position. While browsing history, the move is rejected unless
   * branching is allowed (analysis) or `keepView` is set (an opponent move arriving mid-review).
   */
  const makeMove = useCallback(
    (input: MoveInput, opts: { keepView?: boolean } = {}): Move | null => {
      const browsing = viewIndex !== null && viewIndex < chess.history().length
      if (browsing && !opts.keepView) {
        if (!allowBranching) return null
        const toUndo = chess.history().length - viewIndex
        for (let i = 0; i < toUndo; i++) chess.undo()
      }
      try {
        const move = chess.move(input)
        if (!(browsing && opts.keepView)) setViewIndex(null)
        bump()
        return move
      } catch {
        return null
      }
    },
    [chess, viewIndex, allowBranching, bump],
  )

  const undo = useCallback(
    (count = 1) => {
      let undone = 0
      for (let i = 0; i < count; i++) if (chess.undo()) undone++
      setViewIndex(null)
      bump()
      return undone
    },
    [chess, bump],
  )

  const reset = useCallback(
    (fen: string = DEFAULT_POSITION) => {
      chess.load(fen)
      startFenRef.current = chess.fen()
      setViewIndex(null)
      bump()
    },
    [chess, bump],
  )

  const loadFen = useCallback(
    (fen: string): LoadResult => {
      const check = safeValidateFen(fen)
      if (!check.ok) return { ok: false, error: check.error ?? 'Invalid FEN' }
      reset(fen.trim())
      return { ok: true }
    },
    [reset],
  )

  const loadPgn = useCallback(
    (pgn: string): LoadResult => {
      const test = new Chess()
      try {
        test.loadPgn(pgn.trim())
      } catch (e) {
        return { ok: false, error: e instanceof Error ? e.message : 'Invalid PGN' }
      }
      chess.loadPgn(pgn.trim())
      startFenRef.current = chess.getHeaders().FEN ?? DEFAULT_POSITION
      setViewIndex(null)
      bump()
      return { ok: true }
    },
    [chess, bump],
  )

  const goTo = useCallback(
    (ply: number | null) => {
      const len = chess.history().length
      if (ply === null || ply >= len) setViewIndex(null)
      else setViewIndex(Math.max(0, ply))
    },
    [chess],
  )

  const pgn = useCallback(() => chess.pgn({ maxWidth: 80 }), [chess])

  const legalMovesFrom = useCallback(
    (square: Square) => (isViewingHistory ? [] : chess.moves({ square, verbose: true })),
    [chess, isViewingHistory],
  )

  return {
    chess,
    version,
    fen: derived.fen,
    startFen: startFenRef.current,
    history,
    outcome: derived.outcome,
    turn: derived.turn,
    displayFen,
    displayedPly,
    displayTurn: displayState.turn,
    checkSquare: displayState.checkSquare,
    isViewingHistory,
    lastMove,
    makeMove,
    undo,
    reset,
    loadFen,
    loadPgn,
    goTo,
    goStart: () => goTo(0),
    goEnd: () => goTo(null),
    stepBack: () => goTo(displayedPly - 1),
    stepForward: () => goTo(displayedPly + 1),
    pgn,
    legalMovesFrom,
  }
}

export type ChessGameApi = ReturnType<typeof useChessGame>

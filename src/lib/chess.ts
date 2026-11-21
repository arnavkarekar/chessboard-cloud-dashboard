import { Chess, DEFAULT_POSITION, SQUARES, validateFen, type Move, type PieceSymbol, type Square } from 'chess.js'
import type {
  AiDifficulty,
  GameMode,
  GameOutcome,
  GameResult,
  PieceColor,
  TerminationReason,
  TimeControl,
} from '@/types/game'

export { DEFAULT_POSITION, SQUARES }
export type { Move, Square, PieceSymbol }

export const TIME_CONTROLS: TimeControl[] = [
  { id: 'unlimited', label: 'Unlimited', initialSeconds: null, incrementSeconds: 0 },
  { id: '3+0', label: '3 + 0', initialSeconds: 180, incrementSeconds: 0 },
  { id: '5+0', label: '5 + 0', initialSeconds: 300, incrementSeconds: 0 },
  { id: '10+0', label: '10 + 0', initialSeconds: 600, incrementSeconds: 0 },
  { id: '15+10', label: '15 + 10', initialSeconds: 900, incrementSeconds: 10 },
]

export function getTimeControl(id: string): TimeControl {
  return TIME_CONTROLS.find((t) => t.id === id) ?? TIME_CONTROLS[3]
}

export function customTimeControl(minutes: number, increment: number): TimeControl {
  return {
    id: `custom-${minutes}+${increment}`,
    label: `${minutes} + ${increment}`,
    initialSeconds: Math.round(minutes * 60),
    incrementSeconds: increment,
  }
}

export function timeControlCategory(tc: TimeControl) {
  if (tc.initialSeconds === null) return 'Unlimited'
  const estimate = tc.initialSeconds + tc.incrementSeconds * 40
  if (estimate < 180) return 'Bullet'
  if (estimate < 480) return 'Blitz'
  if (estimate < 1500) return 'Rapid'
  return 'Classical'
}

export const MODE_LABELS: Record<GameMode, string> = {
  online: 'Online (simulated)',
  local: 'Local two-player',
  ai: 'Mock AI',
}

export const DIFFICULTY_LABELS: Record<AiDifficulty, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
}

export const TERMINATION_LABELS: Record<TerminationReason, string> = {
  checkmate: 'Checkmate',
  resignation: 'Resignation',
  timeout: 'Timeout',
  stalemate: 'Stalemate',
  threefold: 'Threefold repetition',
  insufficient: 'Insufficient material',
  'fifty-move': 'Fifty-move rule',
  agreement: 'Draw by agreement',
}

export const COLOR_NAME: Record<PieceColor, string> = { w: 'White', b: 'Black' }

export function opposite(color: PieceColor): PieceColor {
  return color === 'w' ? 'b' : 'w'
}

/** Board-level game-over detection, delegated entirely to chess.js. */
export function detectOutcome(chess: Chess): GameOutcome | null {
  if (chess.isCheckmate()) return { winner: opposite(chess.turn()), reason: 'checkmate' }
  if (chess.isStalemate()) return { winner: null, reason: 'stalemate' }
  if (chess.isInsufficientMaterial()) return { winner: null, reason: 'insufficient' }
  if (chess.isThreefoldRepetition()) return { winner: null, reason: 'threefold' }
  if (chess.isDrawByFiftyMoves()) return { winner: null, reason: 'fifty-move' }
  if (chess.isDraw()) return { winner: null, reason: 'fifty-move' }
  return null
}

export function resultForColor(outcome: GameOutcome, color: PieceColor): GameResult {
  if (outcome.winner === null) return 'draw'
  return outcome.winner === color ? 'win' : 'loss'
}

export function pgnResultToken(outcome: GameOutcome | null) {
  if (!outcome) return '*'
  if (outcome.winner === null) return '1/2-1/2'
  return outcome.winner === 'w' ? '1-0' : '0-1'
}

export function findKingInCheck(chess: Chess): Square | null {
  if (!chess.inCheck()) return null
  const [square] = chess.findPiece({ type: 'k', color: chess.turn() })
  return square ?? null
}

export function isPromotionMove(chess: Chess, from: Square, to: Square) {
  return chess.moves({ square: from, verbose: true }).some((m) => m.to === to && !!m.promotion)
}

export const PIECE_VALUES: Record<PieceSymbol, number> = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 }

const START_COUNTS: Record<Exclude<PieceSymbol, 'k'>, number> = { p: 8, n: 2, b: 2, r: 2, q: 1 }

/** Pieces each side has lost, derived from the position (works for imported FENs too). */
export function capturedFromFen(fen: string) {
  const placement = fen.split(' ')[0]
  const counts = { w: { p: 0, n: 0, b: 0, r: 0, q: 0 }, b: { p: 0, n: 0, b: 0, r: 0, q: 0 } }
  for (const ch of placement) {
    const lower = ch.toLowerCase() as PieceSymbol
    if (lower in START_COUNTS) {
      const color = ch === lower ? 'b' : 'w'
      counts[color][lower as keyof typeof START_COUNTS]++
    }
  }
  const lost = (color: PieceColor) => {
    const pieces: PieceSymbol[] = []
    for (const type of ['q', 'r', 'b', 'n', 'p'] as const) {
      const missing = Math.max(0, START_COUNTS[type] - counts[color][type])
      for (let i = 0; i < missing; i++) pieces.push(type)
    }
    return pieces
  }
  const material = (color: PieceColor) =>
    (Object.keys(counts[color]) as (keyof typeof START_COUNTS)[]).reduce(
      (sum, t) => sum + counts[color][t] * PIECE_VALUES[t],
      0,
    )
  return {
    /** Pieces White has lost (i.e. captured by Black). */
    lostByWhite: lost('w'),
    lostByBlack: lost('b'),
    materialDiff: material('w') - material('b'),
  }
}

export function occupancyFromFen(fen: string): Record<string, boolean> {
  const chess = new Chess(fen, { skipValidation: true })
  const result: Record<string, boolean> = {}
  for (const sq of SQUARES) result[sq] = !!chess.get(sq)
  return result
}

export function safeValidateFen(fen: string): { ok: boolean; error?: string } {
  try {
    return validateFen(fen.trim())
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Invalid FEN' }
  }
}

export interface PgnHeaders {
  event?: string
  site?: string
  date?: Date | string
  white?: string
  black?: string
  result?: string
  timeControl?: TimeControl
  termination?: string
  whiteElo?: number
  blackElo?: number
}

function pgnDate(date: Date | string | undefined) {
  const d = date ? new Date(date) : new Date()
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
}

/** Builds a valid PGN by replaying SAN moves through chess.js. */
export function buildPgn(moves: string[], headers: PgnHeaders, startFen?: string) {
  const chess = new Chess(startFen ?? DEFAULT_POSITION)
  chess.setHeader('Event', headers.event ?? 'Casual game')
  chess.setHeader('Site', headers.site ?? 'Smart Chessboard Dashboard (local)')
  chess.setHeader('Date', pgnDate(headers.date))
  chess.setHeader('Round', '-')
  chess.setHeader('White', headers.white ?? 'White')
  chess.setHeader('Black', headers.black ?? 'Black')
  if (headers.whiteElo) chess.setHeader('WhiteElo', String(headers.whiteElo))
  if (headers.blackElo) chess.setHeader('BlackElo', String(headers.blackElo))
  if (headers.timeControl) {
    const tc = headers.timeControl
    chess.setHeader('TimeControl', tc.initialSeconds === null ? '-' : `${tc.initialSeconds}+${tc.incrementSeconds}`)
  }
  if (headers.termination) chess.setHeader('Termination', headers.termination)
  for (const san of moves) chess.move(san)
  chess.setHeader('Result', headers.result ?? '*')
  return chess.pgn({ maxWidth: 80 })
}

export function fileSafe(name: string) {
  return name.replace(/[^a-z0-9-_]+/gi, '_').replace(/_+/g, '_')
}

// ---------------------------------------------------------------------------
// Mock evaluation (NOT an engine) — material balance plus a small mobility term.
// ---------------------------------------------------------------------------

export function mockEvaluation(fen: string): { score: number; mate: PieceColor | null; label: string } {
  const chess = new Chess(fen, { skipValidation: true })
  if (chess.isCheckmate()) {
    const winner = opposite(chess.turn())
    return { score: winner === 'w' ? 10 : -10, mate: winner, label: `${COLOR_NAME[winner]} mates` }
  }
  if (chess.isDraw() || chess.isStalemate()) return { score: 0, mate: null, label: '0.0' }
  const { materialDiff } = capturedFromFen(fen)
  const mobility = chess.moves().length
  const tempo = chess.turn() === 'w' ? 1 : -1
  const score = Math.max(-9.9, Math.min(9.9, materialDiff + tempo * Math.min(mobility, 40) * 0.01))
  return { score, mate: null, label: `${score > 0 ? '+' : ''}${score.toFixed(1)}` }
}

// ---------------------------------------------------------------------------
// Lightweight mock opponent. Deliberately simple: random / greedy / 2-ply search
// on material only. This is a UI demonstration, not a real chess engine.
// ---------------------------------------------------------------------------

const CENTER = new Set(['d4', 'e4', 'd5', 'e5', 'c4', 'f4', 'c5', 'f5'])

function materialScore(chess: Chess, perspective: PieceColor) {
  let score = 0
  for (const row of chess.board()) {
    for (const piece of row) {
      if (!piece) continue
      const value = PIECE_VALUES[piece.type] + (CENTER.has(piece.square) ? 0.15 : 0)
      score += piece.color === perspective ? value : -value
    }
  }
  return score
}

function scoreAfter(chess: Chess, move: Move, perspective: PieceColor) {
  chess.move(move.san)
  let score: number
  if (chess.isCheckmate()) score = 1000
  else if (chess.isDraw()) score = 0
  else score = materialScore(chess, perspective) + (chess.inCheck() ? 0.2 : 0)
  chess.undo()
  return score
}

export function pickMockAiMove(fen: string, difficulty: AiDifficulty, random: () => number = Math.random): Move | null {
  const chess = new Chess(fen)
  const moves = chess.moves({ verbose: true })
  if (moves.length === 0) return null
  const me = chess.turn()

  if (difficulty === 'beginner') {
    const captures = moves.filter((m) => m.isCapture())
    if (captures.length && random() < 0.35) return captures[Math.floor(random() * captures.length)]
    return moves[Math.floor(random() * moves.length)]
  }

  if (difficulty === 'intermediate') {
    let best: Move[] = []
    let bestScore = -Infinity
    for (const m of moves) {
      const s = scoreAfter(chess, m, me) + random() * 0.6
      if (s > bestScore + 0.01) {
        bestScore = s
        best = [m]
      } else if (Math.abs(s - bestScore) <= 0.01) best.push(m)
    }
    return best[Math.floor(random() * best.length)]
  }

  // advanced: two-ply minimax on material
  let bestMove = moves[0]
  let bestScore = -Infinity
  for (const m of moves) {
    chess.move(m.san)
    let worst: number
    if (chess.isCheckmate()) worst = 1000
    else if (chess.isDraw()) worst = 0
    else {
      worst = Infinity
      for (const reply of chess.moves({ verbose: true })) {
        chess.move(reply.san)
        const s = chess.isCheckmate() ? -1000 : chess.isDraw() ? 0 : materialScore(chess, me)
        chess.undo()
        if (s < worst) worst = s
      }
    }
    chess.undo()
    const s = worst + random() * 0.15
    if (s > bestScore) {
      bestScore = s
      bestMove = m
    }
  }
  return bestMove
}

// ---------------------------------------------------------------------------
// Mock game codes
// ---------------------------------------------------------------------------

const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
export const GAME_CODE_PATTERN = /^[A-HJ-NP-Z2-9]{6}$/

export function generateGameCode() {
  let code = ''
  for (let i = 0; i < 6; i++) code += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)]
  return code
}

export function normalizeGameCode(input: string) {
  return input.toUpperCase().replace(/[^A-Z0-9]/g, '')
}

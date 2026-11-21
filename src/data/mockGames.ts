import { Chess } from 'chess.js'
import type { GameMode, GameRecord, GameResult, PieceColor, TerminationReason } from '@/types/game'
import { buildPgn, getTimeControl, opposite, pgnResultToken, pickMockAiMove, TERMINATION_LABELS } from '@/lib/chess'
import { seededRandom } from '@/lib/utils'
import { CURRENT_USER, MOCK_AI_PLAYERS, MOCK_PLAYERS } from './mockPlayers'

/** Opening move sequences (SAN) used to seed realistic-looking mock games. */
const OPENINGS: string[][] = [
  ['e4', 'e5', 'Nf3', 'Nc6', 'Bb5', 'a6', 'Ba4', 'Nf6', 'O-O', 'Be7'],
  ['d4', 'd5', 'c4', 'e6', 'Nc3', 'Nf6', 'Bg5', 'Be7', 'e3', 'O-O'],
  ['e4', 'c5', 'Nf3', 'd6', 'd4', 'cxd4', 'Nxd4', 'Nf6', 'Nc3', 'a6'],
  ['d4', 'Nf6', 'c4', 'g6', 'Nc3', 'Bg7', 'e4', 'd6', 'Nf3', 'O-O'],
  ['e4', 'e6', 'd4', 'd5', 'Nc3', 'Bb4', 'e5', 'c5', 'a3', 'Bxc3+'],
  ['c4', 'e5', 'Nc3', 'Nf6', 'Nf3', 'Nc6', 'g3', 'd5', 'cxd5', 'Nxd5'],
  ['e4', 'c6', 'd4', 'd5', 'e5', 'Bf5', 'Nf3', 'e6', 'Be2', 'c5'],
  ['Nf3', 'd5', 'g3', 'Nf6', 'Bg2', 'c6', 'O-O', 'Bg4', 'd3', 'Nbd7'],
]

/** A famous miniature (Morphy, Paris 1858) to guarantee at least one decisive checkmate record. */
const OPERA_GAME = 'e4 e5 Nf3 d6 d4 Bg4 dxe5 Bxf3 Qxf3 dxe5 Bc4 Nf6 Qb3 Qe7 Nc3 c6 Bg5 b5 Nxb5 cxb5 Bxb5+ Nbd7 O-O-O Rd8 Rxd7 Rxd7 Rd1 Qe6 Bxd7+ Nxd7 Qb8+ Nxb8 Rd8#'.split(' ')

interface Seed {
  opponentIndex: number | 'ai'
  mode: GameMode
  userColor: PieceColor
  result: GameResult
  termination: TerminationReason
  tc: string
  daysAgo: number
  plies: number
}

const SEEDS: Seed[] = [
  { opponentIndex: 10, mode: 'online', userColor: 'w', result: 'win', termination: 'resignation', tc: '10+0', daysAgo: 0.2, plies: 52 },
  { opponentIndex: 'ai', mode: 'ai', userColor: 'b', result: 'win', termination: 'checkmate', tc: '5+0', daysAgo: 0.9, plies: 0 },
  { opponentIndex: 3, mode: 'online', userColor: 'b', result: 'loss', termination: 'timeout', tc: '3+0', daysAgo: 1.3, plies: 64 },
  { opponentIndex: 12, mode: 'local', userColor: 'w', result: 'draw', termination: 'agreement', tc: 'unlimited', daysAgo: 2.1, plies: 40 },
  { opponentIndex: 7, mode: 'online', userColor: 'w', result: 'win', termination: 'resignation', tc: '15+10', daysAgo: 3.4, plies: 71 },
  { opponentIndex: 1, mode: 'online', userColor: 'b', result: 'loss', termination: 'resignation', tc: '10+0', daysAgo: 4.6, plies: 45 },
  { opponentIndex: 15, mode: 'online', userColor: 'w', result: 'win', termination: 'timeout', tc: '5+0', daysAgo: 5.2, plies: 88 },
  { opponentIndex: 'ai', mode: 'ai', userColor: 'w', result: 'loss', termination: 'resignation', tc: '10+0', daysAgo: 6.8, plies: 38 },
  { opponentIndex: 9, mode: 'online', userColor: 'b', result: 'draw', termination: 'agreement', tc: '15+10', daysAgo: 8.1, plies: 60 },
  { opponentIndex: 5, mode: 'online', userColor: 'w', result: 'loss', termination: 'resignation', tc: '3+0', daysAgo: 9.5, plies: 49 },
  { opponentIndex: 18, mode: 'online', userColor: 'b', result: 'win', termination: 'resignation', tc: '10+0', daysAgo: 11.2, plies: 57 },
  { opponentIndex: 13, mode: 'local', userColor: 'w', result: 'win', termination: 'resignation', tc: 'unlimited', daysAgo: 13.7, plies: 33 },
  { opponentIndex: 4, mode: 'online', userColor: 'w', result: 'draw', termination: 'agreement', tc: '10+0', daysAgo: 16.0, plies: 74 },
  { opponentIndex: 16, mode: 'online', userColor: 'b', result: 'win', termination: 'timeout', tc: '3+0', daysAgo: 18.3, plies: 92 },
  { opponentIndex: 0, mode: 'online', userColor: 'w', result: 'loss', termination: 'resignation', tc: '15+10', daysAgo: 21.9, plies: 66 },
  { opponentIndex: 11, mode: 'online', userColor: 'b', result: 'win', termination: 'resignation', tc: '5+0', daysAgo: 25.4, plies: 43 },
  { opponentIndex: 'ai', mode: 'ai', userColor: 'w', result: 'win', termination: 'resignation', tc: 'unlimited', daysAgo: 29.0, plies: 51 },
  { opponentIndex: 6, mode: 'online', userColor: 'w', result: 'loss', termination: 'timeout', tc: '5+0', daysAgo: 33.6, plies: 80 },
  { opponentIndex: 14, mode: 'online', userColor: 'b', result: 'draw', termination: 'agreement', tc: '10+0', daysAgo: 38.2, plies: 54 },
  { opponentIndex: 8, mode: 'online', userColor: 'w', result: 'win', termination: 'resignation', tc: '10+0', daysAgo: 44.5, plies: 61 },
]

/**
 * Plays out a legal game with chess.js so every mock record has a valid move list,
 * final position, and PGN. Games end before an accidental checkmate unless the seed asks for one.
 */
function generateMoves(seedIndex: number, plies: number): string[] {
  const random = seededRandom(1000 + seedIndex * 7919)
  const chess = new Chess()
  const opening = OPENINGS[seedIndex % OPENINGS.length]
  for (const san of opening) {
    if (chess.history().length >= plies) break
    chess.move(san)
  }
  while (chess.history().length < plies) {
    const move = pickMockAiMove(chess.fen(), 'beginner', random)
    if (!move) break
    chess.move(move.san)
    if (chess.isGameOver()) {
      chess.undo()
      break
    }
  }
  return chess.history()
}

function buildRecord(seed: Seed, index: number): GameRecord {
  const opponent = seed.opponentIndex === 'ai' ? MOCK_AI_PLAYERS[index % 2 ? 'advanced' : 'intermediate'] : MOCK_PLAYERS[seed.opponentIndex]
  const timeControl = getTimeControl(seed.tc)
  const isOpera = seed.termination === 'checkmate'
  const moves = isOpera ? OPERA_GAME : generateMoves(index, seed.plies)
  const userColor: PieceColor = isOpera ? 'w' : seed.userColor
  const date = new Date(Date.now() - seed.daysAgo * 86_400_000)
  const winner: PieceColor | null = seed.result === 'draw' ? null : seed.result === 'win' ? userColor : opposite(userColor)
  const white = userColor === 'w' ? CURRENT_USER : opponent
  const black = userColor === 'w' ? opponent : CURRENT_USER

  const chess = new Chess()
  for (const san of moves) chess.move(san)

  const base = timeControl.initialSeconds ?? 900
  const durationSeconds = Math.round(Math.min(base * 1.7, moves.length * (base / 70 + 4)))

  return {
    id: `g-${(1001 + index).toString(36)}`,
    mode: seed.mode,
    userColor,
    opponent,
    timeControl,
    result: seed.result,
    termination: seed.termination,
    date: date.toISOString(),
    durationSeconds,
    moves,
    finalFen: chess.fen(),
    pgn: buildPgn(moves, {
      event: seed.mode === 'online' ? 'Online game (mock record)' : seed.mode === 'ai' ? 'Mock AI game' : 'Local game',
      date,
      white: white.username,
      black: black.username,
      whiteElo: white.rating || undefined,
      blackElo: black.rating || undefined,
      timeControl,
      result: pgnResultToken(winner === null ? { winner: null, reason: seed.termination } : { winner, reason: seed.termination }),
      termination: TERMINATION_LABELS[seed.termination],
    }),
    physicalBoard: index % 3 === 0,
    source: 'mock',
    ratingChange: seed.mode === 'online' ? (seed.result === 'win' ? 8 : seed.result === 'loss' ? -9 : 1) : undefined,
  }
}

export const MOCK_GAMES: GameRecord[] = SEEDS.map(buildRecord)

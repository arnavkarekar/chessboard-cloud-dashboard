import type { Player } from './player'

export type PieceColor = 'w' | 'b'
export type BoardOrientation = 'white' | 'black'

export type GameMode = 'online' | 'local' | 'ai'
export type ColorChoice = 'white' | 'black' | 'random'
export type AiDifficulty = 'beginner' | 'intermediate' | 'advanced'

export type GameResult = 'win' | 'loss' | 'draw'

export type TerminationReason =
  | 'checkmate'
  | 'resignation'
  | 'timeout'
  | 'stalemate'
  | 'threefold'
  | 'insufficient'
  | 'fifty-move'
  | 'agreement'

export interface TimeControl {
  id: string
  label: string
  /** Starting time per side in seconds; null means unlimited. */
  initialSeconds: number | null
  incrementSeconds: number
}

export interface GameConfig {
  mode: GameMode
  colorChoice: ColorChoice
  timeControl: TimeControl
  aiDifficulty: AiDifficulty
  physicalBoard: boolean
}

export interface GameOutcome {
  /** Winning color, or null for a draw. */
  winner: PieceColor | null
  reason: TerminationReason
}

export interface GameRecord {
  id: string
  mode: GameMode
  /** Color played by the current user. In local games the user is considered White. */
  userColor: PieceColor
  opponent: Player
  timeControl: TimeControl
  result: GameResult
  termination: TerminationReason
  /** ISO date when the game started. */
  date: string
  durationSeconds: number
  /** Moves in standard algebraic notation. */
  moves: string[]
  pgn: string
  finalFen: string
  physicalBoard: boolean
  source: 'mock' | 'local'
  ratingChange?: number
}

export type OnlineConnectionStatus = 'waiting' | 'connected' | 'disconnected' | 'reconnecting'

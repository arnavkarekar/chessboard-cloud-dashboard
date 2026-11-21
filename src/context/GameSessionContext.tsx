import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import type {
  BoardOrientation,
  GameConfig,
  GameOutcome,
  GameRecord,
  OnlineConnectionStatus,
  PieceColor,
} from '@/types/game'
import type { Player } from '@/types/player'
import { useChessGame, type MoveInput } from '@/hooks/useChessGame'
import { useChessClock } from '@/hooks/useChessClock'
import {
  buildPgn,
  capturedFromFen,
  detectOutcome,
  GAME_CODE_PATTERN,
  generateGameCode,
  getTimeControl,
  normalizeGameCode,
  opposite,
  pgnResultToken,
  pickMockAiMove,
  resultForColor,
  TERMINATION_LABELS,
} from '@/lib/chess'
import { playSound } from '@/lib/sound'
import { sleep, uid } from '@/lib/utils'
import { LOCAL_OPPONENT, MOCK_AI_PLAYERS, MOCK_PLAYERS } from '@/data/mockPlayers'
import { useSettings } from './SettingsContext'
import { useAccount } from './AccountContext'
import { useDevice } from './DeviceContext'

export const DEMO_GAME_CODE = 'PLAY24'

export type LobbyStatus = 'waiting' | 'joining' | 'ready'

export interface LobbyInfo {
  code: string
  role: 'host' | 'guest'
  config: GameConfig
  userColor: PieceColor
  opponent: Player | null
  status: LobbyStatus
}

export interface SessionInfo {
  id: string
  config: GameConfig
  userColor: PieceColor
  opponent: Player
  code?: string
  startedAt: number
}

export type DrawOfferState = 'none' | 'pending'

function resolveColor(choice: GameConfig['colorChoice']): PieceColor {
  if (choice === 'white') return 'w'
  if (choice === 'black') return 'b'
  return Math.random() < 0.5 ? 'w' : 'b'
}

function randomOpponent(nearRating: number): Player {
  const pool = MOCK_PLAYERS.filter((p) => Math.abs(p.rating - nearRating) < 260)
  const list = pool.length ? pool : MOCK_PLAYERS
  return list[Math.floor(Math.random() * list.length)]
}

export function defaultConfig(timeControlId: string): GameConfig {
  return {
    mode: 'local',
    colorChoice: 'white',
    timeControl: getTimeControl(timeControlId),
    aiDifficulty: 'intermediate',
    physicalBoard: false,
  }
}

function useSessionValue() {
  const { settings } = useSettings()
  const { profile, addLocalGame, logActivity, pushNotification } = useAccount()
  const device = useDevice()
  const navigate = useNavigate()
  const location = useLocation()

  const game = useChessGame()
  const [session, setSession] = useState<SessionInfo | null>(null)
  const [outcome, setOutcome] = useState<GameOutcome | null>(null)
  const [paused, setPaused] = useState(false)
  const [connection, setConnection] = useState<OnlineConnectionStatus>('connected')
  const [drawOffer, setDrawOffer] = useState<DrawOfferState>('none')
  const [orientation, setOrientation] = useState<BoardOrientation>('white')
  const [lobby, setLobby] = useState<LobbyInfo | null>(null)
  const [hosted, setHosted] = useState<Record<string, { config: GameConfig; userColor: PieceColor }>>({})
  const [lastRecordId, setLastRecordId] = useState<string | null>(null)

  const [createOpen, setCreateOpen] = useState(false)
  const [createPreset, setCreatePreset] = useState<Partial<GameConfig> | null>(null)
  const [joinOpen, setJoinOpen] = useState(false)
  const [joinPrefill, setJoinPrefill] = useState('')
  const [resultOpen, setResultOpen] = useState(false)

  const sessionRef = useRef(session)
  sessionRef.current = session
  const outcomeRef = useRef(outcome)
  outcomeRef.current = outcome
  const settingsRef = useRef(settings)
  settingsRef.current = settings
  const pathRef = useRef(location.pathname)
  pathRef.current = location.pathname

  // --- ending a game --------------------------------------------------------

  const endGameRef = useRef<(o: GameOutcome) => void>(() => {})

  const clock = useChessClock((flaggedColor) => {
    const winner = opposite(flaggedColor)
    const { lostByWhite, lostByBlack } = capturedFromFen(game.chess.fen())
    const winnerHasMaterial = (winner === 'w' ? lostByWhite : lostByBlack).length < 15
    endGameRef.current(winnerHasMaterial ? { winner, reason: 'timeout' } : { winner: null, reason: 'insufficient' })
  })

  const endGame = useCallback(
    (o: GameOutcome) => {
      const s = sessionRef.current
      if (!s || outcomeRef.current) return
      outcomeRef.current = o
      setOutcome(o)
      setDrawOffer('none')
      clock.pause()
      setResultOpen(true)
      if (settingsRef.current.sound) playSound('end')

      const userColor = s.config.mode === 'local' ? 'w' : s.userColor
      const result = resultForColor(o, userColor)
      const moves = game.chess.history()
      const white = userColor === 'w' ? profile : s.opponent
      const black = userColor === 'w' ? s.opponent : profile
      const record: GameRecord = {
        id: `local-${s.id}`,
        mode: s.config.mode,
        userColor,
        opponent: s.opponent,
        timeControl: s.config.timeControl,
        result,
        termination: o.reason,
        date: new Date(s.startedAt).toISOString(),
        durationSeconds: Math.round((Date.now() - s.startedAt) / 1000),
        moves,
        finalFen: game.chess.fen(),
        pgn: buildPgn(moves, {
          event: s.config.mode === 'online' ? 'Online game (simulated)' : s.config.mode === 'ai' ? 'Mock AI game' : 'Local game',
          date: new Date(s.startedAt),
          white: white.username,
          black: black.username,
          whiteElo: white.rating || undefined,
          blackElo: black.rating || undefined,
          timeControl: s.config.timeControl,
          result: pgnResultToken(o),
          termination: TERMINATION_LABELS[o.reason],
        }),
        physicalBoard: s.config.physicalBoard,
        source: 'local',
      }
      addLocalGame(record)
      setLastRecordId(record.id)
      logActivity({
        kind: 'game',
        text: `${result === 'win' ? 'Won' : result === 'loss' ? 'Lost' : 'Drew'} vs ${s.opponent.username} · ${TERMINATION_LABELS[o.reason].toLowerCase()}`,
        link: `/games/${record.id}`,
      })
    },
    [clock, game.chess, profile, addLocalGame, logActivity],
  )
  endGameRef.current = endGame

  // --- starting games -------------------------------------------------------

  const startSession = useCallback(
    (config: GameConfig, userColor: PieceColor, opponent: Player, code?: string) => {
      game.reset()
      const tc = config.timeControl
      clock.reset(tc.initialSeconds === null ? null : tc.initialSeconds * 1000, tc.incrementSeconds * 1000)
      if (tc.initialSeconds !== null) clock.start('w')
      const s: SessionInfo = { id: uid('s'), config, userColor, opponent, code, startedAt: Date.now() }
      sessionRef.current = s
      outcomeRef.current = null
      setSession(s)
      setOutcome(null)
      setPaused(false)
      setDrawOffer('none')
      setConnection('connected')
      setResultOpen(false)
      setLastRecordId(null)
      setLobby(null)
      const pref = settingsRef.current.defaultOrientation
      const viewColor = config.mode === 'local' ? 'w' : userColor
      setOrientation(pref === 'auto' ? (viewColor === 'w' ? 'white' : 'black') : pref)
      if (config.physicalBoard) device.resetBoard()
      navigate('/play')
    },
    [game, clock, device, navigate],
  )

  const createGame = useCallback(
    (config: GameConfig) => {
      setCreateOpen(false)
      const userColor = config.mode === 'local' ? 'w' : resolveColor(config.colorChoice)
      if (config.mode === 'online') {
        const code = generateGameCode()
        setHosted((h) => ({ ...h, [code]: { config, userColor } }))
        setLobby({ code, role: 'host', config, userColor, opponent: null, status: 'waiting' })
        return
      }
      const opponent = config.mode === 'ai' ? MOCK_AI_PLAYERS[config.aiDifficulty] : LOCAL_OPPONENT
      startSession(config, userColor, opponent)
    },
    [startSession],
  )

  const simulateOpponentJoin = useCallback(() => {
    setLobby((l) => (l ? { ...l, status: 'joining' } : l))
    window.setTimeout(() => {
      const opponent = randomOpponent(profile.rating)
      setLobby((l) => (l && l.status === 'joining' ? { ...l, opponent, status: 'ready' } : l))
      if (settingsRef.current.notifyInvitations) {
        toast.success(`${opponent.username} joined your game`, { description: 'Simulated opponent — no real player is connected.' })
        if (settingsRef.current.sound) playSound('notify')
      }
      pushNotification({ title: 'Opponent joined (simulated)', body: `${opponent.username} joined your lobby.`, kind: 'invite' })
    }, 1300)
  }, [profile.rating, pushNotification])

  const joinGame = useCallback(
    async (rawCode: string): Promise<{ ok: true } | { ok: false; error: string }> => {
      const code = normalizeGameCode(rawCode)
      if (!GAME_CODE_PATTERN.test(code)) {
        return { ok: false, error: 'Game codes are 6 characters using letters A–Z (no I or O) and digits 2–9.' }
      }
      await sleep(700)
      const host = hosted[code]
      if (host) {
        setJoinOpen(false)
        setLobby({
          code,
          role: 'guest',
          config: host.config,
          userColor: opposite(host.userColor),
          opponent: randomOpponent(profile.rating),
          status: 'ready',
        })
        return { ok: true }
      }
      if (code === DEMO_GAME_CODE) {
        setJoinOpen(false)
        setLobby({
          code,
          role: 'guest',
          config: { ...defaultConfig('10+0'), mode: 'online' },
          userColor: resolveColor('random'),
          opponent: MOCK_PLAYERS[9],
          status: 'ready',
        })
        return { ok: true }
      }
      return {
        ok: false,
        error: `No simulated game uses code ${code}. Only games created in this browser session (or the demo code ${DEMO_GAME_CODE}) can be joined.`,
      }
    },
    [hosted, profile.rating],
  )

  const startFromLobby = useCallback(() => {
    if (!lobby || lobby.status !== 'ready' || !lobby.opponent) return
    startSession(lobby.config, lobby.userColor, lobby.opponent, lobby.code)
  }, [lobby, startSession])

  const cancelLobby = useCallback(() => setLobby(null), [])

  // --- moves ----------------------------------------------------------------

  const canUserMove = !!session && !outcome && !paused && (session.config.mode !== 'online' || connection === 'connected') &&
    (session.config.mode === 'local' || game.turn === session.userColor)

  const makeMove = useCallback(
    (input: MoveInput, byOpponent = false) => {
      const s = sessionRef.current
      if (!s || outcomeRef.current) return null
      if (!byOpponent && !canUserMove) return null
      const move = game.makeMove(input, { keepView: byOpponent })
      if (!move) return null
      clock.press(move.color)
      setDrawOffer((d) => (byOpponent ? d : 'none'))

      const prefs = settingsRef.current
      if (prefs.sound) playSound(game.chess.inCheck() ? 'check' : move.isCapture() ? 'capture' : 'move')
      if (s.config.physicalBoard) {
        const event = { from: move.from, to: move.to, san: move.san, fenAfter: move.after }
        if (byOpponent) device.receiveRemoteMove(event)
        else device.registerManualMove(event)
      }
      if (byOpponent && prefs.notifyTurn && pathRef.current !== '/play') {
        toast(`${s.opponent.username} played ${move.san}`, {
          description: 'It is your move.',
          action: { label: 'Open game', onClick: () => navigate('/play') },
        })
      }
      const o = detectOutcome(game.chess)
      if (o) endGame(o)
      return move
    },
    [canUserMove, game, clock, device, endGame, navigate],
  )

  const makeMoveRef = useRef(makeMove)
  makeMoveRef.current = makeMove

  // Simulated opponent (mock AI or simulated online player).
  useEffect(() => {
    if (!session || outcome || paused) return
    const mode = session.config.mode
    if (mode === 'local' || game.turn === session.userColor) return
    if (mode === 'online' && connection !== 'connected') return
    const fen = game.fen
    const delay = mode === 'ai' ? 450 + Math.random() * 650 : 1200 + Math.random() * 2300
    const id = window.setTimeout(() => {
      const pick = pickMockAiMove(fen, mode === 'ai' ? session.config.aiDifficulty : 'intermediate')
      if (pick) makeMoveRef.current({ from: pick.from, to: pick.to, promotion: pick.promotion as MoveInput['promotion'] }, true)
    }, delay)
    return () => window.clearTimeout(id)
  }, [session, outcome, paused, connection, game.fen, game.turn])

  // --- controls -------------------------------------------------------------

  const resign = useCallback(() => {
    const s = sessionRef.current
    if (!s || outcomeRef.current) return
    const loser = s.config.mode === 'local' ? game.chess.turn() : s.userColor
    endGame({ winner: opposite(loser), reason: 'resignation' })
  }, [endGame, game.chess])

  const offerDraw = useCallback(() => {
    const s = sessionRef.current
    if (!s || outcomeRef.current) return
    if (s.config.mode === 'local') {
      endGame({ winner: null, reason: 'agreement' })
      return
    }
    setDrawOffer('pending')
    const sessionId = s.id
    const who = s.config.mode === 'ai' ? 'The mock AI' : `${s.opponent.username} (simulated)`
    window.setTimeout(() => {
      if (sessionRef.current?.id !== sessionId || outcomeRef.current) return
      const { materialDiff } = capturedFromFen(game.chess.fen())
      const level = Math.abs(materialDiff) <= 1 && game.chess.history().length >= 20
      if (level || Math.random() < 0.15) {
        toast.success(`${who} accepted the draw offer`)
        endGameRef.current({ winner: null, reason: 'agreement' })
      } else {
        setDrawOffer('none')
        toast(`${who} declined the draw offer`, {
          description: 'Simulated rule: draws are accepted when material is level after move 10.',
        })
      }
    }, 1500 + Math.random() * 1000)
  }, [endGame, game.chess])

  const canUndo = !!session && !outcome && session.config.mode !== 'online' && game.history.length > 0
  const undo = useCallback(() => {
    const s = sessionRef.current
    if (!s || outcomeRef.current || s.config.mode === 'online') return
    const plies = s.config.mode === 'ai' && game.chess.turn() === s.userColor ? 2 : 1
    game.undo(plies)
    clock.setTurn(game.chess.turn())
  }, [game, clock])

  const restart = useCallback(() => {
    const s = sessionRef.current
    if (s) startSession(s.config, s.userColor, s.opponent, s.code)
  }, [startSession])

  const rematch = useCallback(() => {
    const s = sessionRef.current
    if (!s) return
    startSession(s.config, s.config.mode === 'local' ? 'w' : opposite(s.userColor), s.opponent, s.code)
  }, [startSession])

  const canPause = !!session && !outcome && session.config.mode !== 'online'
  const togglePause = useCallback(() => {
    if (!sessionRef.current || outcomeRef.current) return
    setPaused((p) => {
      if (p) clock.resume()
      else clock.pause()
      return !p
    })
  }, [clock])

  const simulateDisconnect = useCallback(() => {
    const s = sessionRef.current
    if (!s || s.config.mode !== 'online' || outcomeRef.current) return
    const id = s.id
    setConnection('disconnected')
    clock.pause()
    window.setTimeout(() => {
      if (sessionRef.current?.id !== id) return
      setConnection('reconnecting')
      window.setTimeout(() => {
        if (sessionRef.current?.id !== id) return
        setConnection('connected')
        if (!outcomeRef.current) clock.resume()
      }, 2000)
    }, 2500)
  }, [clock])

  const flip = useCallback(() => setOrientation((o) => (o === 'white' ? 'black' : 'white')), [])

  const openCreate = useCallback((preset?: Partial<GameConfig>) => {
    setCreatePreset(preset ?? null)
    setCreateOpen(true)
  }, [])

  const openJoin = useCallback((code = '') => {
    setJoinPrefill(code)
    setJoinOpen(true)
  }, [])

  return {
    game,
    clock,
    session,
    outcome,
    paused,
    connection,
    drawOffer,
    orientation,
    lobby,
    hostedCodes: Object.keys(hosted),
    lastRecordId,
    canUserMove,
    canUndo,
    canPause,
    createGame,
    joinGame,
    simulateOpponentJoin,
    startFromLobby,
    cancelLobby,
    makeMove,
    resign,
    offerDraw,
    undo,
    restart,
    rematch,
    togglePause,
    simulateDisconnect,
    flip,
    modals: {
      createOpen,
      setCreateOpen,
      createPreset,
      openCreate,
      joinOpen,
      setJoinOpen,
      joinPrefill,
      openJoin,
      resultOpen,
      setResultOpen,
    },
  }
}

export type GameSessionApi = ReturnType<typeof useSessionValue>

const GameSessionContext = createContext<GameSessionApi | null>(null)

export function GameSessionProvider({ children }: { children: ReactNode }) {
  const value = useSessionValue()
  return <GameSessionContext.Provider value={value}>{children}</GameSessionContext.Provider>
}

export function useGameSession() {
  const ctx = useContext(GameSessionContext)
  if (!ctx) throw new Error('useGameSession must be used within GameSessionProvider')
  return ctx
}

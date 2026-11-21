import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Chess } from 'chess.js'
import { Check, Eye, Loader2, LogIn, PauseCircle, Plus, Unplug, Users, Wifi, WifiOff, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PageContainer } from '@/components/layout/PageContainer'
import { ChessBoard, type Movable } from '@/components/chess/ChessBoard'
import { PlayerPanel } from '@/components/chess/PlayerPanel'
import { MoveHistory } from '@/components/chess/MoveHistory'
import { GameControls } from '@/components/chess/GameControls'
import { SimulationBadge } from '@/components/common/SimulationBadge'
import { defaultConfig, useGameSession } from '@/context/GameSessionContext'
import { useAccount } from '@/context/AccountContext'
import { useSettings } from '@/context/SettingsContext'
import { LOCAL_OPPONENT } from '@/data/mockPlayers'
import { capturedFromFen, COLOR_NAME, DIFFICULTY_LABELS, MODE_LABELS, resultForColor, TERMINATION_LABELS, timeControlCategory } from '@/lib/chess'
import type { MoveInput } from '@/hooks/useChessGame'
import type { PieceColor, OnlineConnectionStatus } from '@/types/game'
import { cn } from '@/lib/utils'

const CONNECTION_META: Record<OnlineConnectionStatus, { label: string; variant: 'success' | 'warning' | 'destructive' | 'secondary'; icon: typeof Wifi }> = {
  connected: { label: 'Connected', variant: 'success', icon: Wifi },
  waiting: { label: 'Waiting', variant: 'secondary', icon: Loader2 },
  disconnected: { label: 'Disconnected', variant: 'destructive', icon: WifiOff },
  reconnecting: { label: 'Reconnecting…', variant: 'warning', icon: Loader2 },
}

export default function Play() {
  const s = useGameSession()
  const { profile } = useAccount()
  const { settings } = useSettings()
  const [params, setParams] = useSearchParams()
  const [pending, setPending] = useState<MoveInput | null>(null)
  const { game, session, clock, outcome } = s

  useEffect(() => {
    const code = params.get('join')
    if (code) {
      s.modals.openJoin(code)
      setParams({}, { replace: true })
    }
  }, [params, setParams, s.modals])

  useEffect(() => setPending(null), [game.fen])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      if (target.closest('input, textarea, [role="dialog"]')) return
      if (e.key === 'ArrowLeft') game.stepBack()
      if (e.key === 'ArrowRight') game.stepForward()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [game])

  const mode = session?.config.mode
  const playerFor = (color: PieceColor) => {
    if (!session) return color === 'w' ? profile : LOCAL_OPPONENT
    if (mode === 'local') return color === 'w' ? profile : LOCAL_OPPONENT
    return session.userColor === color ? profile : session.opponent
  }
  const isYou = (color: PieceColor) => !!session && mode !== 'local' && session.userColor === color

  const captured = capturedFromFen(game.displayFen)
  const topColor: PieceColor = s.orientation === 'white' ? 'b' : 'w'
  const bottomColor: PieceColor = topColor === 'w' ? 'b' : 'w'

  const panel = (color: PieceColor) => (
    <PlayerPanel
      player={playerFor(color)}
      color={color}
      isYou={isYou(color)}
      isTurn={!!session && !outcome && game.turn === color}
      captured={color === 'w' ? captured.lostByBlack : captured.lostByWhite}
      advantage={color === 'w' ? captured.materialDiff : -captured.materialDiff}
      badge={
        session && playerFor(color).isBot ? (
          <SimulationBadge label="Mock AI" tip="Simple local move picker — not a real chess engine." />
        ) : session && mode === 'online' && !isYou(color) ? (
          <SimulationBadge label="Simulated" />
        ) : null
      }
      clock={
        session
          ? { enabled: clock.enabled, ms: clock.times[color], active: clock.active === color && clock.running, flagged: clock.flagged === color, paused: s.paused }
          : undefined
      }
    />
  )

  const movable: Movable =
    !s.canUserMove || game.isViewingHistory || pending ? 'none' : mode === 'local' ? 'both' : (session?.userColor ?? 'none')

  const onMove = (move: MoveInput) => {
    if (settings.confirmMoves) {
      setPending(move)
      return false
    }
    return !!s.makeMove(move)
  }

  const pendingSan = useMemo(() => {
    if (!pending) return null
    try {
      return new Chess(game.fen).move(pending).san
    } catch {
      return null
    }
  }, [pending, game.fen])

  const status = (() => {
    if (!session) return 'No active game'
    if (outcome) {
      const r = resultForColor(outcome, session.userColor)
      const who = outcome.winner === null ? 'Draw' : mode === 'local' ? `${COLOR_NAME[outcome.winner]} wins` : r === 'win' ? 'You won' : 'You lost'
      return `${who} · ${TERMINATION_LABELS[outcome.reason]}`
    }
    if (s.paused) return 'Game paused'
    if (mode === 'online' && s.connection !== 'connected') return 'Opponent connection interrupted (simulated)…'
    const check = game.chess.inCheck() ? 'Check! ' : ''
    if (mode === 'local') return `${check}${COLOR_NAME[game.turn]} to move`
    return game.turn === session.userColor ? `${check}Your move` : `${check}${mode === 'ai' ? 'Mock AI' : session.opponent.username} is thinking…`
  })()

  return (
    <PageContainer className="max-w-[1400px]">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="mx-auto flex w-full max-w-[min(100%,max(18rem,calc(100dvh-20rem)))] flex-col gap-3">
          {panel(topColor)}
          <div className="relative">
            <ChessBoard
              id="play-board"
              fen={game.displayFen}
              orientation={s.orientation}
              movable={movable}
              onMove={onMove}
              lastMove={game.lastMove}
              checkSquare={game.checkSquare}
              pendingMove={pending}
            />
            {!session && (
              <div className="absolute inset-0 flex items-center justify-center rounded-[10px] bg-background/70 p-4 backdrop-blur-[2px]">
                <Card className="w-full max-w-sm text-center shadow-xl">
                  <CardHeader className="items-center">
                    <CardTitle>Ready to play?</CardTitle>
                    <p className="text-sm text-muted-foreground">Create a new game or join one with a code.</p>
                  </CardHeader>
                  <CardContent className="grid gap-2">
                    <Button onClick={() => s.modals.openCreate()}>
                      <Plus /> Create game
                    </Button>
                    <div className="grid grid-cols-2 gap-2">
                      <Button variant="outline" onClick={() => s.modals.openJoin()}>
                        <LogIn /> Join game
                      </Button>
                      <Button variant="outline" onClick={() => s.createGame(defaultConfig(settings.defaultTimeControlId))}>
                        <Users /> Quick local
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
            {session && s.paused && !outcome && (
              <button
                type="button"
                onClick={s.togglePause}
                className="absolute inset-0 flex flex-col items-center justify-center gap-2 rounded-[10px] bg-background/60 text-foreground backdrop-blur-sm"
              >
                <PauseCircle className="size-12" />
                <span className="font-medium">Paused — click to resume</span>
              </button>
            )}
          </div>
          {panel(bottomColor)}
          <div className="flex min-h-9 flex-wrap items-center gap-2" aria-live="polite">
            <span className={cn('text-sm font-medium', outcome && 'text-primary', game.chess.inCheck() && !outcome && 'text-destructive')}>{status}</span>
            {game.isViewingHistory && (
              <Badge variant="warning">
                <Eye /> Viewing move {game.displayedPly} of {game.history.length}
              </Badge>
            )}
            {pending && (
              <div className="ml-auto flex items-center gap-2 rounded-lg border bg-card px-2 py-1 shadow-sm">
                <span className="text-sm">
                  Play <strong className="font-mono">{pendingSan}</strong>?
                </span>
                <Button size="sm" onClick={() => (s.makeMove(pending), setPending(null))}>
                  <Check /> Confirm
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setPending(null)} aria-label="Cancel move">
                  <X />
                </Button>
              </div>
            )}
          </div>
        </div>

        <aside className="flex flex-col gap-4">
          <Card>
            <CardHeader className="flex-row items-center justify-between gap-2 pb-3">
              <CardTitle>{session ? MODE_LABELS[session.config.mode] : 'Game'}</CardTitle>
              {mode === 'online' && <SimulationBadge />}
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {session ? (
                <>
                  <div className="flex flex-wrap gap-1.5">
                    <Badge variant="secondary">
                      {session.config.timeControl.label} · {timeControlCategory(session.config.timeControl)}
                    </Badge>
                    {mode === 'ai' && <Badge variant="secondary">{DIFFICULTY_LABELS[session.config.aiDifficulty]} (simulated)</Badge>}
                    {session.code && <Badge variant="outline" className="font-mono">#{session.code}</Badge>}
                    {session.config.physicalBoard && <Badge variant="sim">Physical board mirror</Badge>}
                  </div>
                  {mode === 'online' && (
                    <div className="flex items-center justify-between gap-2 rounded-lg bg-muted/50 p-2.5">
                      <span className="flex items-center gap-2">
                        Opponent
                        <ConnectionBadge status={s.connection} />
                      </span>
                      <Button size="sm" variant="outline" onClick={s.simulateDisconnect} disabled={s.connection !== 'connected' || !!outcome}>
                        <Unplug /> Simulate drop
                      </Button>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-muted-foreground">Start a game to see its details here.</p>
              )}
            </CardContent>
          </Card>

          <Card className="flex min-h-0 flex-col">
            <CardHeader className="pb-3">
              <CardTitle>Moves</CardTitle>
            </CardHeader>
            <CardContent>
              <MoveHistory history={game.history} displayedPly={game.displayedPly} onSelect={game.goTo} className="h-64 lg:h-[calc(100dvh-36rem)] lg:min-h-48" />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-5">
              <GameControls />
            </CardContent>
          </Card>
        </aside>
      </div>
    </PageContainer>
  )
}

function ConnectionBadge({ status }: { status: OnlineConnectionStatus }) {
  const meta = CONNECTION_META[status]
  const spinning = status === 'reconnecting' || status === 'waiting'
  return (
    <Badge variant={meta.variant}>
      <meta.icon className={cn(spinning && 'animate-spin')} /> {meta.label}
    </Badge>
  )
}

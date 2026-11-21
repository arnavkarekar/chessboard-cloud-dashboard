import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, BarChart3, Download, FileQuestion, FlipVertical2, Pause, Play } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PageContainer } from '@/components/layout/PageContainer'
import { ChessBoard } from '@/components/chess/ChessBoard'
import { MoveHistory } from '@/components/chess/MoveHistory'
import { UserAvatar } from '@/components/common/UserAvatar'
import { EmptyState } from '@/components/common/EmptyState'
import { LoadingState } from '@/components/common/LoadingState'
import { ModeLabel, ResultBadge } from '@/components/game/GameBadges'
import { useAccount } from '@/context/AccountContext'
import { useChessGame } from '@/hooks/useChessGame'
import { COLOR_NAME, TERMINATION_LABELS, timeControlCategory } from '@/lib/chess'
import { formatDateTime, formatDuration } from '@/lib/utils'
import type { BoardOrientation, GameRecord } from '@/types/game'
import { downloadGamePgn } from './MyGames'

export default function GameDetail() {
  const { id = '' } = useParams()
  const { getGame, gamesLoading } = useAccount()
  const game = getGame(id)
  if (!game && gamesLoading) return <LoadingState label="Loading game…" className="py-24" />
  if (!game)
    return (
      <PageContainer>
        <EmptyState
          icon={FileQuestion}
          title="Game not found"
          description="This game isn't in your mock history. Games from previous sessions are not persisted."
          action={
            <Button asChild variant="outline">
              <Link to="/games">Back to My Games</Link>
            </Button>
          }
        />
      </PageContainer>
    )
  return <GameReplay key={game.id} record={game} />
}

function GameReplay({ record }: { record: GameRecord }) {
  const { profile } = useAccount()
  const replay = useChessGame({ initialPgn: record.pgn })
  const [orientation, setOrientation] = useState<BoardOrientation>(record.userColor === 'w' ? 'white' : 'black')
  const [autoplay, setAutoplay] = useState(false)

  const { displayedPly, history, goTo } = replay
  useEffect(() => {
    if (!autoplay) return
    if (displayedPly >= history.length) {
      setAutoplay(false)
      return
    }
    const t = window.setTimeout(() => goTo(displayedPly + 1), 800)
    return () => window.clearTimeout(t)
  }, [autoplay, displayedPly, history.length, goTo])

  const white = record.userColor === 'w' ? profile : record.opponent
  const black = record.userColor === 'w' ? record.opponent : profile
  const top = orientation === 'white' ? black : white
  const bottom = orientation === 'white' ? white : black

  const startAutoplay = () => {
    if (displayedPly >= history.length) goTo(0)
    setAutoplay(true)
  }

  const facts: [string, React.ReactNode][] = [
    ['Result', <ResultBadge key="r" result={record.result} />],
    ['Termination', TERMINATION_LABELS[record.termination]],
    ['Date', formatDateTime(record.date)],
    ['Duration', formatDuration(record.durationSeconds)],
    ['Time control', `${record.timeControl.label} · ${timeControlCategory(record.timeControl)}`],
    ['Mode', <ModeLabel key="m" mode={record.mode} />],
    ['Moves', Math.ceil(record.moves.length / 2)],
    ['Your color', COLOR_NAME[record.userColor]],
  ]
  if (record.ratingChange !== undefined) facts.push(['Rating change (mock)', `${record.ratingChange > 0 ? '+' : ''}${record.ratingChange}`])
  if (record.physicalBoard) facts.push(['Physical board', 'Mirrored (simulated)'])

  return (
    <PageContainer
      title={`vs ${record.opponent.username}`}
      description={record.source === 'mock' ? 'Mock game record' : 'Played in this browser session'}
      actions={
        <>
          <Button asChild variant="ghost">
            <Link to="/games">
              <ArrowLeft /> All games
            </Link>
          </Button>
          <Button variant="outline" onClick={() => downloadGamePgn(record)}>
            <Download /> Export PGN
          </Button>
          <Button asChild>
            <Link to={`/analysis?game=${record.id}`}>
              <BarChart3 /> Analyze
            </Link>
          </Button>
        </>
      }
    >
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="mx-auto w-full max-w-[min(100%,max(18rem,calc(100dvh-22rem)))] space-y-2">
          <PlayerLine player={top} you={top.id === profile.id} />
          <ChessBoard id="replay-board" fen={replay.displayFen} orientation={orientation} movable="none" lastMove={replay.lastMove} checkSquare={replay.checkSquare} />
          <PlayerLine player={bottom} you={bottom.id === profile.id} />
          <div className="flex flex-wrap gap-2 pt-1">
            <Button variant="outline" onClick={() => (autoplay ? setAutoplay(false) : startAutoplay())}>
              {autoplay ? <Pause /> : <Play />} {autoplay ? 'Pause replay' : 'Auto-replay'}
            </Button>
            <Button variant="outline" onClick={() => setOrientation((o) => (o === 'white' ? 'black' : 'white'))}>
              <FlipVertical2 /> Flip board
            </Button>
          </div>
        </div>
        <aside className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Game information</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
                {facts.map(([k, v]) => (
                  <div key={k} className="contents">
                    <dt className="text-muted-foreground">{k}</dt>
                    <dd className="text-right font-medium">{v}</dd>
                  </div>
                ))}
              </dl>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Moves</CardTitle>
            </CardHeader>
            <CardContent>
              <MoveHistory
                history={replay.history}
                displayedPly={replay.displayedPly}
                onSelect={(p) => {
                  setAutoplay(false)
                  replay.goTo(p)
                }}
                className="h-72"
              />
            </CardContent>
          </Card>
        </aside>
      </div>
    </PageContainer>
  )
}

function PlayerLine({ player, you }: { player: GameRecord['opponent']; you: boolean }) {
  return (
    <div className="flex items-center gap-2.5 text-sm">
      <UserAvatar player={player} size="sm" />
      <span className="font-medium">{player.username}</span>
      {you && <span className="text-xs text-muted-foreground">(you)</span>}
      {player.rating > 0 && <span className="tabular text-xs text-muted-foreground">{player.rating}</span>}
    </div>
  )
}

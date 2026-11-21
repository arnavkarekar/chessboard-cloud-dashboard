import { useState } from 'react'
import { Download, Flag, FlipVertical2, Handshake, Pause, Play, Plus, Repeat, RotateCcw, Undo2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Tooltip } from '@/components/ui/tooltip'
import { ConfirmationDialog } from '@/components/common/ConfirmationDialog'
import { useGameSession } from '@/context/GameSessionContext'
import { useAccount } from '@/context/AccountContext'
import { buildPgn, COLOR_NAME, fileSafe, pgnResultToken, TERMINATION_LABELS } from '@/lib/chess'
import { downloadTextFile } from '@/lib/utils'

type Confirm = 'new' | 'restart' | 'resign' | 'draw' | null

export function GameControls() {
  const s = useGameSession()
  const { profile } = useAccount()
  const [confirm, setConfirm] = useState<Confirm>(null)
  const { session, outcome, game } = s
  const inProgress = !!session && !outcome
  const hasMoves = game.history.length > 0
  const mode = session?.config.mode

  const exportPgn = () => {
    if (!session) return
    const userColor = mode === 'local' ? 'w' : session.userColor
    const white = userColor === 'w' ? profile : session.opponent
    const black = userColor === 'w' ? session.opponent : profile
    const pgn = buildPgn(game.chess.history(), {
      event: mode === 'online' ? 'Online game (simulated)' : mode === 'ai' ? 'Mock AI game' : 'Local game',
      date: new Date(session.startedAt),
      white: white.username,
      black: black.username,
      timeControl: session.config.timeControl,
      result: pgnResultToken(outcome),
      termination: outcome ? TERMINATION_LABELS[outcome.reason] : undefined,
    })
    downloadTextFile(`${fileSafe(`${white.username}_vs_${black.username}`)}.pgn`, pgn)
    toast.success('PGN downloaded')
  }

  const resignLabel = mode === 'local' ? `Resign as ${COLOR_NAME[game.turn]}` : 'Resign'

  return (
    <>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        <Button variant="outline" onClick={() => (inProgress && hasMoves ? setConfirm('new') : s.modals.openCreate())}>
          <Plus /> New game
        </Button>
        <Button variant="outline" disabled={!session} onClick={() => setConfirm('restart')}>
          <RotateCcw /> Restart
        </Button>
        <Button variant="outline" onClick={s.flip}>
          <FlipVertical2 /> Flip board
        </Button>
        <Tooltip content={mode === 'online' ? 'Undo is only available in local and mock AI practice games' : 'Take back the last move'}>
          <span className="inline-flex">
            <Button variant="outline" className="w-full" disabled={!s.canUndo} onClick={s.undo}>
              <Undo2 /> Undo
            </Button>
          </span>
        </Tooltip>
        <Tooltip content={mode === 'online' ? 'Online games cannot be paused' : 'Pause both clocks and the board'}>
          <span className="inline-flex">
            <Button variant="outline" className="w-full" disabled={!s.canPause} onClick={s.togglePause}>
              {s.paused ? <Play /> : <Pause />} {s.paused ? 'Resume' : 'Pause'}
            </Button>
          </span>
        </Tooltip>
        <Button
          variant="outline"
          disabled={!inProgress || s.drawOffer === 'pending' || !hasMoves}
          onClick={() => (mode === 'local' ? setConfirm('draw') : s.offerDraw())}
        >
          <Handshake /> {s.drawOffer === 'pending' ? 'Draw offered…' : 'Offer draw'}
        </Button>
        <Button variant="outline" className="text-destructive hover:text-destructive" disabled={!inProgress} onClick={() => setConfirm('resign')}>
          <Flag /> {resignLabel}
        </Button>
        <Button variant={outcome ? 'default' : 'outline'} disabled={!outcome} onClick={s.rematch}>
          <Repeat /> Rematch
        </Button>
        <Button variant="outline" disabled={!session || !hasMoves} onClick={exportPgn}>
          <Download /> Export PGN
        </Button>
      </div>

      <ConfirmationDialog
        open={confirm === 'new'}
        onOpenChange={(o) => !o && setConfirm(null)}
        title="Abandon the current game?"
        description="Starting a new game discards the game in progress. It will not be saved to My Games."
        confirmLabel="Set up new game"
        destructive
        onConfirm={() => s.modals.openCreate()}
      />
      <ConfirmationDialog
        open={confirm === 'restart'}
        onOpenChange={(o) => !o && setConfirm(null)}
        title="Restart this game?"
        description="The board and both clocks reset to the starting position with the same settings."
        confirmLabel="Restart"
        destructive
        onConfirm={s.restart}
      />
      <ConfirmationDialog
        open={confirm === 'resign'}
        onOpenChange={(o) => !o && setConfirm(null)}
        title={mode === 'local' ? `${COLOR_NAME[game.turn]} resigns?` : 'Resign this game?'}
        description="The game ends immediately and is recorded as a loss for the resigning side."
        confirmLabel="Resign"
        destructive
        onConfirm={s.resign}
      />
      <ConfirmationDialog
        open={confirm === 'draw'}
        onOpenChange={(o) => !o && setConfirm(null)}
        title="Agree to a draw?"
        description="Both players at this device agree to end the game as a draw."
        confirmLabel="Agree to draw"
        onConfirm={s.offerDraw}
      />
    </>
  )
}

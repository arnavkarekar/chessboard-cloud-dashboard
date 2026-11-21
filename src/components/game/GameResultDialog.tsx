import { useNavigate } from 'react-router-dom'
import { BarChart3, Crown, Handshake, Plus, Repeat, ScrollText, Skull } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useGameSession } from '@/context/GameSessionContext'
import { COLOR_NAME, resultForColor, TERMINATION_LABELS } from '@/lib/chess'
import { cn } from '@/lib/utils'

export function GameResultDialog() {
  const { outcome, session, modals, rematch, lastRecordId, game } = useGameSession()
  const navigate = useNavigate()
  if (!outcome || !session) return null

  const local = session.config.mode === 'local'
  const result = resultForColor(outcome, session.userColor)
  const title =
    outcome.winner === null ? 'Draw' : local ? `${COLOR_NAME[outcome.winner]} wins` : result === 'win' ? 'You won!' : 'You lost'
  const Icon = outcome.winner === null ? Handshake : local || result === 'win' ? Crown : Skull
  const close = () => modals.setResultOpen(false)

  return (
    <Dialog open={modals.resultOpen} onOpenChange={modals.setResultOpen}>
      <DialogContent className="max-w-sm text-center">
        <DialogHeader className="items-center pr-0">
          <span
            className={cn(
              'mb-1 flex size-14 items-center justify-center rounded-full',
              outcome.winner === null ? 'bg-muted text-foreground' : result === 'win' || local ? 'bg-success/15 text-success' : 'bg-destructive/12 text-destructive',
            )}
          >
            <Icon className="size-7" />
          </span>
          <DialogTitle className="text-2xl">{title}</DialogTitle>
          <DialogDescription>
            {TERMINATION_LABELS[outcome.reason]} · {Math.ceil(game.history.length / 2)} moves vs {session.opponent.username}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-2">
          <Button onClick={() => (close(), rematch())}>
            <Repeat /> Rematch
          </Button>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" onClick={() => (close(), modals.openCreate())}>
              <Plus /> New game
            </Button>
            <Button variant="outline" onClick={() => (close(), navigate(`/analysis?game=${lastRecordId}`))} disabled={!lastRecordId}>
              <BarChart3 /> Analyze
            </Button>
          </div>
          <Button variant="ghost" onClick={() => (close(), navigate(`/games/${lastRecordId}`))} disabled={!lastRecordId}>
            <ScrollText /> View game record
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

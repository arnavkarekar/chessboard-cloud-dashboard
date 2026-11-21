import { useState } from 'react'
import { Check, Copy, Link2, Loader2, Play, UserPlus } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { SimulationBadge } from '@/components/common/SimulationBadge'
import { UserAvatar } from '@/components/common/UserAvatar'
import { useGameSession } from '@/context/GameSessionContext'
import { useAccount } from '@/context/AccountContext'
import { COLOR_NAME, timeControlCategory } from '@/lib/chess'
import { copyToClipboard } from '@/lib/utils'

export function GameLobby() {
  const { lobby, cancelLobby, simulateOpponentJoin, startFromLobby } = useGameSession()
  const { profile } = useAccount()
  const [copied, setCopied] = useState<'code' | 'link' | null>(null)

  if (!lobby) return null
  const link = `${window.location.origin}/play?join=${lobby.code}`

  const copy = async (what: 'code' | 'link') => {
    const ok = await copyToClipboard(what === 'code' ? lobby.code : link)
    if (ok) {
      setCopied(what)
      toast.success(what === 'code' ? 'Game code copied' : 'Simulated invitation link copied')
      setTimeout(() => setCopied(null), 1500)
    } else toast.error('Clipboard is unavailable in this browser')
  }

  const tc = lobby.config.timeControl

  return (
    <Dialog open onOpenChange={(o) => !o && cancelLobby()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <DialogTitle>{lobby.role === 'host' ? 'Invite an opponent' : 'Game lobby'}</DialogTitle>
            <SimulationBadge />
          </div>
          <DialogDescription>
            {tc.label} · {timeControlCategory(tc)} · You play {COLOR_NAME[lobby.userColor]}
            {lobby.config.physicalBoard && ' · Physical board'}
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-xl border bg-muted/40 p-4 text-center">
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Game code</p>
          <p className="mt-1 font-mono text-3xl font-bold tracking-[0.35em]">{lobby.code}</p>
          <div className="mt-3 flex justify-center gap-2">
            <Button size="sm" variant="outline" onClick={() => copy('code')}>
              {copied === 'code' ? <Check /> : <Copy />} Copy code
            </Button>
            <Button size="sm" variant="outline" onClick={() => copy('link')}>
              {copied === 'link' ? <Check /> : <Link2 />} Copy link
            </Button>
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground">The link only pre-fills the join form in this browser.</p>
        </div>

        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
          <div className="flex flex-col items-center gap-1.5 text-center">
            <UserAvatar player={profile} size="lg" />
            <span className="text-sm font-medium">{profile.username}</span>
            <Badge variant="secondary">{COLOR_NAME[lobby.userColor]}</Badge>
          </div>
          <span className="text-sm font-semibold text-muted-foreground">vs</span>
          <div className="flex flex-col items-center gap-1.5 text-center">
            {lobby.opponent ? (
              <>
                <UserAvatar player={lobby.opponent} size="lg" />
                <span className="text-sm font-medium">{lobby.opponent.username}</span>
                <Badge variant="success">Connected · {lobby.opponent.rating}</Badge>
              </>
            ) : (
              <>
                <span className="flex size-12 items-center justify-center rounded-full border-2 border-dashed">
                  <Loader2 className="size-5 animate-spin text-muted-foreground" />
                </span>
                <span className="text-sm text-muted-foreground">{lobby.status === 'joining' ? 'Connecting…' : 'Waiting for opponent…'}</span>
              </>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={cancelLobby}>
            {lobby.role === 'host' ? 'Cancel game' : 'Leave lobby'}
          </Button>
          {lobby.status === 'ready' ? (
            <Button onClick={startFromLobby}>
              <Play /> Start game
            </Button>
          ) : (
            <Button variant="secondary" onClick={simulateOpponentJoin} disabled={lobby.status === 'joining'}>
              {lobby.status === 'joining' ? <Loader2 className="animate-spin" /> : <UserPlus />} Simulate opponent joining
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

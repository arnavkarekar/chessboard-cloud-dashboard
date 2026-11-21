import { useEffect, useState } from 'react'
import { Loader2, LogIn } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { SimulationNotice } from '@/components/common/SimulationBadge'
import { DEMO_GAME_CODE, useGameSession } from '@/context/GameSessionContext'
import { normalizeGameCode } from '@/lib/chess'

export function JoinGameModal() {
  const { modals, joinGame, hostedCodes } = useGameSession()
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (modals.joinOpen) {
      setCode(modals.joinPrefill)
      setError(null)
      setLoading(false)
    }
  }, [modals.joinOpen, modals.joinPrefill])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const res = await joinGame(code)
    setLoading(false)
    if (!res.ok) setError(res.error)
  }

  const suggestions = [...hostedCodes.slice(-3), DEMO_GAME_CODE]

  return (
    <Dialog open={modals.joinOpen} onOpenChange={modals.setJoinOpen}>
      <DialogContent className="max-w-md">
        <form onSubmit={submit} className="grid gap-4">
          <DialogHeader>
            <DialogTitle>Join a game</DialogTitle>
            <DialogDescription>Enter the six-character code from an invitation.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-2">
            <Label htmlFor="join-code">Game code</Label>
            <Input
              id="join-code"
              autoFocus
              autoComplete="off"
              maxLength={7}
              placeholder="e.g. K7RQ2M"
              value={code}
              onChange={(e) => {
                setCode(normalizeGameCode(e.target.value).slice(0, 6))
                setError(null)
              }}
              aria-invalid={!!error}
              aria-describedby="join-help"
              className="h-12 text-center font-mono text-xl tracking-[0.4em] uppercase"
            />
            {error ? (
              <p id="join-help" role="alert" className="text-sm text-destructive">
                {error}
              </p>
            ) : (
              <p id="join-help" className="text-xs text-muted-foreground">
                Letters A–Z (except I and O) and digits 2–9.
              </p>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            Try:
            {suggestions.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCode(c)}
                className="rounded-md border bg-muted px-2 py-1 font-mono text-foreground transition hover:border-primary"
              >
                {c}
                {c === DEMO_GAME_CODE ? ' (demo)' : ''}
              </button>
            ))}
          </div>
          <SimulationNotice>
            Codes only resolve to mock games created in this browser session. Joining does not connect to another device.
          </SimulationNotice>
          <DialogFooter>
            <Button variant="outline" onClick={() => modals.setJoinOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={code.length === 0 || loading}>
              {loading ? <Loader2 className="animate-spin" /> : <LogIn />} Join game
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

import { useEffect, useState } from 'react'
import { Bot, Cpu, Globe, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioCard, RadioGroup } from '@/components/ui/misc'
import { Switch } from '@/components/ui/switch'
import { SimulationNotice } from '@/components/common/SimulationBadge'
import { defaultConfig, useGameSession } from '@/context/GameSessionContext'
import { useSettings } from '@/context/SettingsContext'
import { customTimeControl, DIFFICULTY_LABELS, getTimeControl, TIME_CONTROLS } from '@/lib/chess'
import type { AiDifficulty, ColorChoice, GameConfig, GameMode } from '@/types/game'
import { cn } from '@/lib/utils'

const MODES: { id: GameMode; label: string; description: string; icon: typeof Globe }[] = [
  { id: 'online', label: 'Online', description: 'Simulated remote opponent', icon: Globe },
  { id: 'local', label: 'Local two-player', description: 'Share this device', icon: Users },
  { id: 'ai', label: 'Mock AI', description: 'Local practice opponent', icon: Bot },
]

export function CreateGameModal() {
  const { modals, createGame, session, outcome, game } = useGameSession()
  const { settings } = useSettings()
  const [config, setConfig] = useState<GameConfig>(() => defaultConfig(settings.defaultTimeControlId))
  const [tcId, setTcId] = useState<string>(settings.defaultTimeControlId)
  const [customMin, setCustomMin] = useState('7')
  const [customInc, setCustomInc] = useState('3')

  useEffect(() => {
    if (!modals.createOpen) return
    const base = { ...defaultConfig(settings.defaultTimeControlId), ...modals.createPreset }
    setConfig(base)
    setTcId(TIME_CONTROLS.some((t) => t.id === base.timeControl.id) ? base.timeControl.id : 'custom')
  }, [modals.createOpen, modals.createPreset, settings.defaultTimeControlId])

  const minutes = Number(customMin)
  const increment = Number(customInc)
  const customError =
    tcId === 'custom' &&
    (!Number.isFinite(minutes) || minutes < 1 || minutes > 180 || !Number.isInteger(increment) || increment < 0 || increment > 60)

  const set = <K extends keyof GameConfig>(key: K, value: GameConfig[K]) => setConfig((c) => ({ ...c, [key]: value }))
  const abandoning = !!session && !outcome && game.history.length > 0

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (customError) return
    const timeControl = tcId === 'custom' ? customTimeControl(minutes, increment) : getTimeControl(tcId)
    createGame({ ...config, timeControl })
  }

  return (
    <Dialog open={modals.createOpen} onOpenChange={modals.setCreateOpen}>
      <DialogContent className="max-w-xl">
        <form onSubmit={submit} className="grid gap-5">
          <DialogHeader>
            <DialogTitle>Create a game</DialogTitle>
            <DialogDescription>Choose how you want to play. Everything runs locally in this browser.</DialogDescription>
          </DialogHeader>

          <fieldset className="grid gap-2">
            <legend className="mb-2 text-sm font-medium">Game mode</legend>
            <RadioGroup value={config.mode} onValueChange={(v) => set('mode', v as GameMode)} className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              {MODES.map((m) => (
                <RadioCard key={m.id} value={m.id} className="flex-col items-start gap-1 px-3 py-3 text-left">
                  <span className="flex items-center gap-2">
                    <m.icon className="size-4" /> {m.label}
                  </span>
                  <span className="text-xs font-normal text-muted-foreground">{m.description}</span>
                </RadioCard>
              ))}
            </RadioGroup>
          </fieldset>

          {config.mode === 'online' && (
            <SimulationNotice>
              Online play is <strong>simulated</strong>. A game code is generated locally and a mock opponent “joins” when you
              click the demo button. No other device or browser can connect.
            </SimulationNotice>
          )}

          <fieldset className="grid gap-2" disabled={config.mode === 'local'}>
            <legend className="mb-2 text-sm font-medium">
              Your pieces{' '}
              {config.mode === 'local' && <span className="font-normal text-muted-foreground">— both players share the board</span>}
            </legend>
            <RadioGroup
              value={config.mode === 'local' ? 'white' : config.colorChoice}
              onValueChange={(v) => set('colorChoice', v as ColorChoice)}
              className="grid grid-cols-3 gap-2"
            >
              <RadioCard value="white" disabled={config.mode === 'local'}>
                <span className="size-3 rounded-full bg-white ring-1 ring-black/25" /> White
              </RadioCard>
              <RadioCard value="black" disabled={config.mode === 'local'}>
                <span className="size-3 rounded-full bg-neutral-900 ring-1 ring-white/25" /> Black
              </RadioCard>
              <RadioCard value="random" disabled={config.mode === 'local'}>
                <span className="size-3 rounded-full bg-gradient-to-r from-white from-50% to-neutral-900 to-50% ring-1 ring-black/25" /> Random
              </RadioCard>
            </RadioGroup>
          </fieldset>

          <fieldset className="grid gap-2">
            <legend className="mb-2 text-sm font-medium">Time control</legend>
            <RadioGroup value={tcId} onValueChange={setTcId} className="grid grid-cols-3 gap-2 sm:grid-cols-6">
              {TIME_CONTROLS.map((t) => (
                <RadioCard key={t.id} value={t.id} className="px-2">
                  {t.label}
                </RadioCard>
              ))}
              <RadioCard value="custom" className="px-2">
                Custom
              </RadioCard>
            </RadioGroup>
            {tcId === 'custom' && (
              <div className="mt-1 grid grid-cols-2 gap-3">
                <div className="grid gap-1.5">
                  <Label htmlFor="custom-min">Minutes per side</Label>
                  <Input id="custom-min" type="number" min={1} max={180} value={customMin} onChange={(e) => setCustomMin(e.target.value)} aria-invalid={customError} />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="custom-inc">Increment (seconds)</Label>
                  <Input id="custom-inc" type="number" min={0} max={60} value={customInc} onChange={(e) => setCustomInc(e.target.value)} aria-invalid={customError} />
                </div>
                {customError && <p className="col-span-2 text-xs text-destructive">Use 1–180 minutes and a whole-number increment of 0–60 seconds.</p>}
              </div>
            )}
          </fieldset>

          {config.mode === 'ai' && (
            <fieldset className="grid gap-2">
              <legend className="mb-2 text-sm font-medium">Mock AI difficulty</legend>
              <RadioGroup value={config.aiDifficulty} onValueChange={(v) => set('aiDifficulty', v as AiDifficulty)} className="grid grid-cols-3 gap-2">
                {(Object.keys(DIFFICULTY_LABELS) as AiDifficulty[]).map((d) => (
                  <RadioCard key={d} value={d}>
                    <Cpu className="size-4" /> {DIFFICULTY_LABELS[d]}
                  </RadioCard>
                ))}
              </RadioGroup>
              <p className="text-xs text-muted-foreground">
                Simulated difficulty only: Beginner plays random moves, Intermediate grabs material, Advanced looks two moves ahead.
                This is not a real chess engine.
              </p>
            </fieldset>
          )}

          <div className="flex items-center justify-between gap-4 rounded-lg border p-3">
            <div>
              <Label htmlFor="physical-board">Use physical board</Label>
              <p className="mt-1 text-xs text-muted-foreground">Mirror moves on the simulated board in My Chessboard (visual only).</p>
            </div>
            <Switch id="physical-board" checked={config.physicalBoard} onCheckedChange={(v) => set('physicalBoard', v)} />
          </div>

          {abandoning && <p className={cn('text-sm text-warning')}>A game is in progress. Creating a new one discards it.</p>}

          <DialogFooter>
            <Button variant="outline" onClick={() => modals.setCreateOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={customError}>
              {config.mode === 'online' ? 'Create & invite' : 'Start game'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

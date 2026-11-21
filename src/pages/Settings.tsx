import { useState, type ReactNode } from 'react'
import { Bell, Cpu, Gamepad2, Palette, RotateCcw } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioCard, RadioGroup } from '@/components/ui/misc'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { PageContainer } from '@/components/layout/PageContainer'
import { ConfirmationDialog } from '@/components/common/ConfirmationDialog'
import { SimulationBadge } from '@/components/common/SimulationBadge'
import { useSettings } from '@/context/SettingsContext'
import { BOARD_THEMES, PIECE_SETS, PIECE_STYLES } from '@/lib/boardThemes'
import { TIME_CONTROLS } from '@/lib/chess'
import { playSound } from '@/lib/sound'
import type { BoardThemeId, MovementSpeed, OrientationPreference, PieceStyleId, Settings, ThemePreference } from '@/types/settings'
import { cn } from '@/lib/utils'

function Section({ icon: Icon, title, description, children, badge }: { icon: typeof Bell; title: string; description: string; children: ReactNode; badge?: ReactNode }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Icon className="size-4 text-primary" />
          <CardTitle>{title}</CardTitle>
          {badge}
        </div>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="divide-y">{children}</CardContent>
    </Card>
  )
}

function Row({ label, description, htmlFor, children }: { label: string; description?: string; htmlFor?: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
      <div className="space-y-0.5">
        <Label htmlFor={htmlFor}>{label}</Label>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  )
}

export default function SettingsPage() {
  const { settings, update, reset } = useSettings()
  const [confirmReset, setConfirmReset] = useState(false)
  const [boardName, setBoardName] = useState(settings.boardName)

  const toggle = (key: keyof Settings, label: string) => (
    <Switch id={key} checked={settings[key] as boolean} onCheckedChange={(v) => update(key, v as never)} aria-label={label} />
  )

  const saveBoardName = () => {
    const name = boardName.trim()
    if (name.length < 2) {
      toast.error('Board name must be at least 2 characters')
      setBoardName(settings.boardName)
      return
    }
    if (name !== settings.boardName) {
      update('boardName', name)
      toast.success(`Board renamed to “${name}”`)
    }
  }

  return (
    <PageContainer
      title="Settings"
      description="Preferences are stored in this browser (localStorage)."
      actions={
        <Button variant="outline" onClick={() => setConfirmReset(true)}>
          <RotateCcw /> Reset to defaults
        </Button>
      }
    >
      <div className="grid gap-6 xl:grid-cols-2">
        <Section icon={Palette} title="Appearance" description="Theme, board, and piece styling.">
          <Row label="Theme">
            <RadioGroup value={settings.theme} onValueChange={(v) => update('theme', v as ThemePreference)} className="grid grid-cols-3 gap-2">
              <RadioCard value="light">Light</RadioCard>
              <RadioCard value="dark">Dark</RadioCard>
              <RadioCard value="system">System</RadioCard>
            </RadioGroup>
          </Row>
          <div className="space-y-3 py-4">
            <Label>Board colors</Label>
            <RadioGroup value={settings.boardTheme} onValueChange={(v) => update('boardTheme', v as BoardThemeId)} className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {(Object.keys(BOARD_THEMES) as BoardThemeId[]).map((id) => {
                const t = BOARD_THEMES[id]
                return (
                  <RadioCard key={id} value={id} className="flex-col gap-2 p-2">
                    <span className="grid size-12 grid-cols-2 overflow-hidden rounded-md">
                      <span style={{ background: t.light }} />
                      <span style={{ background: t.dark }} />
                      <span style={{ background: t.dark }} />
                      <span style={{ background: t.light }} />
                    </span>
                    <span className="text-xs">{t.name}</span>
                  </RadioCard>
                )
              })}
            </RadioGroup>
          </div>
          <div className="space-y-3 py-4">
            <Label>Piece style</Label>
            <RadioGroup value={settings.pieceStyle} onValueChange={(v) => update('pieceStyle', v as PieceStyleId)} className="grid grid-cols-3 gap-2">
              {(Object.keys(PIECE_STYLES) as PieceStyleId[]).map((id) => (
                <RadioCard key={id} value={id} className="flex-col gap-1 p-2">
                  <span className={cn('flex gap-0.5 rounded-md p-1')} style={{ background: BOARD_THEMES[settings.boardTheme].dark }}>
                    <span className="size-8">{PIECE_SETS[id].wN?.()}</span>
                    <span className="size-8">{PIECE_SETS[id].bQ?.()}</span>
                  </span>
                  <span className="text-xs">{PIECE_STYLES[id]}</span>
                </RadioCard>
              ))}
            </RadioGroup>
          </div>
          <Row label="Animations" description="Piece movement and interface transitions." htmlFor="animations">
            {toggle('animations', 'Animations')}
          </Row>
        </Section>

        <Section icon={Gamepad2} title="Gameplay" description="Defaults used when creating and playing games.">
          <Row label="Default time control" htmlFor="default-tc">
            <Select value={settings.defaultTimeControlId} onValueChange={(v) => update('defaultTimeControlId', v)}>
              <SelectTrigger id="default-tc" className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIME_CONTROLS.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Row>
          <Row label="Default board orientation" description="“Auto” shows your color at the bottom." htmlFor="default-orient">
            <Select value={settings.defaultOrientation} onValueChange={(v) => update('defaultOrientation', v as OrientationPreference)}>
              <SelectTrigger id="default-orient" className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">Auto</SelectItem>
                <SelectItem value="white">White at bottom</SelectItem>
                <SelectItem value="black">Black at bottom</SelectItem>
              </SelectContent>
            </Select>
          </Row>
          <Row label="Highlight legal moves" description="Show destination dots after selecting a piece." htmlFor="highlightLegalMoves">
            {toggle('highlightLegalMoves', 'Highlight legal moves')}
          </Row>
          <Row label="Confirm moves" description="Ask for confirmation before each move is played." htmlFor="confirmMoves">
            {toggle('confirmMoves', 'Confirm moves')}
          </Row>
          <Row label="Sound effects" description="Move, capture, check, and game-end sounds." htmlFor="sound">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => playSound('move')} disabled={!settings.sound}>
                Test
              </Button>
              {toggle('sound', 'Sound effects')}
            </div>
          </Row>
        </Section>

        <Section icon={Bell} title="Notifications" description="In-app toast notifications for simulated events." badge={<SimulationBadge label="Mock events" />}>
          <Row label="Game invitations" description="When a simulated opponent joins your lobby." htmlFor="notifyInvitations">
            {toggle('notifyInvitations', 'Game invitations')}
          </Row>
          <Row label="Turn notifications" description="When an opponent moves while you're on another page." htmlFor="notifyTurn">
            {toggle('notifyTurn', 'Turn notifications')}
          </Row>
          <Row label="Device status alerts" description="When the simulated board disconnects or reconnects." htmlFor="notifyDeviceStatus">
            {toggle('notifyDeviceStatus', 'Device status alerts')}
          </Row>
        </Section>

        <Section icon={Cpu} title="Chessboard preferences" description="Settings for the simulated physical board." badge={<SimulationBadge />}>
          <Row label="Board name" htmlFor="boardName">
            <form
              onSubmit={(e) => {
                e.preventDefault()
                saveBoardName()
              }}
              className="flex gap-2"
            >
              <Input id="boardName" value={boardName} maxLength={32} onChange={(e) => setBoardName(e.target.value)} onBlur={saveBoardName} className="w-48" />
            </form>
          </Row>
          <Row label="Automatic movement" description="Gantry reproduces opponent moves on the simulated board." htmlFor="autoMovement">
            {toggle('autoMovement', 'Automatic movement')}
          </Row>
          <Row label="LED highlights" description="Highlight the last move's squares on the occupancy grid." htmlFor="ledHighlights">
            {toggle('ledHighlights', 'LED highlights')}
          </Row>
          <Row label="Simulated movement speed" htmlFor="movementSpeed">
            <Select value={settings.movementSpeed} onValueChange={(v) => update('movementSpeed', v as MovementSpeed)}>
              <SelectTrigger id="movementSpeed" className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="slow">Slow</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="fast">Fast</SelectItem>
              </SelectContent>
            </Select>
          </Row>
        </Section>
      </div>

      <ConfirmationDialog
        open={confirmReset}
        onOpenChange={setConfirmReset}
        title="Reset all settings?"
        description="Every preference on this page returns to its default value."
        confirmLabel="Reset settings"
        destructive
        onConfirm={() => {
          reset()
          setBoardName('Study Board')
          toast.success('Settings reset to defaults')
        }}
      />
    </PageContainer>
  )
}

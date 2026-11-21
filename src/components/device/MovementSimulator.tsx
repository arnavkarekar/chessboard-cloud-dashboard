import { Home, Magnet, Move, Square } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/misc'
import { SimulationNotice } from '@/components/common/SimulationBadge'
import { useDevice } from '@/context/DeviceContext'
import { useSettings } from '@/context/SettingsContext'
import { BOARD_MM } from '@/hooks/useDeviceSimulator'
import type { MovementStatus } from '@/types/device'

const STATUS_META: Record<MovementStatus, { label: string; variant: 'secondary' | 'warning' | 'success' | 'destructive' }> = {
  idle: { label: 'Idle', variant: 'secondary' },
  homing: { label: 'Homing…', variant: 'warning' },
  moving: { label: 'Moving…', variant: 'success' },
  stopped: { label: 'Stopped', variant: 'destructive' },
}

export function MovementSimulator() {
  const { state, homeGantry, startTestMovement, stopMovement, toggleMagnet } = useDevice()
  const { settings } = useSettings()
  const g = state.gantry
  const busy = g.status === 'moving' || g.status === 'homing'
  const offline = !state.online

  return (
    <Card>
      <CardHeader>
        <CardTitle>Movement simulation</CardTitle>
        <CardDescription>Core-XY gantry with an electromagnet carriage (virtual model).</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <SimulationNotice>These controls only animate a virtual model. No motors, magnets, or hardware are controlled.</SimulationNotice>

        <div className="grid grid-cols-2 gap-3">
          {(['x', 'y'] as const).map((axis) => (
            <div key={axis} className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground uppercase">{axis}-axis</p>
              <p className="tabular font-mono text-xl font-semibold">{g[axis].toFixed(1)} mm</p>
              <Progress value={(g[axis] / BOARD_MM) * 100} className="mt-2 h-1.5" />
            </div>
          ))}
        </div>

        <dl className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-3">
          <div className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2 sm:flex-col sm:items-start sm:gap-1">
            <dt className="text-muted-foreground">Electromagnet</dt>
            <dd>
              <Badge variant={g.magnetOn ? 'warning' : 'secondary'}>
                <Magnet /> {g.magnetOn ? 'On' : 'Off'}
              </Badge>
            </dd>
          </div>
          <div className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2 sm:flex-col sm:items-start sm:gap-1">
            <dt className="text-muted-foreground">Homing</dt>
            <dd>
              <Badge variant={g.homed ? 'success' : 'secondary'}>{g.homed ? 'Homed' : 'Not homed'}</Badge>
            </dd>
          </div>
          <div className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2 sm:flex-col sm:items-start sm:gap-1">
            <dt className="text-muted-foreground">Movement</dt>
            <dd>
              <Badge variant={STATUS_META[g.status].variant}>{STATUS_META[g.status].label}</Badge>
            </dd>
          </div>
        </dl>
        {g.targetLabel && <p className="text-xs text-muted-foreground">Target: {g.targetLabel} · speed: {settings.movementSpeed}</p>}

        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" onClick={homeGantry} disabled={busy || offline}>
            <Home /> Home gantry (sim)
          </Button>
          <Button variant="outline" onClick={startTestMovement} disabled={busy || offline}>
            <Move /> Test movement (sim)
          </Button>
          <Button variant="outline" onClick={stopMovement} disabled={!busy} className="text-destructive hover:text-destructive">
            <Square /> Stop movement (sim)
          </Button>
          <Button variant="outline" onClick={toggleMagnet} disabled={offline}>
            <Magnet /> Toggle magnet (sim)
          </Button>
        </div>
        {offline && <p className="text-xs text-destructive">The simulated board is offline. Reconnect it to use movement controls.</p>}
      </CardContent>
    </Card>
  )
}

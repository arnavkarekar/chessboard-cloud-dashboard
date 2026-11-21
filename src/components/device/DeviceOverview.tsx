import { Cpu, HardDrive, Loader2, Plug, RefreshCw, Unplug, Wifi, WifiOff } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { SimulationBadge } from '@/components/common/SimulationBadge'
import { useDevice } from '@/context/DeviceContext'
import type { ComponentStatus } from '@/types/device'
import { cn, formatDateTime, formatRelative } from '@/lib/utils'

const STATUS_VARIANT: Record<ComponentStatus, 'success' | 'destructive' | 'warning' | 'secondary'> = {
  online: 'success',
  offline: 'destructive',
  busy: 'warning',
  error: 'destructive',
}

function BoardIllustration({ online }: { online: boolean }) {
  return (
    <div className="relative aspect-square w-full max-w-44 rounded-xl bg-gradient-to-br from-amber-900 to-amber-950 p-2.5 shadow-lg">
      <div className="grid size-full grid-cols-8 overflow-hidden rounded-md">
        {Array.from({ length: 64 }, (_, i) => {
          const dark = (Math.floor(i / 8) + i) % 2 === 1
          return <span key={i} className={dark ? 'bg-amber-700' : 'bg-amber-100'} />
        })}
      </div>
      <span
        className={cn(
          'absolute bottom-1 right-2 size-1.5 rounded-full',
          online ? 'bg-emerald-400 shadow-[0_0_6px_2px_rgba(52,211,153,0.7)]' : 'bg-red-500',
        )}
        aria-hidden
      />
    </div>
  )
}

export function DeviceOverview() {
  const { state, syncNow, setConnection } = useDevice()
  const reconnecting = state.syncing && !state.online

  const sync = async () => {
    const res = await syncNow()
    if (res.ok) toast.success('Board synchronized (simulated)')
    else toast.error(res.error)
  }

  const rows: { label: string; icon: typeof Cpu; value: React.ReactNode }[] = [
    { label: 'ESP32-S3 controller', icon: Cpu, value: <Badge className="capitalize" variant={STATUS_VARIANT[state.esp32]}>{state.esp32}</Badge> },
    { label: 'Raspberry Pi host', icon: HardDrive, value: <Badge className="capitalize" variant={STATUS_VARIANT[state.raspberryPi]}>{state.raspberryPi}</Badge> },
    {
      label: `Wi-Fi · ${state.info.wifiSsid}`,
      icon: state.online ? Wifi : WifiOff,
      value: state.wifiSignalDbm !== null ? <span className="tabular">{state.wifiSignalDbm} dBm</span> : <Badge variant="destructive">no signal</Badge>,
    },
    { label: 'Firmware', icon: Cpu, value: <span className="font-mono text-xs">{state.info.firmwareVersion}</span> },
  ]

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle>Device overview</CardTitle>
        <SimulationBadge />
      </CardHeader>
      <CardContent className="grid gap-6 sm:grid-cols-[11rem_1fr]">
        <BoardIllustration online={state.online} />
        <div className="space-y-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-xl font-semibold tracking-tight">{state.info.name}</h3>
              <Badge variant={state.online ? 'success' : 'destructive'}>{state.online ? 'Online' : 'Offline'}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {state.info.model} · S/N {state.info.serialNumber}
            </p>
          </div>
          <dl className="grid gap-2 sm:grid-cols-2">
            {rows.map((r) => (
              <div key={r.label} className="flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm">
                <dt className="flex items-center gap-2 text-muted-foreground">
                  <r.icon className="size-4" /> {r.label}
                </dt>
                <dd>{r.value}</dd>
              </div>
            ))}
          </dl>
          <p className="text-sm text-muted-foreground">
            Last synchronized <span className="font-medium text-foreground">{formatRelative(state.lastSync)}</span> ({formatDateTime(state.lastSync)})
          </p>
          <div className="flex flex-wrap gap-2">
            <Button onClick={sync} disabled={state.syncing}>
              {state.syncing ? <Loader2 className="animate-spin" /> : <RefreshCw />} Simulate sync
            </Button>
            {state.online ? (
              <Button variant="outline" onClick={() => setConnection(false)}>
                <Unplug /> Simulate connection loss
              </Button>
            ) : (
              <Button variant="outline" onClick={() => setConnection(true)} disabled={reconnecting}>
                {reconnecting ? <Loader2 className="animate-spin" /> : <Plug />} Simulate reconnect
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

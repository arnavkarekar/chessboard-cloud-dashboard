import { Link } from 'react-router-dom'
import { ArrowRight, CircuitBoard, RefreshCw, Wifi, WifiOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { SimulationBadge } from '@/components/common/SimulationBadge'
import { useDevice } from '@/context/DeviceContext'
import { cn, formatRelative } from '@/lib/utils'

export function DeviceStatusCard() {
  const { state } = useDevice()
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle>Chessboard status</CardTitle>
        <SimulationBadge />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3">
          <span className="flex size-11 items-center justify-center rounded-lg bg-muted">
            <CircuitBoard className="size-5 text-muted-foreground" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium">{state.info.name}</p>
            <p className="flex items-center gap-1.5 text-sm">
              <span className={cn('size-2 rounded-full', state.online ? 'bg-success' : 'bg-destructive')} />
              <span className={state.online ? 'text-success' : 'text-destructive'}>{state.online ? 'Connected' : 'Disconnected'}</span>
            </p>
          </div>
        </div>
        <dl className="grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-lg bg-muted/50 p-2.5">
            <dt className="flex items-center gap-1 text-xs text-muted-foreground">
              <RefreshCw className="size-3" /> Last sync
            </dt>
            <dd className="mt-0.5 font-medium">{state.syncing ? 'Syncing…' : formatRelative(state.lastSync)}</dd>
          </div>
          <div className="rounded-lg bg-muted/50 p-2.5">
            <dt className="flex items-center gap-1 text-xs text-muted-foreground">
              {state.online ? <Wifi className="size-3" /> : <WifiOff className="size-3" />} Wi-Fi
            </dt>
            <dd className="mt-0.5 font-medium">{state.wifiSignalDbm !== null ? `${state.wifiSignalDbm} dBm` : 'No signal'}</dd>
          </div>
        </dl>
        <Button asChild variant="outline" className="w-full">
          <Link to="/chessboard">
            Manage chessboard <ArrowRight />
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}

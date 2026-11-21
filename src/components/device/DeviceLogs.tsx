import { useMemo, useState } from 'react'
import { AlertTriangle, CheckCircle2, Info, ScrollText, Trash2, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { EmptyState } from '@/components/common/EmptyState'
import { ConfirmationDialog } from '@/components/common/ConfirmationDialog'
import { useDevice } from '@/context/DeviceContext'
import type { DeviceLogType, LogLevel } from '@/types/device'
import { cn, formatTime } from '@/lib/utils'

const TYPE_LABELS: Record<DeviceLogType, string> = {
  'piece-detected': 'Piece detected',
  'move-received': 'Move received',
  'motor-started': 'Motor started',
  'motor-completed': 'Motor completed',
  magnet: 'Electromagnet',
  sync: 'Synchronization',
  connection: 'Connection',
}

const LEVEL_META: Record<LogLevel, { icon: typeof Info; className: string }> = {
  info: { icon: Info, className: 'text-muted-foreground' },
  success: { icon: CheckCircle2, className: 'text-success' },
  warning: { icon: AlertTriangle, className: 'text-warning' },
  error: { icon: XCircle, className: 'text-destructive' },
}

export function DeviceLogs() {
  const { state, clearLogs } = useDevice()
  const [type, setType] = useState<DeviceLogType | 'all'>('all')
  const [level, setLevel] = useState<LogLevel | 'all'>('all')
  const [confirm, setConfirm] = useState(false)

  const logs = useMemo(
    () => state.logs.filter((l) => (type === 'all' || l.type === type) && (level === 'all' || l.level === level)),
    [state.logs, type, level],
  )

  return (
    <Card>
      <CardHeader className="gap-3 sm:flex-row sm:items-center sm:justify-between">
        <CardTitle>Diagnostics log</CardTitle>
        <div className="flex flex-wrap gap-2">
          <Select value={type} onValueChange={(v) => setType(v as DeviceLogType | 'all')}>
            <SelectTrigger className="w-44" aria-label="Filter by event type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All events</SelectItem>
              {(Object.keys(TYPE_LABELS) as DeviceLogType[]).map((t) => (
                <SelectItem key={t} value={t}>
                  {TYPE_LABELS[t]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={level} onValueChange={(v) => setLevel(v as LogLevel | 'all')}>
            <SelectTrigger className="w-32" aria-label="Filter by level">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All levels</SelectItem>
              <SelectItem value="info">Info</SelectItem>
              <SelectItem value="success">Success</SelectItem>
              <SelectItem value="warning">Warning</SelectItem>
              <SelectItem value="error">Error</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => setConfirm(true)} disabled={state.logs.length === 0}>
            <Trash2 /> Clear logs
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {logs.length === 0 ? (
          <EmptyState
            icon={ScrollText}
            title={state.logs.length === 0 ? 'Log is empty' : 'No events match these filters'}
            description="Use the simulator controls or play a game with the physical board enabled to generate events."
          />
        ) : (
          <ol className="scrollbar-thin max-h-96 divide-y overflow-y-auto rounded-lg border font-mono text-xs" aria-live="polite">
            {logs.map((l) => {
              const meta = LEVEL_META[l.level]
              return (
                <li key={l.id} className="flex items-start gap-3 px-3 py-2">
                  <meta.icon className={cn('mt-0.5 size-3.5 shrink-0', meta.className)} />
                  <time className="shrink-0 text-muted-foreground tabular">{formatTime(l.timestamp)}</time>
                  <span className="hidden w-32 shrink-0 text-muted-foreground sm:inline">{TYPE_LABELS[l.type]}</span>
                  <span className="min-w-0 flex-1 break-words font-sans text-[13px]">{l.message}</span>
                </li>
              )
            })}
          </ol>
        )}
      </CardContent>
      <ConfirmationDialog
        open={confirm}
        onOpenChange={setConfirm}
        title="Clear diagnostics log?"
        description="All simulated log entries will be removed."
        confirmLabel="Clear logs"
        destructive
        onConfirm={clearLogs}
      />
    </Card>
  )
}

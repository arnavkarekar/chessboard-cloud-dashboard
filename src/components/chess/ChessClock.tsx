import { AlarmClockOff, Infinity as InfinityIcon } from 'lucide-react'
import { cn, formatClock } from '@/lib/utils'

export function ChessClock({
  enabled,
  ms,
  active,
  flagged,
  paused,
}: {
  enabled: boolean
  ms: number
  active: boolean
  flagged: boolean
  paused?: boolean
}) {
  if (!enabled) {
    return (
      <div className="flex h-10 items-center gap-1.5 rounded-lg border bg-muted/50 px-3 text-sm text-muted-foreground" aria-label="No clock">
        <InfinityIcon className="size-4" />
        <span className="hidden sm:inline">No clock</span>
      </div>
    )
  }
  const low = ms < 20_000
  return (
    <div
      role="timer"
      aria-live="off"
      aria-label={flagged ? 'Out of time' : `${formatClock(ms)} remaining`}
      className={cn(
        'tabular flex h-10 min-w-24 items-center justify-center gap-1.5 rounded-lg border px-3 font-mono text-lg font-semibold transition-colors',
        active && !paused ? 'border-transparent bg-foreground text-background shadow-md' : 'bg-muted/50 text-foreground/80',
        active && low && !flagged && 'bg-destructive text-destructive-foreground',
        flagged && 'border-destructive bg-destructive/10 text-destructive',
      )}
    >
      {flagged ? (
        <>
          <AlarmClockOff className="size-4" /> 0:00
        </>
      ) : (
        formatClock(ms)
      )}
    </div>
  )
}

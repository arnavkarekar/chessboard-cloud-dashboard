import { useMemo, useState } from 'react'
import { RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ConfirmationDialog } from '@/components/common/ConfirmationDialog'
import { useDevice } from '@/context/DeviceContext'
import { useSettings } from '@/context/SettingsContext'
import { BOARD_MM } from '@/hooks/useDeviceSimulator'
import { occupancyFromFen } from '@/lib/chess'
import { cn } from '@/lib/utils'

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']
const RANKS = [8, 7, 6, 5, 4, 3, 2, 1]

export function OccupancyGrid() {
  const { state, toggleSensor, resetBoard, ledSquares } = useDevice()
  const { settings } = useSettings()
  const [confirmReset, setConfirmReset] = useState(false)
  const expected = useMemo(() => occupancyFromFen(state.referenceFen), [state.referenceFen])

  const squares = RANKS.flatMap((r) => FILES.map((f) => `${f}${r}`))
  const mismatches = squares.filter((sq) => !!state.sensors[sq] !== !!expected[sq])
  const occupied = squares.filter((sq) => state.sensors[sq]).length
  const g = state.gantry

  return (
    <Card>
      <CardHeader>
        <CardTitle>Board state</CardTitle>
        <CardDescription>Simulated Hall-effect sensor grid. Click a square to toggle its sensor.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative mx-auto aspect-square w-full max-w-md">
          <div className="grid size-full grid-cols-8 grid-rows-8 overflow-hidden rounded-lg border">
            {squares.map((sq, i) => {
              const dark = (Math.floor(i / 8) + i) % 2 === 1
              const on = !!state.sensors[sq]
              const mismatch = on !== !!expected[sq]
              const led = settings.ledHighlights && ledSquares.includes(sq)
              return (
                <button
                  key={sq}
                  type="button"
                  onClick={() => toggleSensor(sq)}
                  aria-pressed={on}
                  aria-label={`${sq}: ${on ? 'occupied' : 'empty'}${mismatch ? ', mismatch' : ''}`}
                  className={cn(
                    'relative flex items-center justify-center transition-colors focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring',
                    dark ? 'bg-muted-foreground/25 hover:bg-muted-foreground/35' : 'bg-muted/60 hover:bg-muted',
                    mismatch && 'bg-destructive/25 hover:bg-destructive/35',
                    led && 'shadow-[inset_0_0_0_3px_rgba(56,189,248,0.85)]',
                  )}
                >
                  <span className="absolute left-0.5 top-0 font-mono text-[9px] text-muted-foreground">{sq}</span>
                  {on && <span className={cn('size-[46%] rounded-full shadow-sm', mismatch ? 'bg-destructive' : 'bg-foreground/75')} />}
                  {!on && mismatch && <span className="size-[46%] rounded-full border-2 border-dashed border-destructive" />}
                </button>
              )
            })}
          </div>
          <span
            aria-hidden
            className={cn(
              'pointer-events-none absolute size-5 -translate-x-1/2 translate-y-1/2 rounded-full border-2 transition-[left,bottom] duration-75',
              g.magnetOn ? 'border-brass bg-brass/40 shadow-[0_0_10px_2px] shadow-brass/60' : 'border-primary bg-primary/20',
            )}
            style={{ left: `${(g.x / BOARD_MM) * 100}%`, bottom: `${(g.y / BOARD_MM) * 100}%` }}
          />
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-foreground/75" /> Occupied ({occupied})
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-destructive" /> Mismatch ({mismatches.length})
          </span>
          {settings.ledHighlights && (
            <span className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-sm shadow-[inset_0_0_0_2px_rgba(56,189,248,0.9)]" /> LED highlight
            </span>
          )}
          <span className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full border-2 border-primary" /> Gantry head
          </span>
          <Button size="sm" variant="outline" className="ml-auto" onClick={() => setConfirmReset(true)}>
            <RotateCcw /> Reset to start
          </Button>
        </div>
        {mismatches.length > 0 && (
          <p className="text-sm text-destructive">
            {mismatches.length} square{mismatches.length > 1 ? 's' : ''} differ from the expected position: {mismatches.slice(0, 8).join(', ')}
            {mismatches.length > 8 ? '…' : ''}
          </p>
        )}
      </CardContent>
      <ConfirmationDialog
        open={confirmReset}
        onOpenChange={setConfirmReset}
        title="Reset simulated sensors?"
        description="All sensor states and the expected position return to the standard starting setup."
        confirmLabel="Reset sensors"
        onConfirm={resetBoard}
      />
    </Card>
  )
}

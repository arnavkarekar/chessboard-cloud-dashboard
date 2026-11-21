import { useEffect, useRef } from 'react'
import { ChevronFirst, ChevronLast, ChevronLeft, ChevronRight, Undo2 } from 'lucide-react'
import type { Move } from 'chess.js'
import { Button } from '@/components/ui/button'
import { Tooltip } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

interface MoveHistoryProps {
  history: Move[]
  displayedPly: number
  onSelect: (ply: number | null) => void
  className?: string
  emptyLabel?: string
}

/** Numbered SAN move list with history browsing controls. */
export function MoveHistory({ history, displayedPly, onSelect, className, emptyLabel = 'No moves yet' }: MoveHistoryProps) {
  const listRef = useRef<HTMLDivElement>(null)
  const viewing = displayedPly < history.length

  const startsWithBlack = history[0]?.color === 'b'
  const firstMoveNumber = history[0] ? Number(history[0].before.split(' ')[5]) || 1 : 1
  const rows: { number: number; white?: { move: Move; ply: number }; black?: { move: Move; ply: number } }[] = []
  history.forEach((move, i) => {
    const ply = i + 1
    const slot = startsWithBlack ? i + 1 : i
    const rowIndex = Math.floor(slot / 2)
    rows[rowIndex] ??= { number: firstMoveNumber + rowIndex }
    if (move.color === 'w') rows[rowIndex].white = { move, ply }
    else rows[rowIndex].black = { move, ply }
  })

  useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>('[data-current="true"]')
    if (el) el.scrollIntoView({ block: 'nearest' })
    else if (!viewing && listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight
  }, [displayedPly, history.length, viewing])

  const cell = (entry?: { move: Move; ply: number }) => {
    if (!entry) return <span className="px-2 text-muted-foreground">…</span>
    const current = entry.ply === displayedPly
    const latest = entry.ply === history.length
    return (
      <button
        type="button"
        data-current={current}
        onClick={() => onSelect(entry.ply)}
        className={cn(
          'w-full rounded px-2 py-0.5 text-left font-mono text-sm transition-colors hover:bg-accent',
          current && 'bg-primary/15 font-semibold text-primary',
          latest && !current && 'font-semibold',
        )}
        aria-label={`Go to move ${entry.move.san}`}
      >
        {entry.move.san}
      </button>
    )
  }

  return (
    <div className={cn('flex min-h-0 flex-col', className)}>
      <div ref={listRef} className="scrollbar-thin min-h-24 flex-1 overflow-y-auto rounded-lg border bg-muted/30 p-1.5">
        {history.length === 0 ? (
          <p className="px-2 py-6 text-center text-sm text-muted-foreground">{emptyLabel}</p>
        ) : (
          <ol className="grid grid-cols-[2.5rem_1fr_1fr] gap-y-0.5 text-sm">
            {rows.map((r) => (
              <li key={r.number} className="contents">
                <span className="tabular py-0.5 pl-1 text-muted-foreground">{r.number}.</span>
                {cell(r.white)}
                {r.black ? cell(r.black) : <span />}
              </li>
            ))}
          </ol>
        )}
      </div>
      <div className="mt-2 flex items-center gap-1">
        <Tooltip content="First position">
          <Button variant="outline" size="icon-sm" onClick={() => onSelect(0)} disabled={displayedPly === 0} aria-label="Jump to start">
            <ChevronFirst />
          </Button>
        </Tooltip>
        <Tooltip content="Previous move (←)">
          <Button variant="outline" size="icon-sm" onClick={() => onSelect(displayedPly - 1)} disabled={displayedPly === 0} aria-label="Previous move">
            <ChevronLeft />
          </Button>
        </Tooltip>
        <Tooltip content="Next move (→)">
          <Button variant="outline" size="icon-sm" onClick={() => onSelect(displayedPly + 1)} disabled={!viewing} aria-label="Next move">
            <ChevronRight />
          </Button>
        </Tooltip>
        <Tooltip content="Latest position">
          <Button variant="outline" size="icon-sm" onClick={() => onSelect(null)} disabled={!viewing} aria-label="Jump to end">
            <ChevronLast />
          </Button>
        </Tooltip>
        {viewing && (
          <Button size="sm" variant="secondary" className="ml-auto" onClick={() => onSelect(null)}>
            <Undo2 /> Back to current
          </Button>
        )}
      </div>
    </div>
  )
}

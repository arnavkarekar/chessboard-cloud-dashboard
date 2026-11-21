import { mockEvaluation } from '@/lib/chess'
import { cn } from '@/lib/utils'
import type { BoardOrientation } from '@/types/game'

/** Visual eval bar driven by a material-count heuristic. Explicitly not an engine evaluation. */
export function EvaluationBar({ fen, orientation, className }: { fen: string; orientation: BoardOrientation; className?: string }) {
  const evaluation = mockEvaluation(fen)
  const whiteShare = evaluation.mate ? (evaluation.mate === 'w' ? 100 : 0) : 50 + 50 * Math.tanh(evaluation.score / 5)
  const flipped = orientation === 'black'
  return (
    <div
      className={cn('relative w-4 overflow-hidden rounded-md border bg-neutral-800 sm:w-5', className)}
      role="meter"
      aria-valuemin={-10}
      aria-valuemax={10}
      aria-valuenow={evaluation.score}
      aria-label={`Mock evaluation ${evaluation.label} (material count, not an engine)`}
    >
      <div
        className={cn('absolute inset-x-0 bg-neutral-100 transition-all duration-300', flipped ? 'top-0' : 'bottom-0')}
        style={{ height: `${whiteShare}%` }}
      />
      <span
        className={cn(
          'absolute inset-x-0 text-center text-[9px] font-bold',
          evaluation.score >= 0 ? (flipped ? 'top-1 text-neutral-800' : 'bottom-1 text-neutral-800') : flipped ? 'bottom-1 text-neutral-100' : 'top-1 text-neutral-100',
        )}
      >
        {evaluation.mate ? 'M' : Math.abs(evaluation.score).toFixed(1)}
      </span>
    </div>
  )
}

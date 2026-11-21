import { useCallback, useEffect, useRef, useState } from 'react'
import type { PieceColor } from '@/types/game'

export interface ClockTimes {
  w: number
  b: number
}

interface ClockConfig {
  initialMs: number | null
  incrementMs: number
}

/** Client-side two-sided chess clock. Time is tracked with Date.now() deltas for accuracy. */
export function useChessClock(onFlag?: (color: PieceColor) => void) {
  const [config, setConfig] = useState<ClockConfig>({ initialMs: null, incrementMs: 0 })
  const [times, setTimes] = useState<ClockTimes>({ w: 0, b: 0 })
  const [active, setActive] = useState<PieceColor | null>(null)
  const [running, setRunning] = useState(false)
  const [flagged, setFlagged] = useState<PieceColor | null>(null)

  const timesRef = useRef(times)
  const activeRef = useRef(active)
  const runningRef = useRef(running)
  const lastTickRef = useRef<number>(0)
  const onFlagRef = useRef(onFlag)
  onFlagRef.current = onFlag

  const enabled = config.initialMs !== null

  const sync = (next: ClockTimes) => {
    timesRef.current = next
    setTimes(next)
  }

  /** Commits elapsed time for the active side up to now. */
  const settle = useCallback(() => {
    const now = Date.now()
    const side = activeRef.current
    if (runningRef.current && side) {
      const elapsed = now - lastTickRef.current
      sync({ ...timesRef.current, [side]: Math.max(0, timesRef.current[side] - elapsed) })
    }
    lastTickRef.current = now
  }, [])

  useEffect(() => {
    if (!running || !enabled || !active) return
    lastTickRef.current = Date.now()
    const id = window.setInterval(() => {
      settle()
      const side = activeRef.current
      if (side && timesRef.current[side] <= 0) {
        runningRef.current = false
        setRunning(false)
        setFlagged(side)
        onFlagRef.current?.(side)
      }
    }, 100)
    return () => window.clearInterval(id)
  }, [running, enabled, active, settle])

  const reset = useCallback((initialMs: number | null, incrementMs = 0) => {
    setConfig({ initialMs, incrementMs })
    sync({ w: initialMs ?? 0, b: initialMs ?? 0 })
    activeRef.current = null
    setActive(null)
    runningRef.current = false
    setRunning(false)
    setFlagged(null)
  }, [])

  const start = useCallback((color: PieceColor = 'w') => {
    activeRef.current = color
    setActive(color)
    lastTickRef.current = Date.now()
    runningRef.current = true
    setRunning(true)
  }, [])

  /** Called after a legal move by `mover`: adds increment and hands the clock to the opponent. */
  const press = useCallback(
    (mover: PieceColor) => {
      settle()
      const next = mover === 'w' ? 'b' : 'w'
      if (config.initialMs !== null && config.incrementMs > 0) {
        sync({ ...timesRef.current, [mover]: timesRef.current[mover] + config.incrementMs })
      }
      activeRef.current = next
      setActive(next)
    },
    [config, settle],
  )

  const setTurn = useCallback(
    (color: PieceColor) => {
      settle()
      activeRef.current = color
      setActive(color)
    },
    [settle],
  )

  const pause = useCallback(() => {
    settle()
    runningRef.current = false
    setRunning(false)
  }, [settle])

  const resume = useCallback(() => {
    if (flagged) return
    lastTickRef.current = Date.now()
    runningRef.current = true
    setRunning(true)
  }, [flagged])

  return { enabled, times, active, running, flagged, config, reset, start, press, setTurn, pause, resume }
}

export type ChessClockApi = ReturnType<typeof useChessClock>

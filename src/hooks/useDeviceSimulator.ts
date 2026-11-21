import { useCallback, useEffect, useRef, useState } from 'react'
import type { DeviceLogEntry, DeviceLogType, DeviceState, GantryState, LogLevel } from '@/types/device'
import type { MovementSpeed } from '@/types/settings'
import { MOCK_DEVICE, MOCK_DEVICE_LOGS } from '@/data/mockDevices'
import { DEFAULT_POSITION, occupancyFromFen } from '@/lib/chess'
import { syncDevice } from '@/services/mockApi'
import { uid } from '@/lib/utils'

export const SQUARE_MM = 50
export const BOARD_MM = SQUARE_MM * 8
const SPEED_MM_PER_S: Record<MovementSpeed, number> = { slow: 70, normal: 150, fast: 320 }
const TICK_MS = 40

type LogInput = { type: DeviceLogType; level?: LogLevel; message: string }

interface Waypoint {
  x: number
  y: number
  /** Applied when the gantry reaches this waypoint. */
  magnet?: boolean
  log?: LogInput
  patch?: (s: DeviceState) => Partial<DeviceState>
  homed?: boolean
}

export function squareToMm(square: string) {
  const file = square.charCodeAt(0) - 97
  const rank = Number(square[1]) - 1
  return { x: file * SQUARE_MM + SQUARE_MM / 2, y: rank * SQUARE_MM + SQUARE_MM / 2 }
}

function makeLog(input: LogInput): DeviceLogEntry {
  return { id: uid('log'), timestamp: new Date().toISOString(), level: input.level ?? 'info', type: input.type, message: input.message }
}

const INITIAL_GANTRY: GantryState = { x: 0, y: 0, magnetOn: false, homed: true, status: 'idle', targetLabel: null }

export interface DeviceSimulatorOptions {
  boardName: string
  speed: MovementSpeed
  autoMovement: boolean
  onConnectionChange?: (online: boolean) => void
}

export interface GameMoveEvent {
  from: string
  to: string
  san: string
  fenAfter: string
}

export function useDeviceSimulator(options: DeviceSimulatorOptions) {
  const [state, setState] = useState<DeviceState>(() => ({
    info: { ...MOCK_DEVICE, name: options.boardName },
    online: true,
    esp32: 'online',
    raspberryPi: 'online',
    wifiSignalDbm: -58,
    lastSync: new Date(Date.now() - 12 * 60_000).toISOString(),
    syncing: false,
    sensors: occupancyFromFen(DEFAULT_POSITION),
    referenceFen: DEFAULT_POSITION,
    gantry: INITIAL_GANTRY,
    logs: [...MOCK_DEVICE_LOGS].reverse(),
  }))
  const [ledSquares, setLedSquares] = useState<string[]>([])
  const stateRef = useRef(state)
  stateRef.current = state

  const gantryRef = useRef<GantryState>(INITIAL_GANTRY)
  const queueRef = useRef<Waypoint[]>([])
  const intervalRef = useRef<number | null>(null)
  const onlineRef = useRef(true)
  const optionsRef = useRef(options)
  optionsRef.current = options

  useEffect(() => {
    setState((s) => ({ ...s, info: { ...s.info, name: options.boardName } }))
  }, [options.boardName])

  const addLogs = useCallback((inputs: LogInput[]) => {
    if (!inputs.length) return
    const entries = inputs.map(makeLog).reverse()
    setState((s) => ({ ...s, logs: [...entries, ...s.logs].slice(0, 250) }))
  }, [])

  const stopTicker = () => {
    if (intervalRef.current !== null) {
      window.clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }

  const tick = useCallback(() => {
    const g = { ...gantryRef.current }
    const logs: LogInput[] = []
    const patches: ((s: DeviceState) => Partial<DeviceState>)[] = []
    let budget = (SPEED_MM_PER_S[optionsRef.current.speed] * TICK_MS) / 1000

    while (budget > 0 && queueRef.current.length) {
      const wp = queueRef.current[0]
      const dx = wp.x - g.x
      const dy = wp.y - g.y
      const dist = Math.hypot(dx, dy)
      if (dist <= budget) {
        g.x = wp.x
        g.y = wp.y
        budget -= dist
        if (wp.magnet !== undefined) g.magnetOn = wp.magnet
        if (wp.homed !== undefined) g.homed = wp.homed
        if (wp.log) logs.push(wp.log)
        if (wp.patch) patches.push(wp.patch)
        queueRef.current.shift()
      } else {
        g.x += (dx / dist) * budget
        g.y += (dy / dist) * budget
        budget = 0
      }
    }

    if (!queueRef.current.length) {
      g.status = 'idle'
      g.targetLabel = null
      stopTicker()
    }
    gantryRef.current = g
    const entries = logs.map(makeLog).reverse()
    setState((s) => {
      let next: DeviceState = { ...s, gantry: g, logs: entries.length ? [...entries, ...s.logs].slice(0, 250) : s.logs }
      for (const p of patches) next = { ...next, ...p(next) }
      return next
    })
  }, [])

  const runQueue = useCallback(
    (waypoints: Waypoint[], status: GantryState['status'], label: string, append = false) => {
      queueRef.current = append ? [...queueRef.current, ...waypoints] : waypoints
      gantryRef.current = { ...gantryRef.current, status, targetLabel: label }
      setState((s) => ({ ...s, gantry: gantryRef.current }))
      if (intervalRef.current === null) intervalRef.current = window.setInterval(tick, TICK_MS)
    },
    [tick],
  )

  useEffect(() => stopTicker, [])

  const homeGantry = useCallback(() => {
    addLogs([{ type: 'motor-started', message: 'Motor started: homing gantry to origin (simulated)' }])
    gantryRef.current = { ...gantryRef.current, magnetOn: false }
    runQueue(
      [{ x: 0, y: 0, homed: true, log: { type: 'motor-completed', level: 'success', message: 'Motor completed: gantry homed at (0, 0)' } }],
      'homing',
      'Home (0, 0)',
    )
  }, [addLogs, runQueue])

  const startTestMovement = useCallback(() => {
    const path = ['a1', 'h1', 'h8', 'a8', 'd4', 'e5'].map(squareToMm)
    addLogs([{ type: 'motor-started', message: 'Motor started: test pattern a1 → h1 → h8 → a8 → d4 → e5 (simulated)' }])
    runQueue(
      path.map((p, i) => ({
        ...p,
        homed: false,
        log:
          i === path.length - 1
            ? { type: 'motor-completed' as const, level: 'success' as const, message: 'Motor completed: test movement finished' }
            : undefined,
      })),
      'moving',
      'Test pattern',
    )
  }, [addLogs, runQueue])

  const stopMovement = useCallback(() => {
    queueRef.current = []
    stopTicker()
    gantryRef.current = { ...gantryRef.current, status: 'stopped', magnetOn: false, targetLabel: null, homed: false }
    setState((s) => ({ ...s, gantry: gantryRef.current }))
    addLogs([{ type: 'motor-completed', level: 'warning', message: 'Movement stopped by user; electromagnet released (simulated)' }])
  }, [addLogs])

  const toggleMagnet = useCallback(() => {
    const on = !gantryRef.current.magnetOn
    gantryRef.current = { ...gantryRef.current, magnetOn: on }
    setState((s) => ({ ...s, gantry: gantryRef.current }))
    addLogs([{ type: 'magnet', message: on ? 'Electromagnet activated (simulated)' : 'Electromagnet deactivated (simulated)' }])
  }, [addLogs])

  const toggleSensor = useCallback(
    (square: string) => {
      const nowOccupied = !stateRef.current.sensors[square]
      setState((s) => ({ ...s, sensors: { ...s.sensors, [square]: nowOccupied } }))
      addLogs([{ type: 'piece-detected', message: `Piece detected: square ${square} now ${nowOccupied ? 'occupied' : 'empty'} (simulated sensor)` }])
    },
    [addLogs],
  )

  const resetBoard = useCallback(() => {
    setState((s) => ({ ...s, sensors: occupancyFromFen(DEFAULT_POSITION), referenceFen: DEFAULT_POSITION }))
    setLedSquares([])
    addLogs([{ type: 'piece-detected', level: 'success', message: 'Sensors reset to the starting position (simulated)' }])
  }, [addLogs])

  const setConnection = useCallback(
    (online: boolean) => {
      if (online === onlineRef.current) return
      if (!online) {
        onlineRef.current = false
        queueRef.current = []
        stopTicker()
        gantryRef.current = { ...gantryRef.current, status: 'stopped', magnetOn: false, targetLabel: null }
        setState((s) => ({ ...s, online: false, esp32: 'offline', wifiSignalDbm: null, gantry: gantryRef.current }))
        addLogs([{ type: 'connection', level: 'error', message: 'Connection lost: board stopped responding (simulated)' }])
        optionsRef.current.onConnectionChange?.(false)
        return
      }
      setState((s) => ({ ...s, syncing: true, esp32: 'busy' }))
      addLogs([{ type: 'connection', level: 'warning', message: 'Reconnecting to board… (simulated)' }])
      window.setTimeout(() => {
        onlineRef.current = true
        setState((s) => ({ ...s, online: true, esp32: 'online', wifiSignalDbm: -61, syncing: false, lastSync: new Date().toISOString() }))
        addLogs([
          { type: 'connection', level: 'success', message: 'Connection restored (simulated)' },
          { type: 'sync', level: 'success', message: 'Synchronization successful' },
        ])
        optionsRef.current.onConnectionChange?.(true)
      }, 1400)
    },
    [addLogs],
  )

  const syncNow = useCallback(async () => {
    setState((s) => ({ ...s, syncing: true }))
    try {
      const at = await syncDevice(onlineRef.current)
      setState((s) => ({ ...s, syncing: false, lastSync: at }))
      addLogs([{ type: 'sync', level: 'success', message: 'Synchronization successful' }])
      return { ok: true as const }
    } catch (e) {
      setState((s) => ({ ...s, syncing: false }))
      const message = e instanceof Error ? e.message : 'Sync failed'
      addLogs([{ type: 'sync', level: 'error', message: `Synchronization failed: ${message}` }])
      return { ok: false as const, error: message }
    }
  }, [addLogs])

  const clearLogs = useCallback(() => setState((s) => ({ ...s, logs: [] })), [])

  /** A move made by hand on the (simulated) physical board — sensors register it directly. */
  const registerManualMove = useCallback(
    (move: GameMoveEvent) => {
      if (!onlineRef.current) {
        addLogs([{ type: 'move-received', level: 'warning', message: `Move ${move.san} not mirrored: board offline (simulated)` }])
        return
      }
      setState((s) => ({ ...s, sensors: occupancyFromFen(move.fenAfter), referenceFen: move.fenAfter, lastSync: new Date().toISOString() }))
      setLedSquares([move.from, move.to])
      addLogs([{ type: 'piece-detected', message: `Piece detected: ${move.from} → ${move.to} (${move.san})` }])
    },
    [addLogs],
  )

  /** An opponent move sent to the board; the gantry reproduces it if automatic movement is on. */
  const receiveRemoteMove = useCallback(
    (move: GameMoveEvent) => {
      if (!onlineRef.current) {
        addLogs([{ type: 'move-received', level: 'warning', message: `Move ${move.san} queued: board offline (simulated)` }])
        return
      }
      addLogs([{ type: 'move-received', message: `Move received: ${move.from} → ${move.to} (${move.san})` }])
      setLedSquares([move.from, move.to])
      if (!optionsRef.current.autoMovement) {
        setState((s) => ({ ...s, referenceFen: move.fenAfter }))
        addLogs([{ type: 'move-received', level: 'warning', message: 'Automatic movement disabled: move the piece by hand' }])
        return
      }
      const from = squareToMm(move.from)
      const to = squareToMm(move.to)
      addLogs([{ type: 'motor-started', message: `Motor started: gantry travelling to ${move.from}` }])
      runQueue(
        [
          { ...from, magnet: true, homed: false, log: { type: 'magnet', message: `Electromagnet activated under ${move.from}` } },
          {
            ...to,
            magnet: false,
            log: { type: 'motor-completed', level: 'success', message: `Motor completed: piece placed on ${move.to}` },
            patch: () => ({ sensors: occupancyFromFen(move.fenAfter), referenceFen: move.fenAfter, lastSync: new Date().toISOString() }),
          },
        ],
        'moving',
        `${move.from} → ${move.to}`,
        gantryRef.current.status === 'moving',
      )
    },
    [addLogs, runQueue],
  )

  return {
    state,
    ledSquares,
    homeGantry,
    startTestMovement,
    stopMovement,
    toggleMagnet,
    toggleSensor,
    resetBoard,
    setConnection,
    syncNow,
    clearLogs,
    registerManualMove,
    receiveRemoteMove,
  }
}

export type DeviceSimulatorApi = ReturnType<typeof useDeviceSimulator>

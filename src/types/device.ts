export type ComponentStatus = 'online' | 'offline' | 'busy' | 'error'

export type MovementStatus = 'idle' | 'homing' | 'moving' | 'stopped'

export type DeviceLogType =
  | 'piece-detected'
  | 'move-received'
  | 'motor-started'
  | 'motor-completed'
  | 'magnet'
  | 'sync'
  | 'connection'

export type LogLevel = 'info' | 'success' | 'warning' | 'error'

export interface DeviceLogEntry {
  id: string
  timestamp: string
  type: DeviceLogType
  level: LogLevel
  message: string
}

export interface DeviceInfo {
  id: string
  name: string
  model: string
  firmwareVersion: string
  serialNumber: string
  wifiSsid: string
}

export interface GantryState {
  /** Millimetres from the home corner (a1 side). */
  x: number
  y: number
  magnetOn: boolean
  homed: boolean
  status: MovementStatus
  targetLabel: string | null
}

export interface DeviceState {
  info: DeviceInfo
  online: boolean
  esp32: ComponentStatus
  raspberryPi: ComponentStatus
  wifiSignalDbm: number | null
  lastSync: string
  syncing: boolean
  /** Sensor occupancy indexed by square name, e.g. "e4". */
  sensors: Record<string, boolean>
  /** FEN of the position the board is expected to match. */
  referenceFen: string
  gantry: GantryState
  logs: DeviceLogEntry[]
}

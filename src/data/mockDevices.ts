import type { DeviceInfo, DeviceLogEntry } from '@/types/device'

export const MOCK_DEVICE: DeviceInfo = {
  id: 'dev-001',
  name: 'Study Board',
  model: 'Smart Connected Chessboard · Prototype R2',
  firmwareVersion: 'v0.4.2-sim',
  serialNumber: 'SCB-R2-0042-SIM',
  wifiSsid: 'HomeLab-5G',
}

const minutesAgo = (m: number) => new Date(Date.now() - m * 60_000).toISOString()

export const MOCK_DEVICE_LOGS: DeviceLogEntry[] = [
  { id: 'log-1', timestamp: minutesAgo(42), type: 'connection', level: 'warning', message: 'Connection lost (Wi-Fi signal dropped below -80 dBm)' },
  { id: 'log-2', timestamp: minutesAgo(41), type: 'sync', level: 'success', message: 'Synchronization successful after reconnect' },
  { id: 'log-3', timestamp: minutesAgo(30), type: 'move-received', level: 'info', message: 'Move received: e7 → e5 (opponent)' },
  { id: 'log-4', timestamp: minutesAgo(30), type: 'motor-started', level: 'info', message: 'Motor started: gantry moving to e7' },
  { id: 'log-5', timestamp: minutesAgo(30), type: 'magnet', level: 'info', message: 'Electromagnet activated' },
  { id: 'log-6', timestamp: minutesAgo(29), type: 'motor-completed', level: 'success', message: 'Motor completed: piece placed on e5' },
  { id: 'log-7', timestamp: minutesAgo(28), type: 'piece-detected', level: 'info', message: 'Piece detected: lifted from g1, placed on f3' },
  { id: 'log-8', timestamp: minutesAgo(12), type: 'sync', level: 'success', message: 'Synchronization successful' },
]

export const MOCK_NOTIFICATIONS = [
  { id: 'n-1', title: 'Game invitation', body: 'tempo_tom invited you to a 10 + 0 game (mock).', minutesAgo: 6, kind: 'invite' as const },
  { id: 'n-2', title: 'Board synchronized', body: 'Study Board finished a simulated sync.', minutesAgo: 12, kind: 'device' as const },
  { id: 'n-3', title: 'Rating update', body: 'Your mock rating rose to 1548 (+8).', minutesAgo: 290, kind: 'rating' as const },
  { id: 'n-4', title: 'Weekly summary', body: 'You played 7 games this week with a 57% win rate.', minutesAgo: 1600, kind: 'summary' as const },
]

export const MOCK_ACTIVITY = [
  { id: 'a-1', kind: 'device' as const, text: 'Study Board completed a simulated synchronization', minutesAgo: 12 },
  { id: 'a-2', kind: 'rating' as const, text: 'Mock rating changed 1540 → 1548', minutesAgo: 290 },
  { id: 'a-3', kind: 'achievement' as const, text: 'Earned "Three in a row" badge (mock)', minutesAgo: 1500 },
  { id: 'a-4', kind: 'profile' as const, text: 'Updated profile bio', minutesAgo: 4300 },
  { id: 'a-5', kind: 'device' as const, text: 'Firmware v0.4.2-sim reported by Study Board', minutesAgo: 8600 },
]

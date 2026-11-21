/**
 * Mock service boundary. Every function here resolves locally after a simulated delay.
 * Replace these implementations with real API calls in a later phase; the UI only
 * depends on the function signatures.
 */
import type { GameRecord } from '@/types/game'
import type { LeaderboardEntry, UserProfile } from '@/types/player'
import { MOCK_GAMES } from '@/data/mockGames'
import { MOCK_PLAYERS } from '@/data/mockPlayers'
import { buildLeaderboard } from '@/data/mockLeaderboard'
import { sleep } from '@/lib/utils'

const LATENCY_MS = 450

export async function fetchGameHistory(): Promise<GameRecord[]> {
  await sleep(LATENCY_MS)
  return MOCK_GAMES
}

export async function fetchLeaderboard(
  current: UserProfile,
  currentStats: { wins: number; losses: number; draws: number },
): Promise<LeaderboardEntry[]> {
  await sleep(LATENCY_MS)
  return buildLeaderboard(MOCK_PLAYERS, current, currentStats)
}

export class MockApiError extends Error {}

export async function updateProfile(profile: UserProfile): Promise<UserProfile> {
  await sleep(LATENCY_MS + 200)
  const taken = MOCK_PLAYERS.some((p) => p.username.toLowerCase() === profile.username.toLowerCase())
  if (taken) throw new MockApiError(`The username "${profile.username}" is already used by a mock player.`)
  return profile
}

export async function syncDevice(online: boolean): Promise<string> {
  await sleep(900)
  if (!online) throw new MockApiError('Simulated board is offline. Reconnect it before syncing.')
  return new Date().toISOString()
}

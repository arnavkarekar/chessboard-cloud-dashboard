import type { LeaderboardEntry, Player } from '@/types/player'
import { seededRandom } from '@/lib/utils'
import { MOCK_PLAYERS } from './mockPlayers'

function statsFor(player: Player, index: number) {
  const random = seededRandom(31 + index * 97)
  const gamesPlayed = 60 + Math.floor(random() * 540)
  const strength = Math.min(0.72, Math.max(0.3, (player.rating - 1000) / 1700))
  const draws = Math.floor(gamesPlayed * (0.06 + random() * 0.1))
  const wins = Math.floor((gamesPlayed - draws) * strength)
  const losses = gamesPlayed - draws - wins
  return { gamesPlayed, wins, losses, draws, ratingChange30d: Math.round((random() - 0.4) * 60) }
}

/** Builds ranked entries for every player, including the current user. */
export function buildLeaderboard(players: Player[], current: Player, currentStats: { wins: number; losses: number; draws: number }): LeaderboardEntry[] {
  const entries = players.map((player, i) => {
    const s = statsFor(player, i)
    return { player, rank: 0, ...s, winRate: Math.round((s.wins / s.gamesPlayed) * 100) }
  })
  const games = currentStats.wins + currentStats.losses + currentStats.draws
  entries.push({
    player: current,
    rank: 0,
    ...currentStats,
    gamesPlayed: games,
    winRate: games ? Math.round((currentStats.wins / games) * 100) : 0,
    ratingChange30d: 14,
  })
  return entries
    .sort((a, b) => b.player.rating - a.player.rating)
    .map((e, i) => ({ ...e, rank: i + 1 }))
}

export { MOCK_PLAYERS }

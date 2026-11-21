export interface Player {
  id: string
  username: string
  displayName: string
  rating: number
  country: string
  /** Tailwind-free hex color used for the generated initials avatar. */
  avatarColor: string
  title?: 'GM' | 'IM' | 'FM' | 'CM'
  isBot?: boolean
}

export interface UserProfile extends Player {
  email: string
  bio: string
  createdAt: string
}

export interface LeaderboardEntry {
  player: Player
  rank: number
  wins: number
  losses: number
  draws: number
  gamesPlayed: number
  winRate: number
  ratingChange30d: number
}

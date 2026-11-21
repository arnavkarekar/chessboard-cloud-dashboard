import type { Player, UserProfile } from '@/types/player'

export const CURRENT_USER: UserProfile = {
  id: 'u-current',
  username: 'knightvision',
  displayName: 'Alex Morgan',
  rating: 1548,
  country: 'US',
  avatarColor: '#0f766e',
  email: 'alex.morgan@example.com',
  bio: 'Weekend club player building a self-moving chessboard. Fan of the Catalan and long endgames.',
  createdAt: '2025-03-12T15:20:00.000Z',
}

export const MOCK_PLAYERS: Player[] = [
  { id: 'p-01', username: 'mateinmotion', displayName: 'Priya Raman', rating: 2214, country: 'IN', avatarColor: '#7c3aed', title: 'FM' },
  { id: 'p-02', username: 'rookandroll', displayName: 'Marcus Lee', rating: 2101, country: 'US', avatarColor: '#2563eb', title: 'CM' },
  { id: 'p-03', username: 'silent_bishop', displayName: 'Elena Petrova', rating: 1987, country: 'BG', avatarColor: '#db2777' },
  { id: 'p-04', username: 'pawnstorm42', displayName: 'Jonas Becker', rating: 1902, country: 'DE', avatarColor: '#ea580c' },
  { id: 'p-05', username: 'castlequeen', displayName: 'Sofia Alvarez', rating: 1864, country: 'ES', avatarColor: '#16a34a' },
  { id: 'p-06', username: 'endgame_owl', displayName: 'Hiro Tanaka', rating: 1811, country: 'JP', avatarColor: '#0891b2' },
  { id: 'p-07', username: 'fianchetto_fox', displayName: 'Liam O’Connor', rating: 1756, country: 'IE', avatarColor: '#ca8a04' },
  { id: 'p-08', username: 'zugzwanger', displayName: 'Noah Fischer', rating: 1703, country: 'AT', avatarColor: '#4f46e5' },
  { id: 'p-09', username: 'gambit_grace', displayName: 'Grace Kim', rating: 1662, country: 'KR', avatarColor: '#be123c' },
  { id: 'p-10', username: 'tempo_tom', displayName: 'Tom Walker', rating: 1611, country: 'GB', avatarColor: '#059669' },
  { id: 'p-11', username: 'forkfinder', displayName: 'Amara Okafor', rating: 1580, country: 'NG', avatarColor: '#9333ea' },
  { id: 'p-12', username: 'deep_rank', displayName: 'Lucas Martin', rating: 1529, country: 'FR', avatarColor: '#0284c7' },
  { id: 'p-13', username: 'blitzbaron', displayName: 'Mateo Rossi', rating: 1497, country: 'IT', avatarColor: '#dc2626' },
  { id: 'p-14', username: 'quiet_move', displayName: 'Ava Johnson', rating: 1455, country: 'CA', avatarColor: '#65a30d' },
  { id: 'p-15', username: 'opposition', displayName: 'Ilya Sokolov', rating: 1402, country: 'PL', avatarColor: '#0d9488' },
  { id: 'p-16', username: 'smotheredmate', displayName: 'Chloe Dubois', rating: 1366, country: 'BE', avatarColor: '#c026d3' },
  { id: 'p-17', username: 'enpassant_pro', displayName: 'Diego Santos', rating: 1318, country: 'BR', avatarColor: '#d97706' },
  { id: 'p-18', username: 'kingwalk', displayName: 'Mia Novak', rating: 1274, country: 'CZ', avatarColor: '#475569' },
  { id: 'p-19', username: 'hangingpawns', displayName: 'Ethan Brooks', rating: 1203, country: 'AU', avatarColor: '#e11d48' },
  { id: 'p-20', username: 'first_rank', displayName: 'Zara Ahmed', rating: 1142, country: 'AE', avatarColor: '#7c2d12' },
]

export const MOCK_AI_PLAYERS: Record<'beginner' | 'intermediate' | 'advanced', Player> = {
  beginner: { id: 'bot-beginner', username: 'MockBot · Beginner', displayName: 'Mock AI (Beginner)', rating: 800, country: '—', avatarColor: '#64748b', isBot: true },
  intermediate: { id: 'bot-intermediate', username: 'MockBot · Intermediate', displayName: 'Mock AI (Intermediate)', rating: 1200, country: '—', avatarColor: '#475569', isBot: true },
  advanced: { id: 'bot-advanced', username: 'MockBot · Advanced', displayName: 'Mock AI (Advanced)', rating: 1600, country: '—', avatarColor: '#334155', isBot: true },
}

export const LOCAL_OPPONENT: Player = {
  id: 'local-guest',
  username: 'Guest (same device)',
  displayName: 'Local Guest',
  rating: 0,
  country: '—',
  avatarColor: '#a16207',
}

export const COUNTRY_NAMES: Record<string, string> = {
  US: 'United States', IN: 'India', BG: 'Bulgaria', DE: 'Germany', ES: 'Spain', JP: 'Japan', IE: 'Ireland',
  AT: 'Austria', KR: 'South Korea', GB: 'United Kingdom', NG: 'Nigeria', FR: 'France', IT: 'Italy', CA: 'Canada',
  PL: 'Poland', BE: 'Belgium', BR: 'Brazil', CZ: 'Czechia', AU: 'Australia', AE: 'UAE',
}

export function findPlayer(id: string) {
  return MOCK_PLAYERS.find((p) => p.id === id)
}

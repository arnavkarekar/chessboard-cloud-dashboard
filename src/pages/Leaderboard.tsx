import { useEffect, useMemo, useState } from 'react'
import { ArrowDown, ArrowUp, Crosshair, Medal, Search, SearchX } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PageContainer } from '@/components/layout/PageContainer'
import { UserAvatar } from '@/components/common/UserAvatar'
import { EmptyState } from '@/components/common/EmptyState'
import { SkeletonRows } from '@/components/common/LoadingState'
import { SimulationBadge } from '@/components/common/SimulationBadge'
import { useAccount } from '@/context/AccountContext'
import { COUNTRY_NAMES } from '@/data/mockPlayers'
import { fetchLeaderboard } from '@/services/mockApi'
import type { LeaderboardEntry } from '@/types/player'
import { cn } from '@/lib/utils'

type SortKey = 'rating' | 'winRate' | 'gamesPlayed' | 'wins'
type Tier = 'all' | 'expert' | 'club' | 'developing'

const TIERS: Record<Tier, { label: string; test: (r: number) => boolean }> = {
  all: { label: 'All ratings', test: () => true },
  expert: { label: '2000+', test: (r) => r >= 2000 },
  club: { label: '1500 – 1999', test: (r) => r >= 1500 && r < 2000 },
  developing: { label: 'Under 1500', test: (r) => r < 1500 },
}

export default function Leaderboard() {
  const { profile, stats, gamesLoading } = useAccount()
  const [entries, setEntries] = useState<LeaderboardEntry[] | null>(null)
  const [query, setQuery] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('rating')
  const [desc, setDesc] = useState(true)
  const [country, setCountry] = useState('all')
  const [tier, setTier] = useState<Tier>('all')

  useEffect(() => {
    if (gamesLoading) return
    let cancelled = false
    fetchLeaderboard(profile, { wins: stats.wins, losses: stats.losses, draws: stats.draws }).then((e) => !cancelled && setEntries(e))
    return () => {
      cancelled = true
    }
  }, [profile, stats.wins, stats.losses, stats.draws, gamesLoading])

  const countries = useMemo(() => [...new Set((entries ?? []).map((e) => e.player.country))].sort(), [entries])

  const visible = useMemo(() => {
    if (!entries) return []
    const q = query.trim().toLowerCase()
    return entries
      .filter((e) => !q || e.player.username.toLowerCase().includes(q) || e.player.displayName.toLowerCase().includes(q))
      .filter((e) => country === 'all' || e.player.country === country)
      .filter((e) => TIERS[tier].test(e.player.rating))
      .sort((a, b) => {
        const diff = sortKey === 'rating' ? a.player.rating - b.player.rating : a[sortKey] - b[sortKey]
        return desc ? -diff : diff
      })
  }, [entries, query, country, tier, sortKey, desc])

  const me = entries?.find((e) => e.player.id === profile.id)

  const toggleSort = (key: SortKey) => {
    if (key === sortKey) setDesc((d) => !d)
    else {
      setSortKey(key)
      setDesc(true)
    }
  }

  const jumpToMe = () => {
    setQuery('')
    setCountry('all')
    setTier('all')
    requestAnimationFrame(() => document.getElementById('lb-me')?.scrollIntoView({ behavior: 'smooth', block: 'center' }))
  }

  const SortHeader = ({ k, label, className }: { k: SortKey; label: string; className?: string }) => (
    <th className={cn('px-4 py-2.5 font-medium', className)} aria-sort={sortKey === k ? (desc ? 'descending' : 'ascending') : 'none'}>
      <button type="button" onClick={() => toggleSort(k)} className="inline-flex items-center gap-1 hover:text-foreground">
        {label}
        {sortKey === k && (desc ? <ArrowDown className="size-3" /> : <ArrowUp className="size-3" />)}
      </button>
    </th>
  )

  return (
    <PageContainer
      title={
        <span className="flex items-center gap-2">
          Leaderboard <SimulationBadge label="Mock data" tip="Rankings are generated from mock players. There is no ranking service." />
        </span>
      }
      description="Ratings and records of mock community players."
      actions={
        me && (
          <Button variant="outline" onClick={jumpToMe}>
            <Crosshair /> My rank: #{me.rank}
          </Button>
        )
      }
    >
      {entries && (
        <div className="mb-6 grid gap-3 sm:grid-cols-3">
          {entries.slice(0, 3).map((e, i) => (
            <Card key={e.player.id} className={cn('flex items-center gap-3 p-4', i === 0 && 'border-brass/50 bg-brass/5')}>
              <Medal className={cn('size-6', i === 0 ? 'text-brass' : i === 1 ? 'text-slate-400' : 'text-amber-700')} />
              <UserAvatar player={e.player} size="lg" />
              <div className="min-w-0">
                <p className="truncate font-semibold">
                  {e.player.title && <span className="mr-1 text-brass">{e.player.title}</span>}
                  {e.player.username}
                </p>
                <p className="tabular text-sm text-muted-foreground">
                  {e.player.rating} · {e.winRate}% wins
                </p>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Card className="mb-4 p-3">
        <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_12rem_12rem]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by username" className="pl-9" aria-label="Search by username" />
          </div>
          <Select value={tier} onValueChange={(v) => setTier(v as Tier)}>
            <SelectTrigger aria-label="Rating tier">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(TIERS) as Tier[]).map((t) => (
                <SelectItem key={t} value={t}>
                  {TIERS[t].label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={country} onValueChange={setCountry}>
            <SelectTrigger aria-label="Country">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All countries</SelectItem>
              {countries.map((c) => (
                <SelectItem key={c} value={c}>
                  {COUNTRY_NAMES[c] ?? c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </Card>

      {!entries ? (
        <SkeletonRows rows={10} />
      ) : visible.length === 0 ? (
        <EmptyState icon={SearchX} title="No players found" description="Try another username or remove a filter." />
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="border-b bg-muted/40 text-left text-xs text-muted-foreground">
              <tr>
                <th className="w-16 px-4 py-2.5 font-medium">Rank</th>
                <th className="px-4 py-2.5 font-medium">Player</th>
                <SortHeader k="rating" label="Rating" className="text-right" />
                <SortHeader k="wins" label="W / L / D" className="text-right" />
                <SortHeader k="winRate" label="Win rate" className="text-right" />
                <SortHeader k="gamesPlayed" label="Games" className="text-right" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {visible.map((e) => {
                const isMe = e.player.id === profile.id
                return (
                  <tr key={e.player.id} id={isMe ? 'lb-me' : undefined} className={cn('transition-colors hover:bg-accent/40', isMe && 'bg-primary/8 hover:bg-primary/12')}>
                    <td className="tabular px-4 py-2.5 font-semibold text-muted-foreground">#{e.rank}</td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2.5">
                        <UserAvatar player={e.player} size="sm" />
                        <div className="min-w-0">
                          <p className="truncate font-medium">
                            {e.player.title && <span className="mr-1 text-xs font-bold text-brass">{e.player.title}</span>}
                            {e.player.username}
                            {isMe && (
                              <Badge className="ml-2" variant="default">
                                You
                              </Badge>
                            )}
                          </p>
                          <p className="text-xs text-muted-foreground">{COUNTRY_NAMES[e.player.country] ?? e.player.country}</p>
                        </div>
                      </div>
                    </td>
                    <td className="tabular px-4 py-2.5 text-right">
                      <span className="font-semibold">{e.player.rating}</span>
                      <span className={cn('ml-1.5 text-xs', e.ratingChange30d >= 0 ? 'text-success' : 'text-destructive')}>
                        {e.ratingChange30d >= 0 ? '+' : ''}
                        {e.ratingChange30d}
                      </span>
                    </td>
                    <td className="tabular px-4 py-2.5 text-right text-muted-foreground">
                      <span className="text-success">{e.wins}</span> / <span className="text-destructive">{e.losses}</span> / {e.draws}
                    </td>
                    <td className="tabular px-4 py-2.5 text-right">{e.winRate}%</td>
                    <td className="tabular px-4 py-2.5 text-right">{e.gamesPlayed}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </Card>
      )}
    </PageContainer>
  )
}

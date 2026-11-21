import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Download, Eye, FilterX, Search, SearchX } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PageContainer } from '@/components/layout/PageContainer'
import { UserAvatar } from '@/components/common/UserAvatar'
import { EmptyState } from '@/components/common/EmptyState'
import { SkeletonRows } from '@/components/common/LoadingState'
import { ModeLabel, ResultBadge } from '@/components/game/GameBadges'
import { useAccount } from '@/context/AccountContext'
import { fileSafe, TERMINATION_LABELS } from '@/lib/chess'
import { downloadTextFile, formatDate, formatDuration } from '@/lib/utils'
import type { GameRecord } from '@/types/game'

type ResultFilter = 'all' | 'win' | 'loss' | 'draw'
type ModeFilter = 'all' | 'online' | 'local' | 'ai'
type DateFilter = 'all' | '7' | '30' | '90'
type SortOrder = 'newest' | 'oldest'

export function downloadGamePgn(g: GameRecord) {
  downloadTextFile(`${fileSafe(`game_${g.opponent.username}_${g.date.slice(0, 10)}`)}.pgn`, g.pgn)
  toast.success('PGN downloaded')
}

export default function MyGames() {
  const { games, gamesLoading } = useAccount()
  const [query, setQuery] = useState('')
  const [result, setResult] = useState<ResultFilter>('all')
  const [mode, setMode] = useState<ModeFilter>('all')
  const [range, setRange] = useState<DateFilter>('all')
  const [sort, setSort] = useState<SortOrder>('newest')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const since = range === 'all' ? 0 : Date.now() - Number(range) * 86_400_000
    return games
      .filter((g) => !q || g.opponent.username.toLowerCase().includes(q) || g.opponent.displayName.toLowerCase().includes(q))
      .filter((g) => result === 'all' || g.result === result)
      .filter((g) => mode === 'all' || g.mode === mode)
      .filter((g) => +new Date(g.date) >= since)
      .sort((a, b) => (sort === 'newest' ? 1 : -1) * (+new Date(b.date) - +new Date(a.date)))
  }, [games, query, result, mode, range, sort])

  const filtersActive = query !== '' || result !== 'all' || mode !== 'all' || range !== 'all'
  const resetFilters = () => {
    setQuery('')
    setResult('all')
    setMode('all')
    setRange('all')
  }

  const exportFiltered = () => {
    downloadTextFile(`my_games_${new Date().toISOString().slice(0, 10)}.pgn`, filtered.map((g) => g.pgn).join('\n\n'))
    toast.success(`Exported ${filtered.length} game${filtered.length === 1 ? '' : 's'} as PGN`)
  }

  return (
    <PageContainer
      title="My Games"
      description="Mock history plus games you finish in this browser session (not persisted across devices)."
      actions={
        <Button variant="outline" onClick={exportFiltered} disabled={gamesLoading || filtered.length === 0}>
          <Download /> Export {filtered.length} as PGN
        </Button>
      }
    >
      <Card className="mb-4 p-3">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_repeat(4,10rem)_auto]">
          <div className="relative sm:col-span-2 lg:col-span-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by opponent" className="pl-9" aria-label="Search by opponent" />
          </div>
          <Select value={result} onValueChange={(v) => setResult(v as ResultFilter)}>
            <SelectTrigger aria-label="Filter by result">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All results</SelectItem>
              <SelectItem value="win">Wins</SelectItem>
              <SelectItem value="loss">Losses</SelectItem>
              <SelectItem value="draw">Draws</SelectItem>
            </SelectContent>
          </Select>
          <Select value={mode} onValueChange={(v) => setMode(v as ModeFilter)}>
            <SelectTrigger aria-label="Filter by game mode">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All modes</SelectItem>
              <SelectItem value="online">Online</SelectItem>
              <SelectItem value="local">Local</SelectItem>
              <SelectItem value="ai">Mock AI</SelectItem>
            </SelectContent>
          </Select>
          <Select value={range} onValueChange={(v) => setRange(v as DateFilter)}>
            <SelectTrigger aria-label="Filter by date">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Any time</SelectItem>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sort} onValueChange={(v) => setSort(v as SortOrder)}>
            <SelectTrigger aria-label="Sort order">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest first</SelectItem>
              <SelectItem value="oldest">Oldest first</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="ghost" onClick={resetFilters} disabled={!filtersActive}>
            <FilterX /> Reset
          </Button>
        </div>
      </Card>

      {gamesLoading ? (
        <SkeletonRows rows={8} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={SearchX}
          title="No games match these filters"
          description="Try a different opponent name or widen the filters."
          action={
            <Button variant="outline" onClick={resetFilters}>
              Clear filters
            </Button>
          }
        />
      ) : (
        <>
          <p className="mb-2 text-xs text-muted-foreground">
            Showing {filtered.length} of {games.length} games
          </p>
          <Card className="hidden overflow-hidden md:block">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/40 text-left text-xs text-muted-foreground">
                <tr>
                  <th className="px-4 py-2.5 font-medium">Opponent</th>
                  <th className="px-4 py-2.5 font-medium">Result</th>
                  <th className="px-4 py-2.5 font-medium">Mode</th>
                  <th className="px-4 py-2.5 font-medium">Time</th>
                  <th className="px-4 py-2.5 text-right font-medium">Moves</th>
                  <th className="px-4 py-2.5 text-right font-medium">Duration</th>
                  <th className="px-4 py-2.5 font-medium">Date</th>
                  <th className="px-4 py-2.5">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map((g) => (
                  <tr key={g.id} className="transition-colors hover:bg-accent/40">
                    <td className="px-4 py-2.5">
                      <Link to={`/games/${g.id}`} className="flex items-center gap-2.5 font-medium hover:underline">
                        <UserAvatar player={g.opponent} size="sm" />
                        <span className="min-w-0">
                          <span className="block truncate">{g.opponent.username}</span>
                          <span className="block text-xs font-normal text-muted-foreground">
                            You played {g.userColor === 'w' ? 'White' : 'Black'}
                            {g.source === 'local' && ' · this session'}
                          </span>
                        </span>
                      </Link>
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex flex-col items-start gap-0.5">
                        <ResultBadge result={g.result} />
                        <span className="text-xs text-muted-foreground">{TERMINATION_LABELS[g.termination]}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5">
                      <ModeLabel mode={g.mode} />
                    </td>
                    <td className="px-4 py-2.5 text-muted-foreground">{g.timeControl.label}</td>
                    <td className="tabular px-4 py-2.5 text-right">{Math.ceil(g.moves.length / 2)}</td>
                    <td className="tabular px-4 py-2.5 text-right">{formatDuration(g.durationSeconds)}</td>
                    <td className="px-4 py-2.5 text-muted-foreground">{formatDate(g.date)}</td>
                    <td className="px-4 py-2.5">
                      <div className="flex justify-end gap-1">
                        <Button asChild variant="ghost" size="icon-sm" aria-label="View game">
                          <Link to={`/games/${g.id}`}>
                            <Eye />
                          </Link>
                        </Button>
                        <Button variant="ghost" size="icon-sm" aria-label="Download PGN" onClick={() => downloadGamePgn(g)}>
                          <Download />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          <ul className="space-y-2 md:hidden">
            {filtered.map((g) => (
              <li key={g.id}>
                <Card className="flex items-center gap-3 p-3">
                  <Link to={`/games/${g.id}`} className="flex min-w-0 flex-1 items-center gap-3">
                    <UserAvatar player={g.opponent} size="md" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{g.opponent.username}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(g.date)} · {Math.ceil(g.moves.length / 2)} moves · {formatDuration(g.durationSeconds)}
                      </p>
                      <p className="text-xs">
                        <ModeLabel mode={g.mode} />
                      </p>
                    </div>
                  </Link>
                  <div className="flex flex-col items-end gap-1.5">
                    <ResultBadge result={g.result} />
                    <Button variant="ghost" size="icon-sm" aria-label="Download PGN" onClick={() => downloadGamePgn(g)}>
                      <Download />
                    </Button>
                  </div>
                </Card>
              </li>
            ))}
          </ul>
        </>
      )}
    </PageContainer>
  )
}

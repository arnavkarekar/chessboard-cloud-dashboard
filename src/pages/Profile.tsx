import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, CalendarDays, Loader2, MapPin, Pencil, Save, Star } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input, Textarea } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PageContainer } from '@/components/layout/PageContainer'
import { UserAvatar } from '@/components/common/UserAvatar'
import { RecentGames } from '@/components/dashboard/RecentGames'
import { useAccount } from '@/context/AccountContext'
import { COUNTRY_NAMES } from '@/data/mockPlayers'
import { MockApiError, updateProfile } from '@/services/mockApi'
import type { UserProfile } from '@/types/player'
import { cn, formatDate, percent } from '@/lib/utils'

const AVATAR_COLORS = ['#0f766e', '#2563eb', '#7c3aed', '#db2777', '#ea580c', '#ca8a04', '#16a34a', '#475569']
const USERNAME_PATTERN = /^[a-z0-9_]{3,20}$/i

export default function Profile() {
  const { profile, setProfile, stats, games, gamesLoading, logActivity } = useAccount()
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState<UserProfile>(profile)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const usernameError = !USERNAME_PATTERN.test(draft.username) ? 'Use 3–20 letters, numbers, or underscores.' : null
  const displayNameError = draft.displayName.trim().length < 2 ? 'Display name must be at least 2 characters.' : null
  const emailError = !/^\S+@\S+\.\S+$/.test(draft.email) ? 'Enter a valid email address.' : null
  const invalid = !!(usernameError || displayNameError || emailError)

  const set = <K extends keyof UserProfile>(k: K, v: UserProfile[K]) => {
    setDraft((d) => ({ ...d, [k]: v }))
    setError(null)
  }

  const startEdit = () => {
    setDraft(profile)
    setError(null)
    setEditing(true)
  }

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    if (invalid) return
    setSaving(true)
    try {
      const saved = await updateProfile({ ...draft, displayName: draft.displayName.trim(), bio: draft.bio.trim() })
      setProfile(saved)
      setEditing(false)
      logActivity({ kind: 'profile', text: 'Updated profile details' })
      toast.success('Profile updated', { description: 'Saved in this browser session only.' })
    } catch (err) {
      setError(err instanceof MockApiError ? err.message : 'Could not save profile')
    } finally {
      setSaving(false)
    }
  }

  const bar = [
    { label: 'Wins', value: stats.wins, className: 'bg-success' },
    { label: 'Draws', value: stats.draws, className: 'bg-muted-foreground/50' },
    { label: 'Losses', value: stats.losses, className: 'bg-destructive' },
  ]

  return (
    <PageContainer>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
        <div className="space-y-6">
          <Card className="overflow-hidden">
            <div className="h-20 bg-gradient-to-r from-primary/30 via-primary/10 to-brass/20" />
            <CardContent className="-mt-10 space-y-4">
              <div className="flex items-end justify-between gap-3">
                <UserAvatar player={profile} size="xl" className="ring-4 ring-card" />
                {!editing && (
                  <Button variant="outline" size="sm" onClick={startEdit}>
                    <Pencil /> Edit profile
                  </Button>
                )}
              </div>
              <div>
                <h2 className="text-xl font-semibold tracking-tight">{profile.displayName}</h2>
                <p className="text-sm text-muted-foreground">@{profile.username}</p>
              </div>
              {profile.bio && <p className="text-sm">{profile.bio}</p>}
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Star className="size-4 text-brass" /> {profile.rating} rating (mock)
                </span>
                <span className="flex items-center gap-1.5">
                  <MapPin className="size-4" /> {COUNTRY_NAMES[profile.country] ?? profile.country}
                </span>
                <span className="flex items-center gap-1.5">
                  <CalendarDays className="size-4" /> Joined {formatDate(profile.createdAt)}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Statistics</CardTitle>
              <CardDescription>{stats.total} games played</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex h-3 overflow-hidden rounded-full bg-muted" aria-hidden>
                {bar.map((b) => (
                  <span key={b.label} className={b.className} style={{ width: `${percent(b.value, stats.total)}%` }} />
                ))}
              </div>
              <div className="grid grid-cols-4 gap-2 text-center">
                {[...bar, { label: 'Win rate', value: `${stats.winRate}%` }].map((b) => (
                  <div key={b.label} className="rounded-lg bg-muted/50 p-2">
                    <p className="tabular text-lg font-semibold">{b.value}</p>
                    <p className="text-xs text-muted-foreground">{b.label}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {editing && (
            <Card className="animate-fade-in">
              <form onSubmit={save}>
                <CardHeader>
                  <CardTitle>Edit profile</CardTitle>
                  <CardDescription>Changes are kept in local state only — nothing is sent to a server.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-2">
                  <Field label="Display name" id="displayName" error={displayNameError}>
                    <Input id="displayName" value={draft.displayName} onChange={(e) => set('displayName', e.target.value)} aria-invalid={!!displayNameError} />
                  </Field>
                  <Field label="Username" id="username" error={usernameError}>
                    <Input id="username" value={draft.username} onChange={(e) => set('username', e.target.value)} aria-invalid={!!usernameError} />
                  </Field>
                  <Field label="Email" id="email" error={emailError}>
                    <Input id="email" type="email" value={draft.email} onChange={(e) => set('email', e.target.value)} aria-invalid={!!emailError} />
                  </Field>
                  <Field label="Country" id="country">
                    <Select value={draft.country} onValueChange={(v) => set('country', v)}>
                      <SelectTrigger id="country">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(COUNTRY_NAMES).map(([code, name]) => (
                          <SelectItem key={code} value={code}>
                            {name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                  <div className="sm:col-span-2">
                    <Field label="Bio" id="bio">
                      <Textarea id="bio" value={draft.bio} maxLength={240} onChange={(e) => set('bio', e.target.value)} />
                      <p className="text-right text-xs text-muted-foreground">{draft.bio.length}/240</p>
                    </Field>
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label>Avatar color</Label>
                    <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Avatar color">
                      {AVATAR_COLORS.map((c) => (
                        <button
                          key={c}
                          type="button"
                          role="radio"
                          aria-checked={draft.avatarColor === c}
                          aria-label={`Color ${c}`}
                          onClick={() => set('avatarColor', c)}
                          className={cn('size-8 rounded-full ring-offset-2 ring-offset-card transition', draft.avatarColor === c && 'ring-2 ring-foreground')}
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                  </div>
                  {error && (
                    <p role="alert" className="text-sm text-destructive sm:col-span-2">
                      {error}
                    </p>
                  )}
                  <div className="flex justify-end gap-2 sm:col-span-2">
                    <Button variant="outline" onClick={() => setEditing(false)} disabled={saving}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={invalid || saving}>
                      {saving ? <Loader2 className="animate-spin" /> : <Save />} Save changes
                    </Button>
                  </div>
                </CardContent>
              </form>
            </Card>
          )}

          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle>Recent games</CardTitle>
              <Button asChild variant="ghost" size="sm">
                <Link to="/games">
                  All games <ArrowRight />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              <RecentGames games={games} loading={gamesLoading} limit={6} />
            </CardContent>
          </Card>
        </div>
      </div>
    </PageContainer>
  )
}

function Field({ label, id, error, children }: { label: string; id: string; error?: string | null; children: React.ReactNode }) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}

import { Bot, Globe, Users } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import type { GameMode, GameResult } from '@/types/game'

export function ResultBadge({ result }: { result: GameResult }) {
  if (result === 'win') return <Badge variant="success">Win</Badge>
  if (result === 'loss') return <Badge variant="destructive">Loss</Badge>
  return <Badge variant="secondary">Draw</Badge>
}

const MODE_META: Record<GameMode, { label: string; icon: typeof Globe }> = {
  online: { label: 'Online', icon: Globe },
  local: { label: 'Local', icon: Users },
  ai: { label: 'Mock AI', icon: Bot },
}

export function ModeLabel({ mode }: { mode: GameMode }) {
  const meta = MODE_META[mode]
  return (
    <span className="inline-flex items-center gap-1.5 text-muted-foreground">
      <meta.icon className="size-3.5" />
      {meta.label}
    </span>
  )
}

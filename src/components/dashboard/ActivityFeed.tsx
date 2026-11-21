import { Link } from 'react-router-dom'
import { Award, CircuitBoard, Swords, TrendingUp, UserRound } from 'lucide-react'
import type { ActivityItem } from '@/context/AccountContext'
import { formatRelative } from '@/lib/utils'

const ICONS = { game: Swords, device: CircuitBoard, rating: TrendingUp, achievement: Award, profile: UserRound }

export function ActivityFeed({ items, limit = 7 }: { items: ActivityItem[]; limit?: number }) {
  if (items.length === 0) return <p className="py-6 text-center text-sm text-muted-foreground">No recent activity.</p>
  return (
    <ol className="relative space-y-4 before:absolute before:inset-y-1 before:left-[13px] before:w-px before:bg-border">
      {items.slice(0, limit).map((a) => {
        const Icon = ICONS[a.kind]
        const body = (
          <>
            <p className="text-sm leading-snug">{a.text}</p>
            <p className="text-xs text-muted-foreground">{formatRelative(a.createdAt)}</p>
          </>
        )
        return (
          <li key={a.id} className="relative flex gap-3">
            <span className="relative z-10 flex size-7 shrink-0 items-center justify-center rounded-full border bg-card">
              <Icon className="size-3.5 text-muted-foreground" />
            </span>
            {a.link ? (
              <Link to={a.link} className="min-w-0 rounded hover:underline">
                {body}
              </Link>
            ) : (
              <div className="min-w-0">{body}</div>
            )}
          </li>
        )
      })}
    </ol>
  )
}

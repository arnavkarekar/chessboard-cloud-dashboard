import { Bot } from 'lucide-react'
import type { Player } from '@/types/player'
import { cn } from '@/lib/utils'

const SIZES = { sm: 'size-7 text-[11px]', md: 'size-9 text-xs', lg: 'size-12 text-sm', xl: 'size-20 text-2xl' }

export function initials(name: string) {
  const parts = name.replace(/[^a-zA-Z ]/g, ' ').trim().split(/\s+/)
  return ((parts[0]?.[0] ?? '?') + (parts[1]?.[0] ?? '')).toUpperCase()
}

export function UserAvatar({ player, size = 'md', className }: { player: Pick<Player, 'displayName' | 'avatarColor' | 'isBot'>; size?: keyof typeof SIZES; className?: string }) {
  return (
    <span
      className={cn('inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white ring-2 ring-background', SIZES[size], className)}
      style={{ backgroundColor: player.avatarColor }}
      aria-hidden="true"
    >
      {player.isBot ? <Bot className="size-[55%]" /> : initials(player.displayName)}
    </span>
  )
}

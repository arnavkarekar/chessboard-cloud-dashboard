import type { LucideIcon } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/misc'
import { cn } from '@/lib/utils'

export function StatsCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = 'default',
  loading,
}: {
  label: string
  value: string | number
  hint?: string
  icon: LucideIcon
  tone?: 'default' | 'success' | 'destructive' | 'muted' | 'brass'
  loading?: boolean
}) {
  const tones = {
    default: 'bg-primary/10 text-primary',
    success: 'bg-success/12 text-success',
    destructive: 'bg-destructive/10 text-destructive',
    muted: 'bg-muted text-muted-foreground',
    brass: 'bg-brass/15 text-brass',
  }
  return (
    <Card className="p-4 transition-shadow hover:shadow-md">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        <span className={cn('flex size-7 items-center justify-center rounded-md', tones[tone])}>
          <Icon className="size-4" />
        </span>
      </div>
      {loading ? <Skeleton className="mt-2 h-7 w-16" /> : <p className="tabular mt-1.5 text-2xl font-semibold tracking-tight">{value}</p>}
      {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
    </Card>
  )
}

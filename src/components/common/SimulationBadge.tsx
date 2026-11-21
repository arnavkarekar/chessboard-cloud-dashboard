import { FlaskConical } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Tooltip } from '@/components/ui/tooltip'

export function SimulationBadge({ label = 'Simulated', tip }: { label?: string; tip?: string }) {
  return (
    <Tooltip content={tip ?? 'This is frontend-only demo behaviour. No hardware, network, or server is involved.'}>
      <Badge variant="sim" tabIndex={0}>
        <FlaskConical />
        {label}
      </Badge>
    </Tooltip>
  )
}

export function SimulationNotice({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2.5 rounded-lg border border-dashed border-brass/50 bg-brass/8 px-3.5 py-2.5 text-sm text-foreground/85">
      <FlaskConical className="mt-0.5 size-4 shrink-0 text-brass" />
      <div>{children}</div>
    </div>
  )
}

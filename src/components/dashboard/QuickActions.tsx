import { useNavigate } from 'react-router-dom'
import { Bot, History, LogIn, PlusCircle } from 'lucide-react'
import { useGameSession } from '@/context/GameSessionContext'

export function QuickActions() {
  const { modals } = useGameSession()
  const navigate = useNavigate()
  const actions = [
    { label: 'Create game', description: 'Online, local, or mock AI', icon: PlusCircle, onClick: () => modals.openCreate() },
    { label: 'Join game', description: 'Enter a six-character code', icon: LogIn, onClick: () => modals.openJoin() },
    { label: 'Play against AI', description: 'Lightweight mock opponent', icon: Bot, onClick: () => modals.openCreate({ mode: 'ai', colorChoice: 'white' }) },
    { label: 'Previous games', description: 'Review your history', icon: History, onClick: () => navigate('/games') },
  ]
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {actions.map((a) => (
        <button
          key={a.label}
          type="button"
          onClick={a.onClick}
          className="group flex flex-col items-start gap-3 rounded-xl border bg-card p-4 text-left shadow-xs transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
            <a.icon className="size-5" />
          </span>
          <span>
            <span className="block text-sm font-semibold">{a.label}</span>
            <span className="block text-xs text-muted-foreground">{a.description}</span>
          </span>
        </button>
      ))}
    </div>
  )
}

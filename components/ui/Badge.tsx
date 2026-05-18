import { cn } from '@/lib/utils'

interface BadgeProps {
  variant?: 'success' | 'warning' | 'danger' | 'neutral' | 'info'
  children: React.ReactNode
  className?: string
}

export function Badge({ variant = 'neutral', children, className }: BadgeProps) {
  const variants = {
    success: 'bg-green-500/15 text-green-400 border-green-500/30',
    warning: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    danger: 'bg-red-500/15 text-red-400 border-red-500/30',
    neutral: 'bg-[#2a2a2a] text-[#9ca3af] border-[#3a3a3a]',
    info: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  }

  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border', variants[variant], className)}>
      {children}
    </span>
  )
}

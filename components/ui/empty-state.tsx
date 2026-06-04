import { type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description?: string
  cta?: React.ReactNode
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  cta,
  className,
  size = 'md',
}: EmptyStateProps) {
  const sizes = {
    sm: { wrapper: 'py-8', icon: 'h-8 w-8', iconBox: 'h-12 w-12', title: 'text-sm', desc: 'text-xs' },
    md: { wrapper: 'py-12', icon: 'h-9 w-9', iconBox: 'h-16 w-16', title: 'text-base', desc: 'text-sm' },
    lg: { wrapper: 'py-16', icon: 'h-10 w-10', iconBox: 'h-20 w-20', title: 'text-lg', desc: 'text-base' },
  }
  const s = sizes[size]

  return (
    <div className={cn('flex flex-col items-center justify-center gap-3 text-center', s.wrapper, className)}>
      <div className={cn(
        'flex items-center justify-center rounded-2xl bg-slate-100/80',
        s.iconBox,
      )}>
        <Icon className={cn('text-slate-400', s.icon)} strokeWidth={1.5} />
      </div>
      <div className="space-y-1">
        <p className={cn('font-semibold text-slate-700', s.title)}>{title}</p>
        {description && (
          <p className={cn('text-slate-500 max-w-xs', s.desc)}>{description}</p>
        )}
      </div>
      {cta && <div className="mt-1">{cta}</div>}
    </div>
  )
}

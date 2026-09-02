import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export function EmptyState({ icon, title, description, action, className }: { icon?: ReactNode; title: ReactNode; description?: ReactNode; action?: ReactNode; className?: string }) {
  return (
    <div className={cn('flex flex-col items-center justify-center px-6 py-20 text-center', className)}>
      {icon ? <div className="mb-3 text-muted-foreground [&>svg]:size-6">{icon}</div> : null}
      <div className="text-sm font-medium">{title}</div>
      {description ? <div className="mt-1 max-w-sm text-sm text-muted-foreground text-pretty">{description}</div> : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  )
}

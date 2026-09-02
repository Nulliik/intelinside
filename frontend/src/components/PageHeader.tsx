import type { ReactNode } from 'react'
import { inset } from '@/components/frame'
import { cn } from '@/lib/utils'

export function PageHeader({ eyebrow, title, description, actions, className, children }: { eyebrow?: ReactNode; title: ReactNode; description?: ReactNode; actions?: ReactNode; className?: string; children?: ReactNode }) {
  return (
    <header className={cn('flex flex-col gap-6 py-10 md:flex-row md:items-end md:justify-between md:py-14', inset, className)}>
      <div className="min-w-0 max-w-3xl">
        {eyebrow ? <div className="mb-3 text-sm text-muted-foreground">{eyebrow}</div> : null}
        <h1 className="text-3xl font-semibold text-balance md:text-4xl">{title}</h1>
        {description ? <p className="mt-3 max-w-2xl text-base text-muted-foreground text-pretty">{description}</p> : null}
        {children}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
    </header>
  )
}

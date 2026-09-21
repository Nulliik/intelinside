import { RuntimeMark } from '@/components/RuntimeMark'
import type { Runtime } from '@/lib/api/types'
import { cn } from '@/lib/utils'

export function RuntimeDot({ runtime, className }: { runtime?: Runtime; className?: string }) {
  return <span aria-hidden className={cn('inline-block size-2 shrink-0 rounded-full', className)} style={{ background: runtime?.color ?? 'var(--muted-foreground)' }} />
}

/** Runtime mark and name. Links out to the runtime repo, as the spec requires. */
export function RuntimeBadge({ runtime, version, wrap = false, className }: { runtime?: Runtime; version?: string; wrap?: boolean; className?: string }) {
  if (!runtime) return <span className="text-muted-foreground">—</span>
  return (
    <span className={cn('inline-flex items-center gap-1.5 whitespace-nowrap', wrap && 'min-w-0 max-w-full flex-wrap whitespace-normal', className)}>
      <a
        href={runtime.repoUrl}
        target="_blank"
        rel="noreferrer"
        onClick={(e) => e.stopPropagation()}
        className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap text-foreground hover:underline underline-offset-4"
        title={`${runtime.name} on GitHub`}
      >
        <RuntimeMark runtime={runtime} />
        {runtime.name}
      </a>
      {version ? <span className={cn('font-mono text-xs text-muted-foreground', wrap && 'min-w-0 [overflow-wrap:anywhere]')}>{version}</span> : null}
    </span>
  )
}

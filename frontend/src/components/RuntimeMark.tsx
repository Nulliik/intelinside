import { RUNTIME_MARKS } from '@/components/runtimeMarks.generated'
import type { Runtime } from '@/lib/api/types'
import { cn } from '@/lib/utils'

const PX = { sm: 14, md: 16, lg: 20 } as const

// Two-letter tiles for runtimes with no mark yet.
const MONOGRAM: Record<string, string> = { 'ipex-llm': 'IX' }

/**
 * A runtime's mark at a shared height in its original colours: the catalog file when there is one,
 * else a generated mark (monochrome marks resolve to the foreground), else a two-letter tile.
 */
export function RuntimeMark({ runtime, size = 'md', className }: { runtime?: Runtime; size?: keyof typeof PX; className?: string }) {
  const h = PX[size]
  if (!runtime) return <span aria-hidden className={cn('inline-block shrink-0 rounded-full bg-muted-foreground', className)} style={{ width: h / 2, height: h / 2 }} />
  if (runtime.logoUrl) {
    return <img src={runtime.logoUrl} alt="" className={cn('w-auto shrink-0', className)} style={{ height: h }} />
  }
  const m = RUNTIME_MARKS[runtime.id]
  if (m) {
    return (
      <svg role="img" aria-label={m.title} viewBox={m.viewBox} className={cn('w-auto shrink-0', className)} style={{ height: h, color: 'var(--foreground)' }}>
        {m.paths.map((p, i) => (
          <path key={i} d={p.d} fill={p.fill} />
        ))}
      </svg>
    )
  }
  const letters = MONOGRAM[runtime.id] ?? runtime.name.slice(0, 2).toUpperCase()
  return (
    <span
      aria-hidden
      className={cn('inline-flex shrink-0 items-center justify-center rounded-[4px] bg-secondary font-heading font-semibold leading-none', className)}
      style={{ height: h, minWidth: h + 4, padding: '0 3px', fontSize: Math.round(h * 0.55), color: runtime.color }}
    >
      {letters}
    </span>
  )
}

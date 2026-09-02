import { VENDOR_MARKS } from '@/components/vendorMarks.generated'
import { cn } from '@/lib/utils'

const BASE_PX = { sm: 14, md: 16, lg: 20 } as const

// Compact symbols read smaller than wordmarks at the same height, so they get a little extra.
const SCALE: Record<string, number> = { Apple: 1.25 }

/**
 * A vendor's mark in its brand colours; monochrome marks resolve to the foreground. Marks share a height
 * and keep their own width. Vendors without a mark (for example "Generic" memory) show their name.
 */
export function VendorMark({ vendor, className, withName = false, size = 'md' }: { vendor: string; className?: string; withName?: boolean; size?: keyof typeof BASE_PX }) {
  const m = VENDOR_MARKS[vendor]
  if (!m) return <span className={className}>{vendor}</span>
  const height = Math.round(BASE_PX[size] * (SCALE[vendor] ?? 1))
  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <svg role="img" aria-label={m.title} viewBox={m.viewBox} className="w-auto shrink-0" style={{ height, color: 'var(--foreground)' }}>
        {m.paths.map((p, i) => (
          <path key={i} d={p.d} fill={p.fill} />
        ))}
      </svg>
      {withName ? <span>{vendor}</span> : null}
    </span>
  )
}

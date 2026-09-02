import type { Model } from '@/lib/api/types'
import { cn } from '@/lib/utils'

const TILE = { sm: 'size-6 rounded-md', md: 'size-9 rounded-lg', lg: 'size-12 rounded-xl' } as const
const MARK = { sm: 'size-3.5', md: 'size-5', lg: 'size-7' } as const
const TEXT = { sm: 'text-xs', md: 'text-base', lg: 'text-xl' } as const

/**
 * The model's mark from the catalog (an SVG under /logos/models, sourced from the LobeHub icon set),
 * or a monogram in the family's color until the catalog has one.
 */
export function ModelLogo({ model, size = 'md', className }: { model: Pick<Model, 'name' | 'family' | 'logoUrl' | 'brandColor'>; size?: keyof typeof TILE; className?: string }) {
  return (
    <span aria-hidden className={cn('inline-flex shrink-0 items-center justify-center bg-secondary', TILE[size], className)}>
      {model.logoUrl ? (
        <img src={model.logoUrl} alt="" className={cn('object-contain', MARK[size])} />
      ) : (
        <span className={cn('font-heading font-semibold', TEXT[size])} style={{ color: model.brandColor ?? 'var(--muted-foreground)' }}>
          {model.family.charAt(0).toUpperCase()}
        </span>
      )}
    </span>
  )
}

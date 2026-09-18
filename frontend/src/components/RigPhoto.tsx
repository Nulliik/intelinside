import type { ReactNode } from 'react'
import { RigSchematic } from '@/components/RigSchematic'
import { cn } from '@/lib/utils'

/**
 * The rig photo, or, when there is none, a schematic of its parts on a faint grid so every rig still looks like
 * itself. `children` overlays the placeholder only: the owner's Add a photo button lives there.
 */
export function RigPhoto({ id, photoUrl, alt, components, className, children }: { id: string; photoUrl?: string; alt: string; components?: { hardwareId: string; quantity: number }[]; className?: string; children?: ReactNode }) {
  if (photoUrl) return <img src={photoUrl} alt={alt} className={cn('h-full w-full object-cover', className)} />
  return (
    <div role="img" aria-label={alt} className={cn('relative h-full w-full overflow-hidden bg-card', className)}>
      <svg className="absolute inset-0 h-full w-full opacity-40" aria-hidden>
        <defs>
          <pattern id={`grid-${id}`} width="24" height="24" patternUnits="userSpaceOnUse">
            <path d="M24 0H0V24" fill="none" stroke="white" strokeOpacity="0.16" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#grid-${id})`} />
      </svg>
      {components?.length ? <RigSchematic components={components} className={children ? 'top-[7%] h-[66%]' : undefined} /> : null}
      {children}
    </div>
  )
}

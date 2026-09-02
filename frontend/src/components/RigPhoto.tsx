import { cn } from '@/lib/utils'

/** The rig photo, or a flat placeholder with a faint grid when there is none. */
export function RigPhoto({ id, photoUrl, alt, className }: { id: string; photoUrl?: string; alt: string; className?: string }) {
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
    </div>
  )
}

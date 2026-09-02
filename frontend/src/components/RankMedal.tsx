import { cn } from '@/lib/utils'

// Muted metals that sit with the rest of the palette. Numerals are dark so they clear 4.5:1 on every metal.
const METALS: Record<number, { name: string; from: string; via: string; to: string; text: string; glow: string }> = {
  1: { name: 'First place', from: '#f7e2a0', via: '#dcb954', to: '#a67a1c', text: '#2b1f06', glow: 'rgba(220, 185, 84, 0.45)' },
  2: { name: 'Second place', from: '#f4f6f9', via: '#c8cdd5', to: '#868e99', text: '#15181d', glow: 'rgba(200, 205, 213, 0.35)' },
  3: { name: 'Third place', from: '#ecb98e', via: '#c58551', to: '#7d4d22', text: '#24150a', glow: 'rgba(197, 133, 81, 0.4)' },
}

const SIZE = { sm: 'size-7 text-xs', md: 'size-9 text-sm', lg: 'size-11 text-base' } as const

/** Gold, silver, and bronze for the top three; a plain tile for everything else. */
export function RankMedal({ rank, size = 'md', className }: { rank: number; size?: keyof typeof SIZE; className?: string }) {
  const m = METALS[rank]
  if (!m) {
    return <span className={cn('inline-flex items-center justify-center rounded-lg bg-secondary font-mono font-semibold tnum', SIZE[size], className)}>{rank}</span>
  }
  return (
    <span
      role="img"
      aria-label={m.name}
      className={cn('relative inline-flex items-center justify-center overflow-hidden rounded-lg font-mono font-bold tnum', SIZE[size], className)}
      style={{
        background: `linear-gradient(135deg, ${m.from} 0%, ${m.via} 52%, ${m.to} 100%)`,
        color: m.text,
        boxShadow: `inset 0 1px 0 rgba(255,255,255,0.6), inset 0 -1px 0 rgba(0,0,0,0.28), 0 0 0 1px rgba(255,255,255,0.08), 0 10px 22px -10px ${m.glow}`,
      }}
    >
      {/* sheen across the top half */}
      <span aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/35 to-transparent" />
      <span className="relative">{rank}</span>
    </span>
  )
}

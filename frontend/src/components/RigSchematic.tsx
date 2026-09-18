import { useMemo } from 'react'
import { HARDWARE_BY_ID } from '@/catalog'
import { drawRig, type Prim } from '@/lib/schematic'
import { cn } from '@/lib/utils'

// Ink on the tile: the accelerator draws strongest, the rest of the parts softer, count labels in the muted text tone.
const STROKE = { strong: 'rgb(244 244 245 / 0.62)', soft: 'rgb(244 244 245 / 0.34)', label: 'rgb(161 161 170 / 0.9)' } as const
const FILL = 'rgb(244 244 245 / 0.035)'

function Shape({ p }: { p: Prim }) {
  const stroke = STROKE[p.ink]
  switch (p.kind) {
    case 'rect':
      return p.fill === 'stroke' ? (
        <rect x={p.x} y={p.y} width={p.w} height={p.h} rx={p.rx} fill={stroke} opacity={p.opacity} />
      ) : (
        <rect x={p.x} y={p.y} width={p.w} height={p.h} rx={p.rx} fill={FILL} stroke={stroke} vectorEffect="non-scaling-stroke" />
      )
    case 'circle':
      return <circle cx={p.cx} cy={p.cy} r={p.r} fill={FILL} stroke={stroke} vectorEffect="non-scaling-stroke" />
    case 'path':
      return <path d={p.d} fill="none" stroke={stroke} vectorEffect="non-scaling-stroke" />
    case 'text':
      return (
        <text x={p.x} y={p.y} fontSize={p.size} fill={stroke} textAnchor={p.anchor} fontWeight={p.weight} className="font-mono">
          {p.text}
        </text>
      )
  }
}

/** The rig's parts as a line drawing, laid out by `drawRig`. Decorative: the rig name is the alt text of the tile around it. */
export function RigSchematic({ components, className }: { components: { hardwareId: string; quantity: number }[]; className?: string }) {
  const { viewBox, prims } = useMemo(() => drawRig(components, HARDWARE_BY_ID), [components])
  if (!prims.length) return null
  return (
    <svg aria-hidden viewBox={viewBox} preserveAspectRatio="xMidYMid meet" strokeWidth={1} className={cn('absolute top-[12%] left-[10%] h-[76%] w-[80%]', className)}>
      {prims.map((p, i) => (
        <Shape key={i} p={p} />
      ))}
    </svg>
  )
}

import { Link } from 'react-router-dom'
import { HardwareTypeIcon } from '@/components/HardwareTypeIcon'
import type { HardwareItem } from '@/lib/api/types'
import { cn } from '@/lib/utils'

export function HardwareLink({ hardware, quantity, showVendor, className }: { hardware: HardwareItem; quantity?: number; showVendor?: boolean; className?: string }) {
  return (
    <Link to={`/hardware/${hardware.id}`} onClick={(e) => e.stopPropagation()} className={cn('inline-flex items-center gap-1.5 hover:underline underline-offset-4', className)}>
      <HardwareTypeIcon type={hardware.type} className="size-3.5 shrink-0 text-muted-foreground" />
      <span className="truncate">
        {quantity && quantity > 1 ? <span className="font-mono text-muted-foreground">{quantity}× </span> : null}
        {showVendor ? `${hardware.vendor} ` : ''}
        {hardware.name}
      </span>
    </Link>
  )
}

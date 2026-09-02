import { BadgeCheck, EyeOff } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import type { Moderation, Verification } from '@/lib/api/types'
import { cn } from '@/lib/utils'

export function VerificationBadge({ verification, moderation, className }: { verification: Verification; moderation?: Moderation; className?: string }) {
  if (moderation?.hidden)
    return (
      <Badge variant="outline" className={cn('border-warning/40 text-warning', className)}>
        <EyeOff /> Hidden pending review
      </Badge>
    )
  if (verification.status === 'community_verified')
    return (
      <Badge variant="outline" className={cn('border-verified/40 text-verified', className)} title={`${verification.confirmations} confirmations`}>
        <BadgeCheck /> Verified
      </Badge>
    )
  return (
    <Badge variant="outline" className={cn('text-muted-foreground', className)} title={verification.confirmations ? `${verification.confirmations} of 3 confirmations` : 'No confirmations yet'}>
      Self-reported
    </Badge>
  )
}

import { GitFork } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import type { Result } from '@/lib/api/types'
import { cn } from '@/lib/utils'

const EXPLANATION = 'This run used a changed runtime, not the released one.'

/**
 * Marks a run that came off a changed runtime. Stock is the overwhelming majority and gets no badge, so the
 * exception is what draws the eye rather than the rule. Boards keep modified runs out unless asked for them, and
 * this is what says so wherever one does appear.
 *
 * `iconOnly` drops the chrome and the word, leaving the fork mark alone with everything in the tooltip, so a tight
 * table cell stays on one line.
 */
export function ExecutionBadge({
  result,
  iconOnly,
  className,
}: {
  result: Pick<Result, 'execution'>
  iconOnly?: boolean
  className?: string
}) {
  if (result.execution !== 'modified') return null
  const trigger = iconOnly ? (
    // A bare mark, padded so the hover target is bigger than the 14px icon.
    <span className={cn('inline-flex shrink-0 items-center p-0.5 text-warning', className)} aria-label="Modified runtime">
      <GitFork className="size-3.5" />
    </span>
  ) : (
    <Badge variant="outline" className={cn('border-warning/40 text-warning', className)}>
      <GitFork /> Modified
    </Badge>
  )
  return (
    <Tooltip>
      <TooltipTrigger render={trigger} />
      {/* The popup is bg-foreground/text-background — a light surface — so the body text uses the background token
          rather than muted-foreground, which is tuned for dark surfaces and washes out here. */}
      <TooltipContent className="max-w-64 flex-col items-start gap-0.5 text-pretty">
        <span className="font-medium">Modified</span>
        <span className="text-background/80">{EXPLANATION}</span>
      </TooltipContent>
    </Tooltip>
  )
}

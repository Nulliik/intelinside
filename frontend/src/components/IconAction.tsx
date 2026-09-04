import type { MouseEvent, ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

type Props = {
  /** Tooltip and accessible name; the button itself shows only the icon. */
  label: string
  to?: string
  onClick?: (event: MouseEvent<HTMLButtonElement>) => void
  disabled?: boolean
  expanded?: boolean
  className?: string
  children: ReactNode
}

/** A 32px icon-only secondary button with its label in a tooltip, for Share, Edit, and Delete beside a primary. */
export function IconAction({ label, to, onClick, disabled, expanded, className, children }: Props) {
  const button = to ? (
    <Button variant="secondary" size="icon" aria-label={label} className={className} render={<Link to={to} />} nativeButton={false} />
  ) : (
    <Button variant="secondary" size="icon" aria-label={label} className={className} onClick={onClick} disabled={disabled} aria-expanded={expanded} />
  )
  return (
    <Tooltip>
      <TooltipTrigger render={button}>{children}</TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )
}

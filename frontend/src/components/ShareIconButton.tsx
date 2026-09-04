import { useState, type MouseEvent } from 'react'
import { Share2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { IconAction } from '@/components/IconAction'
import { ShareDialog } from '@/components/ShareDialog'
import type { ShareTarget } from '@/lib/share'

/** The primary "Share" text button; opens the share modal for its target. */
export function ShareButton({ target, className }: { target: ShareTarget; className?: string }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button className={className} aria-expanded={open} onClick={() => setOpen(true)}>
        <Share2 data-icon="inline-start" /> Share
      </Button>
      <ShareDialog target={target} open={open} onOpenChange={setOpen} />
    </>
  )
}

type Props = {
  target: ShareTarget
  className?: string
  /** Runs before the modal opens. */
  onClick?: (event: MouseEvent<HTMLButtonElement>) => void
}

/** The icon-only Share button; opens the share modal for its target. */
export function ShareIconButton({ target, className, onClick }: Props) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <IconAction
        label="Share"
        className={className}
        expanded={open}
        onClick={(event) => {
          onClick?.(event)
          setOpen(true)
        }}
      >
        <Share2 />
      </IconAction>
      <ShareDialog target={target} open={open} onOpenChange={setOpen} />
    </>
  )
}

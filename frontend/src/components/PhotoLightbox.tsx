import type { ReactNode } from 'react'
import { Dialog as DialogPrimitive } from '@base-ui/react/dialog'
import { XIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogOverlay, DialogPortal, DialogTitle } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

/**
 * A tile that opens what it shows at full size: the whole tile is the trigger, a dark scrim takes the page, and the
 * picture sits alone in the middle with its caption under it. Escape, the scrim, or the corner button close it.
 * `overlay` renders above the trigger as a sibling, so a control laid over the tile never opens the lightbox.
 */
export function PhotoLightbox({ title, tile, picture, overlay, className }: { title: string; tile: ReactNode; picture: ReactNode; overlay?: ReactNode; className?: string }) {
  return (
    <div className={cn('relative', className)}>
      <Dialog>
        <DialogPrimitive.Trigger
          aria-label={`View ${title} full size`}
          className="block h-full w-full cursor-zoom-in overflow-hidden rounded-xl transition-opacity outline-none hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring/60"
        >
          {tile}
        </DialogPrimitive.Trigger>
        <DialogPortal>
          <DialogOverlay className="bg-black/85 supports-backdrop-filter:backdrop-blur-sm" />
          {/* The popup is only as large as the picture, so the scrim around it stays a click-to-close target. It is
              centred with auto margins rather than a translate: a fixed box at left:50% shrinks to fit half the screen. */}
          <DialogPrimitive.Popup
            data-slot="dialog-content"
            className="fixed inset-0 z-50 m-auto flex h-fit w-fit max-w-[min(1400px,calc(100vw-2rem))] flex-col items-center gap-3 outline-none duration-150 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95"
          >
            <DialogTitle className="sr-only">{title}</DialogTitle>
            <div className="flex max-h-[calc(100vh-8rem)] items-center justify-center">{picture}</div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <DialogPrimitive.Close
              render={<Button variant="ghost" size="icon-lg" className="absolute -top-12 right-0 bg-background/60 backdrop-blur-xs hover:bg-background/80" />}
            >
              <XIcon />
              <span className="sr-only">Close</span>
            </DialogPrimitive.Close>
          </DialogPrimitive.Popup>
        </DialogPortal>
      </Dialog>
      {overlay}
    </div>
  )
}

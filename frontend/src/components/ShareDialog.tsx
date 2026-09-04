import { useEffect, useRef, useState, type ReactNode } from 'react'
import { toast } from 'sonner'
import { Check, Copy, Download, Link2, Share } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { SocialMark } from '@/components/SocialMark'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import {
  DISCORD_APP_URL, PLATFORMS, cardFilename, cardImageUrl, platformIntent, shareUrl,
  type Platform, type ShareTarget,
} from '@/lib/share'
import { cn } from '@/lib/utils'

/*
  One modal for rigs and results. The post panel is the card people will see, the text that goes with it, and
  the two image actions; below it the six platforms and the link. On phones it is a bottom sheet with a
  "More…" that hands the card to the OS share sheet.
*/

type Props = { target: ShareTarget | null; open: boolean; onOpenChange: (open: boolean) => void }

const canCopyImage = typeof window !== 'undefined' && 'ClipboardItem' in window && typeof navigator.clipboard?.write === 'function'
const canNativeShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function'

async function fetchCard(url: string): Promise<Blob> {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`Card returned ${response.status}`)
  const blob = await response.blob()
  if (!blob.type.startsWith('image/')) throw new Error('Card is not an image')
  return blob
}

export function ShareDialog({ target, open, onOpenChange }: Props) {
  const phone = useMediaQuery('(max-width: 639px)')
  if (!target) return null
  const body = <ShareBody target={target} phone={phone} />
  if (phone) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="rounded-t-xl p-4 pb-7">
          <SheetHeader className="p-0 pr-8">
            <SheetTitle>{target.title}</SheetTitle>
          </SheetHeader>
          {body}
        </SheetContent>
      </Sheet>
    )
  }
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* minmax(0, 1fr) keeps the dialog's single grid column from growing to fit a long link in the footer. */}
      <DialogContent className="grid-cols-[minmax(0,1fr)] sm:max-w-lg">
        <DialogHeader className="pr-8">
          <DialogTitle>{target.title}</DialogTitle>
        </DialogHeader>
        {body}
      </DialogContent>
    </Dialog>
  )
}

function ShareBody({ target, phone }: { target: ShareTarget; phone: boolean }) {
  const url = shareUrl(target)
  const image = cardImageUrl(target)
  const [imageState, setImageState] = useState<'loading' | 'ready' | 'missing'>('loading')
  const [copied, setCopied] = useState(false)
  const [busy, setBusy] = useState<'download' | 'copy' | 'share' | null>(null)
  const copiedTimer = useRef<number | undefined>(undefined)
  useEffect(() => () => window.clearTimeout(copiedTimer.current), [])

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      window.clearTimeout(copiedTimer.current)
      copiedTimer.current = window.setTimeout(() => setCopied(false), 2000)
      toast.success('Link copied.')
      return true
    } catch {
      toast.error('Could not copy. Grab the link from the box.')
      return false
    }
  }

  const download = async () => {
    setBusy('download')
    try {
      const blob = await fetchCard(image)
      const href = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = href
      a.download = cardFilename(target)
      a.click()
      URL.revokeObjectURL(href)
      toast.success('Saved.')
    } catch {
      toast.error('The card is not ready yet. Try again in a moment.')
    } finally {
      setBusy(null)
    }
  }

  const copyImage = async () => {
    setBusy('copy')
    try {
      const pending = fetchCard(image)
      try {
        // Safari needs the promise form to keep the user gesture; Chrome wants the blob.
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': pending })])
      } catch {
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': await pending })])
      }
      toast.success('Image copied.')
    } catch {
      toast.error('Could not copy the image. Download it instead.')
    } finally {
      setBusy(null)
    }
  }

  const openPlatform = async (platform: Platform) => {
    const intent = platformIntent(platform, url, target.text)
    if (intent) {
      window.open(intent, '_blank', 'noopener')
      return
    }
    // Discord has no share intent: copy the link, open Discord, paste it. The embed does the rest.
    if (await copyLink()) window.open(DISCORD_APP_URL, '_blank', 'noopener')
  }

  const nativeShare = async () => {
    setBusy('share')
    try {
      let files: File[] | undefined
      try {
        const blob = await fetchCard(image)
        const file = new File([blob], cardFilename(target), { type: blob.type })
        if (navigator.canShare?.({ files: [file] })) files = [file]
      } catch {
        files = undefined
      }
      await navigator.share({ title: target.title, text: target.text, url, ...(files ? { files } : {}) })
    } catch (error) {
      if (!(error instanceof DOMException && error.name === 'AbortError')) toast.error('Sharing did not go through.')
    } finally {
      setBusy(null)
    }
  }

  const imageAction = 'flex h-9 items-center justify-center gap-1.5 text-sm font-medium transition-colors hover:bg-muted disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-inset'

  return (
    <>
      <div className="overflow-hidden rounded-lg bg-card ring-1 ring-border">
        <div className="relative aspect-[1200/630] bg-background">
          {imageState !== 'missing' ? (
            <img
              src={image}
              alt={`${target.kind === 'rig' ? 'Rig' : 'Result'} card`}
              className={cn('h-full w-full object-cover transition-opacity', imageState === 'ready' ? 'opacity-100' : 'opacity-0')}
              onLoad={() => setImageState('ready')}
              onError={() => setImageState('missing')}
            />
          ) : null}
          {imageState !== 'ready' ? (
            <div className="absolute inset-0 flex items-center justify-center px-6 text-center text-xs text-muted-foreground">
              {imageState === 'loading' ? 'Rendering the card…' : 'The card renders on the deployed site. The link still unfurls with it.'}
            </div>
          ) : null}
        </div>
        <p className="border-t px-3 py-2.5 text-sm text-pretty">{target.text}</p>
        <div className="grid grid-cols-2 border-t">
          <button type="button" className={imageAction} disabled={busy != null} onClick={download}>
            <Download className="size-3.5" /> {phone ? 'Save image' : 'Download image'}
          </button>
          {canCopyImage ? (
            <button type="button" className={cn(imageAction, 'border-l')} disabled={busy != null} onClick={copyImage}>
              <Copy className="size-3.5" /> Copy image
            </button>
          ) : (
            <span className={cn(imageAction, 'border-l text-muted-foreground hover:bg-transparent')}>Copy image needs Chrome or Safari</span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {PLATFORMS.map((p) => (
          <Button
            key={p.id}
            variant="outline"
            className={cn('gap-2.5 px-3', phone ? 'h-11 justify-center' : 'h-9 justify-start')}
            onClick={() => void openPlatform(p.id)}
          >
            <SocialMark platform={p.id} /> {p.label}
          </Button>
        ))}
      </div>

      {phone ? (
        <div className="flex flex-col gap-2">
          <Button className="h-11 w-full" onClick={() => void copyLink()}>
            {copied ? <Check /> : <Link2 />} {copied ? 'Copied' : 'Copy link'}
          </Button>
          {canNativeShare ? (
            <Button variant="outline" className="h-11 w-full" disabled={busy === 'share'} onClick={() => void nativeShare()}>
              <Share /> More…
            </Button>
          ) : null}
        </div>
      ) : (
        <DialogFooter className="sm:flex-row sm:items-center">
          <LinkBox>{url}</LinkBox>
          <Button onClick={() => void copyLink()}>
            {copied ? <Check data-icon="inline-start" /> : <Link2 data-icon="inline-start" />} {copied ? 'Copied' : 'Copy link'}
          </Button>
        </DialogFooter>
      )}
    </>
  )
}

function LinkBox({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-8 min-w-0 flex-1 items-center overflow-hidden rounded-lg border border-input px-2.5 font-mono text-xs whitespace-nowrap text-muted-foreground">
      <span className="truncate">{children}</span>
    </div>
  )
}

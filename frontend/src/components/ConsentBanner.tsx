import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { ConsentPreferences } from '@/components/ConsentPreferences'
import { gutter, inset } from '@/components/frame'
import { acceptAllConsent, openConsentSettings, rejectAllConsent, useConsent } from '@/lib/consent'
import { cn } from '@/lib/utils'

/**
 * The first-layer bar, shown until a choice is stored. It takes the frame's width and inset so its
 * text lines up with the page above it, but draws no side guides of its own. The dialog is mounted
 * alongside it and stays available afterwards: the footer's Cookies link opens it for people who
 * already answered.
 */
export function ConsentBanner() {
  const { decided } = useConsent()
  return (
    <>
      {decided ? null : (
        <div
          role="region"
          aria-label="Cookie consent"
          className={cn('fixed inset-x-0 bottom-0 z-40 border-t bg-popover', gutter)}
        >
          <div className="mx-auto w-full max-w-[1600px]">
            <div
              className={cn(
                'flex flex-col gap-4 py-4 md:flex-row md:items-center md:justify-between md:gap-8',
                inset,
              )}
            >
              <p className="max-w-2xl text-sm text-muted-foreground">
                We use cookies to run this site and, with your consent, to understand how it is used. Everything except
                strictly necessary cookies stays off until you choose.{' '}
                <Link to="/privacy" className="text-foreground underline underline-offset-4">Privacy Policy</Link>.
              </p>
              <div className="flex shrink-0 flex-wrap items-center gap-2">
                <Button variant="ghost" onClick={openConsentSettings}>
                  Manage
                </Button>
                <Button variant="outline" onClick={rejectAllConsent}>
                  Reject all
                </Button>
                <Button onClick={acceptAllConsent}>Accept all</Button>
              </div>
            </div>
          </div>
        </div>
      )}
      <ConsentPreferences />
    </>
  )
}

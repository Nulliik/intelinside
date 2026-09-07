import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import {
  acceptAllConsent,
  closeConsentSettings,
  rejectAllConsent,
  saveConsent,
  useConsent,
  type Categories,
  type CookieCategory,
} from '@/lib/consent'
import { COOKIE_CATEGORIES } from '@/lib/cookies'

/**
 * The per-category dialog, reached from "Manage" on the banner or "Cookies" in the footer.
 * The list only mounts while the dialog is open, so each visit starts from the saved choice.
 */
function Panel({ saved }: { saved: Categories }) {
  const [draft, setDraft] = useState<Categories>(saved)
  return (
    <>
      <DialogHeader>
        <DialogTitle>Cookie settings</DialogTitle>
        <DialogDescription>
          Choose what this site may store on your device. Everything but the necessary items stays off until you turn it
          on. What each one does is listed in the <Link to="/privacy#cookies">privacy policy</Link>.
        </DialogDescription>
      </DialogHeader>

      <div className="-mx-4 max-h-[50vh] divide-y overflow-y-auto border-y">
        {COOKIE_CATEGORIES.map((cat) => (
          <div key={cat.key} className="flex items-start justify-between gap-4 px-4 py-3">
            <div className="min-w-0 space-y-1">
              <p className="text-sm font-medium text-foreground">{cat.label}</p>
              <p className="text-xs leading-relaxed text-muted-foreground">{cat.description}</p>
            </div>
            {cat.locked ? (
              <span className="shrink-0 pt-0.5 font-mono text-2xs uppercase tracking-label text-muted-foreground">
                Always on
              </span>
            ) : (
              <Switch
                className="mt-0.5 shrink-0"
                checked={draft[cat.key]}
                onCheckedChange={(checked: boolean) => setDraft((d) => ({ ...d, [cat.key as CookieCategory]: checked }))}
                aria-label={`${cat.label} storage`}
              />
            )}
          </div>
        ))}
      </div>

      <DialogFooter className="sm:justify-between">
        <Button variant="ghost" onClick={rejectAllConsent}>
          Reject all
        </Button>
        <div className="flex flex-col-reverse gap-2 sm:flex-row">
          <Button variant="outline" onClick={() => saveConsent(draft)}>
            Save choices
          </Button>
          <Button onClick={acceptAllConsent}>Accept all</Button>
        </div>
      </DialogFooter>
    </>
  )
}

export function ConsentPreferences() {
  const { settingsOpen, categories } = useConsent()
  return (
    <Dialog
      open={settingsOpen}
      onOpenChange={(open: boolean) => {
        if (!open) closeConsentSettings()
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <Panel saved={categories} />
      </DialogContent>
    </Dialog>
  )
}

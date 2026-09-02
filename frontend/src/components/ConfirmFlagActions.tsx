import { useState } from 'react'
import { BadgeCheck, Flag } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { api } from '@/lib/api'
import { ApiError, type FlagReason, type Result } from '@/lib/api/types'
import { useSession } from '@/hooks/useSession'

const REASONS: { value: FlagReason; label: string }[] = [
  { value: 'implausible', label: 'Numbers look implausible' },
  { value: 'wrong_hardware', label: 'Wrong hardware listed' },
  { value: 'duplicate', label: 'Duplicate entry' },
  { value: 'spam', label: 'Spam' },
  { value: 'other', label: 'Something else' },
]

/** Confirm and Flag for a result. Owners see neither; signed-out users get the sign-in prompt. */
export function ConfirmFlagActions({ result, onChange }: { result: Result; onChange: (next: Result) => void }) {
  const { user, requestSignIn } = useSession()
  const [flagOpen, setFlagOpen] = useState(false)
  const [reason, setReason] = useState<FlagReason>('implausible')
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const isOwner = user?.id === result.submitterId

  const guard = () => {
    if (!user) {
      requestSignIn()
      return false
    }
    return true
  }
  const handle = (e: unknown) => {
    toast.error(e instanceof ApiError ? e.message : 'That did not go through. Try again.')
  }

  const confirm = async () => {
    if (!guard()) return
    setBusy(true)
    try {
      const verification = await api.confirmResult(result.id)
      onChange({ ...result, verification })
      toast.success(verification.confirmedByMe ? 'Confirmed. Thanks for checking.' : 'Confirmation withdrawn.')
    } catch (e) {
      handle(e)
    } finally {
      setBusy(false)
    }
  }
  const flag = async () => {
    setBusy(true)
    try {
      const moderation = await api.flagResult(result.id, reason, note || undefined)
      onChange({ ...result, moderation })
      setFlagOpen(false)
      toast.success(moderation.flaggedByMe ? 'Flagged. The team will take a look.' : 'Flag withdrawn.')
    } catch (e) {
      handle(e)
    } finally {
      setBusy(false)
    }
  }

  if (isOwner) return null
  const confirmed = !!result.verification.confirmedByMe
  const flagged = !!result.moderation.flaggedByMe
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Tooltip>
        <TooltipTrigger render={<Button variant={confirmed ? 'secondary' : 'outline'} disabled={busy} onClick={confirm} />}>
          <BadgeCheck data-icon="inline-start" className={confirmed ? 'text-verified' : ''} />
          {confirmed ? 'Confirmed' : 'Confirm'}
          <span className="font-mono text-xs text-muted-foreground">{result.verification.confirmations}</span>
        </TooltipTrigger>
        <TooltipContent className="max-w-64 text-pretty">
          {confirmed
            ? 'You vouched for this result. Click again to withdraw your confirmation.'
            : 'Confirm only if you reproduced this number, or checked the linked repo and the setup adds up. Enough confirmations make a result community-verified.'}
        </TooltipContent>
      </Tooltip>
      <Button
        variant={flagged ? 'secondary' : 'ghost'}
        disabled={busy}
        onClick={() => {
          if (!guard()) return
          if (flagged) void flag()
          else setFlagOpen(true)
        }}
      >
        <Flag data-icon="inline-start" className={flagged ? 'text-warning' : ''} />
        {flagged ? 'Flagged' : 'Flag'}
      </Button>
      <Dialog open={flagOpen} onOpenChange={setFlagOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Flag this result</DialogTitle>
            <DialogDescription>Past a few flags the entry is hidden until the team reviews it. Say what looks off.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label>Reason</Label>
              <Select value={reason} onValueChange={(v) => v && setReason(v as FlagReason)} items={REASONS}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {REASONS.map((r) => (
                    <SelectItem key={r.value} value={r.value}>
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="flag-note">Note (optional)</Label>
              <Textarea id="flag-note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="What did you check?" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFlagOpen(false)}>
              Cancel
            </Button>
            <Button onClick={flag} disabled={busy}>
              Flag result
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

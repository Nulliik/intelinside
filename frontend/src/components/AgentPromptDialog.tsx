import { useEffect, useRef, useState, type ReactNode } from 'react'
import { toast } from 'sonner'
import { Check, Copy, ExternalLink, GitPullRequest } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Label } from '@/components/ui/label'
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { agentPrompt } from '@/lib/agentPrompt'
import { REPO, REPO_URL, RESULTS_DIR_URL } from '@/lib/brand'
import { RESULTS_DIR } from '@/lib/pr'
import { cn } from '@/lib/utils'
import type { RigSummary } from '@/lib/api/types'

/*
  Hand the run to a coding agent instead of typing it in. The dialog only produces text: the agent opens the pull
  request, the repo's check comments the `/submit?pr=N` link, and that link brings the person back to this form with
  the file read in. Nothing here talks to GitHub.

  The prompt names the rig, so it needs one; someone with no rigs is sent to the form to register it first.
*/

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  handle: string
  rigs: RigSummary[]
  rigId: string
  onRigChange: (rigId: string) => void
}

const STEPS = [
  'Your agent opens the pull request.',
  'The check validates it and comments a link.',
  'You open the link, check the numbers, and submit.',
]

export function AgentPromptDialog({ open, onOpenChange, handle, rigs, rigId, onRigChange }: Props) {
  // A bottom sheet on phones, like the share dialog.
  const phone = useMediaQuery('(max-width: 639px)')
  const description = (
    <>
      Your agent writes the result file and opens a pull request on{' '}
      <a href={REPO_URL} target="_blank" rel="noreferrer">
        {REPO}
      </a>
      . The check validates it and comments with a link that finishes the submission here.
    </>
  )
  const body = <AgentPromptBody handle={handle} rigs={rigs} rigId={rigId} onRigChange={onRigChange} phone={phone} />
  if (phone)
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="max-h-[90dvh] overflow-y-auto rounded-t-xl p-4 pb-7">
          <SheetHeader className="p-0 pr-8">
            <SheetTitle>Submit with an agent</SheetTitle>
            <SheetDescription>{description}</SheetDescription>
          </SheetHeader>
          {body}
        </SheetContent>
      </Sheet>
    )
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* minmax(0, 1fr) keeps the single grid column from growing to fit the prompt's longest line, and the
          height cap keeps the whole dialog on screen on a short laptop rather than running off both ends. */}
      <DialogContent className="max-h-[calc(100dvh-4rem)] grid-cols-[minmax(0,1fr)] overflow-y-auto sm:max-w-xl">
        <DialogHeader className="pr-8">
          <DialogTitle>Submit with an agent</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {body}
      </DialogContent>
    </Dialog>
  )
}

function AgentPromptBody({ handle, rigs, rigId, onRigChange, phone }: Omit<Props, 'open' | 'onOpenChange'> & { phone: boolean }) {
  const [copied, setCopied] = useState(false)
  const copiedTimer = useRef<number | undefined>(undefined)
  useEffect(() => () => window.clearTimeout(copiedTimer.current), [])

  const rig = rigs.find((r) => r.id === rigId)
  const prompt = rig ? agentPrompt({ handle, rigId: rig.id, rigName: rig.name }) : null

  const copy = async () => {
    if (!prompt) return
    try {
      await navigator.clipboard.writeText(prompt)
      setCopied(true)
      window.clearTimeout(copiedTimer.current)
      copiedTimer.current = window.setTimeout(() => setCopied(false), 2000)
      toast.success('Prompt copied.')
    } catch {
      toast.error('Could not copy. Select the prompt and copy it by hand.')
    }
  }

  return (
    <div className="grid gap-4">
      <div className="grid gap-1.5">
        <Label htmlFor="agent-rig">Rig</Label>
        <NativeSelect className="w-full sm:w-72" id="agent-rig" value={rigId} onChange={(e) => onRigChange(e.target.value)}>
          <NativeSelectOption value="">{rigs.length ? 'Pick a rig' : 'No rigs yet'}</NativeSelectOption>
          {rigs.map((r) => (
            <NativeSelectOption key={r.id} value={r.id}>
              {r.name}
            </NativeSelectOption>
          ))}
        </NativeSelect>
        <p className="text-xs text-muted-foreground">
          {!rigs.length
            ? 'Register the rig you ran on first, in step 1 below. The prompt has to name it.'
            : rig
              ? 'The prompt names this rig, so the agent attaches the run to the right machine.'
              : 'Pick the rig you ran on and the prompt fills itself in.'}
        </p>
      </div>

      {prompt ? (
        <>
          <div className="grid gap-2">
            <div className="flex items-center justify-between gap-3">
              <span className="font-sans text-xs font-medium uppercase tracking-label text-muted-foreground">Prompt for your agent</span>
              <span className="flex min-w-0 items-center gap-1.5 font-mono text-xs text-muted-foreground">
                <GitPullRequest className="size-3.5 shrink-0" aria-hidden />
                <span className="truncate">
                  {RESULTS_DIR}/{handle}/
                </span>
              </span>
            </div>
            <pre className="max-h-52 overflow-y-auto rounded-lg border bg-background p-3.5 font-mono text-xs leading-[1.5] break-words whitespace-pre-wrap text-muted-foreground">
              {prompt}
            </pre>
          </div>
          <div className={cn('flex items-center gap-3.5', phone && 'flex-col-reverse items-stretch gap-2')}>
            <Button className={phone ? 'h-11 w-full' : undefined} onClick={() => void copy()}>
              {copied ? <Check data-icon="inline-start" /> : <Copy data-icon="inline-start" />} {copied ? 'Copied' : 'Copy prompt'}
            </Button>
            <a
              href={RESULTS_DIR_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
            >
              Read the format <ExternalLink className="size-3.5" aria-hidden />
            </a>
          </div>
        </>
      ) : null}

      <div className="grid gap-2.5 border-t pt-4">
        <span className="font-sans text-xs font-medium uppercase tracking-label text-muted-foreground">What happens next</span>
        <ol className="grid gap-2">
          {STEPS.map((step, i) => (
            <Step key={step} n={i + 1}>
              {step}
            </Step>
          ))}
        </ol>
      </div>
    </div>
  )
}

function Step({ n, children }: { n: number; children: ReactNode }) {
  return (
    <li className="flex gap-2.5">
      <span className="w-2.5 shrink-0 font-mono text-xs leading-5 text-muted-foreground">{n}</span>
      <span className="text-sm text-muted-foreground">{children}</span>
    </li>
  )
}

import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { Pencil, Share2, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ResultCard } from '@/components/ResultCard'
import { ConfirmFlagActions } from '@/components/ConfirmFlagActions'
import { ErrorState } from '@/components/ErrorState'
import { Block, Section, inset } from '@/components/frame'
import { useAsync } from '@/hooks/useAsync'
import { useCatalog } from '@/hooks/useCatalog'
import { usePageTitle } from '@/hooks/usePageTitle'
import { useSession } from '@/hooks/useSession'
import { api } from '@/lib/api'
import { ApiError } from '@/lib/api/types'
import { fmtTps } from '@/lib/format'
import { QUANT_BY_ID } from '@/mocks/catalog'
import { cn } from '@/lib/utils'

export default function ResultDetail() {
  const { resultId = '' } = useParams()
  const navigate = useNavigate()
  const { user } = useSession()
  const res = useAsync(() => api.result(resultId), [resultId])
  const cat = useCatalog()
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [busy, setBusy] = useState(false)
  const model = cat.data?.models.find((m) => m.id === res.data?.modelId)
  usePageTitle(res.data && model ? `${fmtTps(res.data.decodeTps)} tok/s · ${model.name}` : 'Result')
  if (res.error)
    return (
      <Block>
        <ErrorState error={res.error} />
      </Block>
    )
  if (!res.data || !cat.data)
    return (
      <Block>
        <Skeleton className="h-96" />
      </Block>
    )
  const r = res.data
  const isOwner = user?.id === r.submitterId
  const quant = QUANT_BY_ID[r.quant]?.label ?? r.quant

  const share = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      toast.success('Link copied.')
    } catch {
      toast.error('Could not copy. Grab the URL from the address bar.')
    }
  }
  const remove = async () => {
    setBusy(true)
    try {
      await api.deleteResult(r.id)
      toast.success('Result deleted.')
      navigate(`/rigs/${r.rigId}`)
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Could not delete the result.')
      setBusy(false)
    }
  }

  return (
    <div>
      <div className={cn('py-8 md:py-10', inset)}>
        <div className="text-sm text-muted-foreground">
          <Link to={`/models/${r.modelId}/${r.quant}`} className="hover:text-foreground">{model?.name ?? r.modelId}</Link>
          <span className="mx-2">/</span>
          <span className="font-mono">{quant}</span>
          <span className="mx-2">/</span>
          <Link to={`/rigs/${r.rigId}`} className="hover:text-foreground">{r.rig?.name}</Link>
        </div>
        {r.moderation.hidden ? (
          <Alert className="mt-6">
            <AlertTitle>Hidden pending review</AlertTitle>
            <AlertDescription>
              Only you can see this result. It was flagged {r.moderation.flags} times{r.moderation.reasons?.length ? ` for: ${r.moderation.reasons.join(', ').replaceAll('_', ' ')}` : ''}. The team will review it.
            </AlertDescription>
          </Alert>
        ) : null}
      </div>
      <Section rule="both">
        <ResultCard
          result={r}
          models={cat.data.models}
          quants={cat.data.quants}
          runtimes={cat.data.runtimes}
          rank={r.rank}
          footer={
            <>
              <ConfirmFlagActions result={r} onChange={(next) => res.setData((prev) => ({ ...(prev ?? next), ...next }))} />
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={share}><Share2 data-icon="inline-start" /> Share</Button>
                {isOwner ? (
                  <>
                    <Button variant="outline" render={<Link to={`/results/${r.id}/edit`} />} nativeButton={false}><Pencil data-icon="inline-start" /> Edit</Button>
                    <Button variant="ghost" onClick={() => setConfirmDelete(true)}><Trash2 data-icon="inline-start" /> Delete</Button>
                  </>
                ) : null}
              </div>
            </>
          }
        />
      </Section>
      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete this result?</DialogTitle>
            <DialogDescription>It leaves the board immediately. There is no undo.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDelete(false)}>Cancel</Button>
            <Button variant="destructive" disabled={busy} onClick={remove}>Delete result</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

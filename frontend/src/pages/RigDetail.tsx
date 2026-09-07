import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { PageHeader } from '@/components/PageHeader'
import { IconAction } from '@/components/IconAction'
import { ShareIconButton } from '@/components/ShareIconButton'
import { RigPhoto } from '@/components/RigPhoto'
import { UserLink } from '@/components/UserLink'
import { HardwareLink } from '@/components/HardwareLink'
import { TpsBarChart } from '@/components/TpsBarChart'
import { ResultsTable } from '@/components/ResultsTable'
import { keySpec } from '@/components/cards'
import { EmptyState } from '@/components/EmptyState'
import { ErrorState } from '@/components/ErrorState'
import { SealedBoard, sealedLabel } from '@/components/launch'
import { Block, Cell, Framed, Section, inset } from '@/components/frame'
import { useAsync } from '@/hooks/useAsync'
import { useCatalog } from '@/hooks/useCatalog'
import { useSealed } from '@/hooks/useSealed'
import { usePageTitle } from '@/hooks/usePageTitle'
import { useSession } from '@/hooks/useSession'
import { api } from '@/lib/api'
import { ApiError } from '@/lib/api/types'
import { fmtDate, fmtWeekday, pluralize } from '@/lib/format'
import { rigShareTarget } from '@/lib/share'
import { UNIT_LABEL, nestParts } from '@/lib/hardware'
import { HARDWARE_TYPE_LABEL } from '@/catalog'
import { cn } from '@/lib/utils'

export default function RigDetail() {
  const { rigId = '' } = useParams()
  const navigate = useNavigate()
  const { user } = useSession()
  const rig = useAsync(() => api.rig(rigId), [rigId])
  const cat = useCatalog()
  const { sealed, revealAt } = useSealed()
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [busy, setBusy] = useState(false)
  usePageTitle(rig.data?.name)
  if (rig.error)
    return (
      <Block>
        <ErrorState error={rig.error} />
      </Block>
    )
  if (!rig.data || !cat.data)
    return (
      <Block>
        <Skeleton className="h-96" />
      </Block>
    )
  const r = rig.data
  const isOwner = user?.id === r.ownerId
  const visibleResults = r.results.filter((x) => !x.moderation.hidden)
  const visible = visibleResults.length
  const bestResult = visibleResults.reduce<(typeof visibleResults)[number] | undefined>((best, x) => (!best || x.decodeTps > best.decodeTps ? x : best), undefined)
  const shareTarget = rigShareTarget(
    r,
    bestResult
      ? {
          tps: bestResult.decodeTps,
          model: cat.data.models.find((m) => m.id === bestResult.modelId)?.name,
          quant: cat.data.quants.find((q) => q.id === bestResult.quant)?.label,
        }
      : undefined,
  )

  const remove = async () => {
    setBusy(true)
    try {
      await api.deleteRig(r.id)
      toast.success('Rig deleted.')
      navigate('/rigs')
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Could not delete the rig.')
      setBusy(false)
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow={r.os || 'Rig'}
        title={r.name}
        description={r.summary}
        actions={
          <>
            <ShareIconButton target={shareTarget} />
            {isOwner ? (
              <>
                <IconAction label="Edit" to={`/rigs/${r.id}/edit`}>
                  <Pencil />
                </IconAction>
                <IconAction label="Delete" onClick={() => setConfirmDelete(true)}>
                  <Trash2 />
                </IconAction>
                <Button render={<Link to={`/submit?rig=${r.id}`} />} nativeButton={false}>
                  <Plus data-icon="inline-start" /> Submit a result
                </Button>
              </>
            ) : null}
          </>
        }
      >
        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
          <UserLink user={r.owner} />
          <span>added {fmtDate(r.createdAt)}</span>
          {sealed ? null : <span>{pluralize(visible, 'result')}</span>}
        </div>
      </PageHeader>

      <Section>
        <div className="grid gap-px bg-border md:grid-cols-[minmax(0,1fr)_420px]">
          <Cell className="p-0 md:p-0">
            {r.notes ? <p className={cn('border-b py-5 text-sm text-pretty', inset)}>{r.notes}</p> : null}
            <ul className="divide-y">
              {nestParts(r.components).map(({ part: c, host }) => (
                <li key={c.hardwareId} className={cn('flex items-center justify-between gap-4 py-3.5 text-sm', inset, host && 'pl-10 md:pl-14')}>
                  <div className="min-w-0">
                    {c.hardware ? <HardwareLink hardware={c.hardware} quantity={c.quantity} className="font-medium" /> : c.hardwareId}
                    {c.hardware ? (
                      <div className="text-xs text-muted-foreground">
                        {host ? `${UNIT_LABEL[c.hardware.type]} on the ${host.name} package` : HARDWARE_TYPE_LABEL[c.hardware.type]} · {keySpec(c.hardware)}
                      </div>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          </Cell>
          <Cell>
            <div className="aspect-[16/10] overflow-hidden rounded-xl">
              <RigPhoto id={r.id} photoUrl={r.photoUrl} alt={r.name} />
            </div>
          </Cell>
        </div>
      </Section>

      {sealed && revealAt ? (
        <Section label="Results" action={sealedLabel(revealAt)}>
          <SealedBoard
            revealAt={revealAt}
            variant="chart"
            lead={`Results for this rig are sealed until ${fmtWeekday(revealAt)}.`}
            ask={isOwner ? "Post what it does and you're on the board when it goes live." : "Post what yours does and you're on the board when it goes live."}
            submitTo={isOwner ? `/submit?rig=${r.id}` : '/submit'}
          />
        </Section>
      ) : (
        <>
          <Section label="Best decode tok/s per model, quant, and part">
            <Framed>
              <TpsBarChart bars={r.chart} runtimes={cat.data.runtimes} />
            </Framed>
          </Section>

          <Section label="Results">
            {r.results.length ? (
              <ResultsTable results={r.results} runtimes={cat.data.runtimes} models={cat.data.models} quants={cat.data.quants} showSubmitter={false} />
            ) : (
              <EmptyState title="No results for this rig yet" action={isOwner ? <Button render={<Link to={`/submit?rig=${r.id}`} />} nativeButton={false}>Submit the first</Button> : undefined} />
            )}
          </Section>
        </>
      )}

      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {r.name}?</DialogTitle>
            <DialogDescription>This also deletes every result submitted for this rig. There is no undo.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDelete(false)}>Cancel</Button>
            <Button variant="destructive" disabled={busy} onClick={remove}>Delete rig and results</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

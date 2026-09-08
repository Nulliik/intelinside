import { useEffect, useState } from 'react'
import { Link, Navigate, useParams, useSearchParams } from 'react-router-dom'
import { BarChart3, ExternalLink, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { PageHeader } from '@/components/PageHeader'
import { LeaderboardTable } from '@/components/LeaderboardTable'
import { TpsBarChart } from '@/components/TpsBarChart'
import { RuntimeMark } from '@/components/RuntimeMark'
import { ModelLogo } from '@/components/ModelLogo'
import { EmptyBoard } from '@/components/empty'
import { EmptyState } from '@/components/EmptyState'
import { ErrorState } from '@/components/ErrorState'
import { LoadMore } from '@/components/LoadMore'
import { Block, Framed, PillTabs, Section, Toolbar, inset } from '@/components/frame'
import { useAsync } from '@/hooks/useAsync'
import { useCatalog } from '@/hooks/useCatalog'
import { usePageTitle } from '@/hooks/usePageTitle'
import { useSession } from '@/hooks/useSession'
import { api } from '@/lib/api'
import type { BoardKind, BoardRow, HardwareType, VerificationStatus } from '@/lib/api/types'
import { HARDWARE_TYPE_LABEL, HARDWARE_TYPES, QUANT_BY_ID, VENDORS, quantHint } from '@/catalog'
import { cn } from '@/lib/utils'

const ALL = 'all'
const vendorItems = [{ value: ALL, label: 'All vendors' }, ...VENDORS.map((v) => ({ value: v, label: v }))]
const typeItems = [{ value: ALL, label: 'All types' }, ...HARDWARE_TYPES.map((t) => ({ value: t, label: HARDWARE_TYPE_LABEL[t] }))]
const verificationItems = [
  { value: ALL, label: 'Any status' },
  { value: 'community_verified', label: 'Verified only' },
  { value: 'self_reported', label: 'Self-reported only' },
]

export default function Board() {
  const { modelId = '', quant } = useParams()
  const [sp, setSp] = useSearchParams()
  const cat = useCatalog()
  const { user, requestSignIn } = useSession()
  const model = cat.data?.models.find((m) => m.id === modelId)

  const kind = (sp.get('kind') as BoardKind) || 'rigs'
  const runtime = sp.get('runtime')?.split(',').filter(Boolean) ?? []
  const vendor = sp.get('vendor') ?? ''
  const type = sp.get('type') ?? ''
  const verification = sp.get('verification') ?? ''
  // Off by default: the board is a hardware comparison, so a changed runtime is opt-in rather than mixed in.
  const includeModified = sp.get('modified') === '1'
  const q = sp.get('q') ?? ''
  const update = (patch: Record<string, string | undefined>) => {
    const next = new URLSearchParams(sp)
    for (const [k, v] of Object.entries(patch)) {
      if (!v || v === ALL) next.delete(k)
      else next.set(k, v)
    }
    setSp(next, { replace: true })
  }
  const params = {
    kind,
    runtime,
    vendor: vendor || undefined,
    type: (type || undefined) as HardwareType | undefined,
    verification: (verification || undefined) as VerificationStatus | undefined,
    includeModified,
    q: q || undefined,
  }

  const quantLabel = quant ? QUANT_BY_ID[quant]?.label ?? quant : ''
  usePageTitle(model ? `${model.name} ${quantLabel}` : 'Board')

  const board = useAsync(
    () => (quant ? api.board(modelId, quant, params) : Promise.reject(new Error('no quant'))),
    [modelId, quant, kind, runtime.join(','), vendor, type, verification, includeModified, q],
  )
  const [extra, setExtra] = useState<BoardRow[]>([])
  const [cursor, setCursor] = useState<string | undefined>()
  const [showChart, setShowChart] = useState(false)
  useEffect(() => {
    setExtra([])
    setCursor(board.data?.nextCursor)
  }, [board.data])

  if (!quant) {
    if (cat.loading)
      return (
        <Block>
          <Skeleton className="h-40" />
        </Block>
      )
    if (!model)
      return (
        <Block>
          <ErrorState error={new Error('No such model.')} />
        </Block>
      )
    const best = model.quants.slice().sort((a, b) => (model.resultCounts?.[b] ?? 0) - (model.resultCounts?.[a] ?? 0))[0]
    return <Navigate replace to={`/models/${model.id}/${best}`} />
  }

  const rows = [...(board.data?.items ?? []), ...extra]
  const runtimes = cat.data?.runtimes ?? []
  const filtered = runtime.length > 0 || !!vendor || !!type || !!verification || !!q
  const submit = user ? (
    <Button render={<Link to={`/submit?model=${modelId}&quant=${quant}`} />} nativeButton={false}>
      Submit a result
    </Button>
  ) : (
    <Button onClick={() => requestSignIn('/submit')}>Submit a result</Button>
  )

  return (
    <div>
      <PageHeader
        eyebrow={model ? `${model.family} · ${model.params}${model.architecture === 'moe' ? ` · MoE, ${model.activeParams} active` : ''}` : 'Board'}
        title={
          <span className="inline-flex flex-wrap items-center gap-x-3">
            {model ? <ModelLogo model={model} size="lg" /> : null}
            {model?.name ?? modelId}
            <span className="font-mono text-xl">{quantLabel}</span>
          </span>
        }
        actions={
          <>
            {model ? (
              <Button variant="ghost" render={<a href={model.sourceUrl} target="_blank" rel="noreferrer" />} nativeButton={false}>
                Model card <ExternalLink data-icon="inline-end" />
              </Button>
            ) : null}
            {submit}
          </>
        }
      >
        {model ? (
          <div className="mt-5">
            <div className="mb-1.5 text-xs font-medium uppercase tracking-label text-muted-foreground">Quantization</div>
            <PillTabs
              className="-ml-3"
              value={quant}
              items={model.quants.map((qid) => ({
                value: qid,
                label: <span className="font-mono">{QUANT_BY_ID[qid]?.label ?? qid}</span>,
                count: model.resultCounts?.[qid] ?? 0,
                to: `/models/${model.id}/${qid}${sp.toString() ? `?${sp}` : ''}`,
                hint: `${quantHint(qid)} · ${model.resultCounts?.[qid] ?? 0} results`,
              }))}
            />
          </div>
        ) : null}
      </PageHeader>

      <Section>
        <Toolbar>
          <PillTabs<BoardKind>
            className="-ml-3"
            value={kind}
            onChange={(v) => update({ kind: v, type: undefined })}
            items={[
              { value: 'rigs', label: 'Rigs' },
              { value: 'components', label: 'Components' },
            ]}
          />
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => update({ q: e.target.value })} placeholder="Search hardware or people" className="w-56 pl-8" />
          </div>
          <Select value={vendor || ALL} onValueChange={(v) => update({ vendor: String(v) })} items={vendorItems}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>{vendorItems.map((i) => <SelectItem key={i.value} value={i.value}>{i.label}</SelectItem>)}</SelectContent>
          </Select>
          {kind === 'components' ? (
            <Select value={type || ALL} onValueChange={(v) => update({ type: String(v) })} items={typeItems}>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>{typeItems.map((i) => <SelectItem key={i.value} value={i.value}>{i.label}</SelectItem>)}</SelectContent>
            </Select>
          ) : null}
          <Select value={verification || ALL} onValueChange={(v) => update({ verification: String(v) })} items={verificationItems}>
            <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
            <SelectContent>{verificationItems.map((i) => <SelectItem key={i.value} value={i.value}>{i.label}</SelectItem>)}</SelectContent>
          </Select>
          <label className="flex items-center gap-2 whitespace-nowrap text-sm text-muted-foreground">
            <Switch
              checked={includeModified}
              onCheckedChange={(on) => update({ modified: on ? '1' : undefined })}
              aria-label="Include results from modified runtimes"
            />
            Include modified
          </label>
          <Button variant="outline" size="sm" className="md:hidden" onClick={() => setShowChart((s) => !s)}>
            <BarChart3 data-icon="inline-start" /> {showChart ? 'Hide chart' : 'Chart'}
          </Button>
        </Toolbar>
        <Toolbar>
          <ToggleGroup multiple value={runtime} onValueChange={(v) => update({ runtime: (v as string[]).join(',') })} variant="outline" size="sm" className="flex-wrap">
            {runtimes.map((r) => (
              <ToggleGroupItem key={r.id} value={r.id} aria-label={r.name}>
                <RuntimeMark runtime={r} size="sm" /> {r.name}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </Toolbar>

        {board.error ? (
          <Block>
            <ErrorState error={board.error} />
          </Block>
        ) : null}

        {board.loading && !board.data ? (
          <Block className="space-y-4">
            <Skeleton className="h-64" />
            <Skeleton className="h-96" />
          </Block>
        ) : board.data ? (
          rows.length ? (
            <>
              <div className={cn(showChart ? 'block' : 'hidden md:block', 'border-b')}>
                <Framed>
                  <TpsBarChart bars={board.data.chart} runtimes={runtimes} />
                </Framed>
              </div>
              <div className={cn('border-b py-2.5 text-xs text-muted-foreground', inset)}>
                {board.data.board.total} {kind === 'rigs' ? 'rigs' : 'components'} ranked · best entry per {kind === 'rigs' ? 'rig' : 'part and quantity'} · earliest run wins ties
              </div>
              <LeaderboardTable rows={rows} runtimes={runtimes} />
              {cursor ? (
                <Block className="py-4">
                  <LoadMore
                    hasMore={!!cursor}
                    onLoad={async () => {
                      const page = await api.board(modelId, quant, { ...params, cursor })
                      setExtra((e) => [...e, ...page.items])
                      setCursor(page.nextCursor)
                    }}
                  />
                </Block>
              ) : null}
            </>
          ) : (
            // A filter that matches nothing is not an empty board, so it keeps the plain message.
            filtered ? (
              <EmptyState
                title={`Nothing matches on the ${model?.name ?? modelId} ${quantLabel} ${kind} board`}
                description="Try clearing a filter."
                action={submit}
              />
            ) : (
              <EmptyBoard
                variant="chart"
                lead={`No results yet for ${model?.name ?? modelId} ${quantLabel}.`}
                submitTo={`/submit?model=${modelId}&quant=${quant}`}
              />
            )
          )
        ) : null}
      </Section>
    </div>
  )
}

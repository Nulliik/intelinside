import { ExternalLink, GitFork, Plus } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { PageHeader } from '@/components/PageHeader'
import { RuntimeMark } from '@/components/RuntimeMark'
import { ResultsTable } from '@/components/ResultsTable'
import { EmptyState } from '@/components/EmptyState'
import { ErrorState } from '@/components/ErrorState'
import { SealedBoard } from '@/components/launch'
import { Cell, CellGrid, Section } from '@/components/frame'
import { customRuntimeHref } from '@/components/CustomRuntimeLink'
import { useAsync } from '@/hooks/useAsync'
import { useCatalog } from '@/hooks/useCatalog'
import { usePageTitle } from '@/hooks/usePageTitle'
import { useSealed } from '@/hooks/useSealed'
import { useSession } from '@/hooks/useSession'
import { api } from '@/lib/api'
import { fmtInt } from '@/lib/format'

/** One runtime: what it is, the customRuntimes people have made of it, and the fastest stock runs on it. */
export default function RuntimeDetail() {
  const { runtimeId } = useParams()
  const { sealed, revealAt } = useSealed()
  const { user, requestSignIn } = useSession()
  const cat = useCatalog()
  const customRuntimes = useAsync(() => (runtimeId ? api.customRuntimes({ runtime: runtimeId }) : Promise.resolve(null)), [runtimeId])
  const results = useAsync(
    () => (runtimeId && !sealed ? api.results({ runtime: runtimeId, limit: 10 }) : Promise.resolve(null)),
    [runtimeId, sealed],
  )
  const runtime = cat.data?.runtimes.find((r) => r.id === runtimeId)
  usePageTitle(runtime?.name ?? 'Runtime')

  if (customRuntimes.error) return <ErrorState error={customRuntimes.error} />
  if (cat.data && !runtime) return <ErrorState error={new Error('No such runtime.')} />

  const register = user ? (
    <Button variant="outline" render={<Link to={`/runtimes/${runtimeId}/custom/new`} />} nativeButton={false}>
      <Plus data-icon="inline-start" /> Register a custom runtime
    </Button>
  ) : (
    <Button variant="outline" onClick={() => requestSignIn(`/runtimes/${runtimeId}/custom/new`)}>
      <Plus data-icon="inline-start" /> Register a custom runtime
    </Button>
  )

  const items = customRuntimes.data?.items ?? []

  return (
    <div>
      <PageHeader
        eyebrow={<Link to="/runtimes" className="hover:text-foreground">Runtimes</Link>}
        title={
          <span className="inline-flex flex-wrap items-center gap-3">
            {runtime ? <RuntimeMark runtime={runtime} size="lg" /> : null}
            {runtime ? runtime.name : <Skeleton className="h-9 w-56" />}
          </span>
        }
        description="Results on the released runtime rank on the ordinary boards. Custom runtimes made from it rank among each other."
        actions={register}
      >
        {runtime?.repoUrl ? (
          <a
            href={runtime.repoUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-4 inline-flex items-center gap-1 font-mono text-xs text-muted-foreground hover:text-foreground"
          >
            {runtime.repoUrl.replace(/^https?:\/\/(www\.)?/, '')}
            <ExternalLink className="size-3 shrink-0" />
          </a>
        ) : null}
      </PageHeader>

      <Section label={`Builds of ${runtime?.name ?? 'this runtime'}`}>
        {items.length ? (
          <CellGrid cols={3}>
            {items.map((b) => (
              <Cell key={b.id}>
                <Link to={customRuntimeHref(b)} className="inline-flex items-center gap-2 font-heading text-base font-semibold text-warning hover:underline underline-offset-4">
                  <GitFork className="size-3.5 shrink-0" /> {b.name}
                </Link>
                <p className="mt-2 text-sm text-muted-foreground text-pretty">{b.summary}</p>
                <div className="mt-2 text-xs text-muted-foreground">
                  {b.owner?.handle ?? 'unknown'}
                  {sealed ? null : <> · <span className="font-mono tnum">{fmtInt(b.resultsCount ?? 0)}</span> {b.resultsCount === 1 ? 'result' : 'results'}</>}
                </div>
              </Cell>
            ))}
          </CellGrid>
        ) : customRuntimes.loading ? (
          <CellGrid cols={3}>
            {Array.from({ length: 3 }).map((_, i) => <Cell key={i}><Skeleton className="h-20" /></Cell>)}
          </CellGrid>
        ) : (
          <EmptyState
            title={`Nobody has built on ${runtime?.name ?? 'it'} yet.`}
            description="If you changed it — a custom kernel or op, a patch, a fork — register it and the results you get on it collect in one place."
            action={register}
          />
        )}
      </Section>

      <Section label="Fastest on this runtime">
        {sealed && revealAt ? (
          <SealedBoard revealAt={revealAt} variant="chart" />
        ) : results.data?.items.length ? (
          <ResultsTable
            results={results.data.items}
            runtimes={cat.data?.runtimes ?? []}
            models={cat.data?.models ?? []}
            quants={cat.data?.quants ?? []}
          />
        ) : results.loading ? (
          <CellGrid cols={1}><Cell><Skeleton className="h-32" /></Cell></CellGrid>
        ) : (
          <EmptyState title="No results on it yet." description="Be the first to post a number from this runtime." />
        )}
      </Section>
    </div>
  )
}

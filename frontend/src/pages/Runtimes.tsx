import { Link } from 'react-router-dom'
import { GitFork, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { PageHeader } from '@/components/PageHeader'
import { RuntimeMark } from '@/components/RuntimeMark'
import { ErrorState } from '@/components/ErrorState'
import { EmptyState } from '@/components/EmptyState'
import { Cell, CellGrid, Section } from '@/components/frame'
import { buildHref } from '@/components/BuildLink'
import { useAsync } from '@/hooks/useAsync'
import { usePageTitle } from '@/hooks/usePageTitle'
import { useSealed } from '@/hooks/useSealed'
import { useSession } from '@/hooks/useSession'
import { api } from '@/lib/api'
import { fmtInt } from '@/lib/format'

/**
 * The runtimes index. Runtimes were catalog rows with no pages until builds needed somewhere to live; this is that
 * somewhere. Counts sit out launch week with everything else that depends on participation.
 */
export default function Runtimes() {
  const { sealed } = useSealed()
  const { user, requestSignIn } = useSession()
  const summaries = useAsync(() => api.runtimeSummaries(), [])
  const builds = useAsync(() => api.customRuntimes(), [])
  usePageTitle('Runtimes')

  if (summaries.error) return <ErrorState error={summaries.error} />
  const items = summaries.data
  const newest = builds.data?.items.slice(0, 6) ?? []

  const register = user ? (
    <Button variant="outline" render={<Link to="/runtimes/builds/new" />} nativeButton={false}>
      <Plus data-icon="inline-start" /> Register a build
    </Button>
  ) : (
    <Button variant="outline" onClick={() => requestSignIn('/runtimes/builds/new')}>
      <Plus data-icon="inline-start" /> Register a build
    </Button>
  )

  return (
    <div>
      <PageHeader
        eyebrow="Runtimes"
        title="The engines, and what people have done to them."
        description="Each runtime is seeded from the catalog. Anyone can register a build on top of one — a fork, a patch, a custom kernel — and post results against it. Boards rank stock runs against each other; builds rank among themselves."
        actions={register}
      />

      <Section label="All runtimes">
        <CellGrid cols={3}>
          {items
            ? items.map((r) => (
                <Cell key={r.id}>
                  <Link to={`/runtimes/${r.id}`} className="flex items-center gap-2.5 hover:underline underline-offset-4">
                    <RuntimeMark runtime={r} />
                    <span className="font-heading text-base font-semibold">{r.name}</span>
                  </Link>
                  <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted-foreground">
                    {sealed ? (
                      <span>Results hidden until the board goes live</span>
                    ) : (
                      <>
                        <span><span className="font-mono text-foreground tnum">{fmtInt(r.resultsCount)}</span> {r.resultsCount === 1 ? 'result' : 'results'}</span>
                        {r.buildsCount ? (
                          <span><span className="font-mono text-foreground tnum">{fmtInt(r.buildsCount)}</span> {r.buildsCount === 1 ? 'build' : 'builds'}</span>
                        ) : (
                          <span>no builds yet</span>
                        )}
                      </>
                    )}
                  </div>
                </Cell>
              ))
            : Array.from({ length: 6 }).map((_, i) => (
                <Cell key={i}>
                  <Skeleton className="h-16" />
                </Cell>
              ))}
        </CellGrid>
      </Section>

      <Section label="Newest builds">
        {newest.length ? (
          <CellGrid cols={3}>
            {newest.map((b) => (
              <Cell key={b.id}>
                <Link to={buildHref(b)} className="inline-flex items-center gap-2 font-heading text-base font-semibold text-warning hover:underline underline-offset-4">
                  <GitFork className="size-3.5 shrink-0" /> {b.name}
                </Link>
                <p className="mt-2 text-sm text-muted-foreground text-pretty">{b.summary}</p>
                <div className="mt-2 text-xs text-muted-foreground">
                  on {b.runtime?.name ?? b.runtimeId} · {b.owner?.handle ?? 'unknown'}
                  {sealed ? null : <> · <span className="font-mono tnum">{fmtInt(b.resultsCount ?? 0)}</span> {b.resultsCount === 1 ? 'result' : 'results'}</>}
                </div>
              </Cell>
            ))}
          </CellGrid>
        ) : (
          <EmptyState
            title="No builds yet."
            description="A build is a runtime somebody changed — a custom kernel or op, a patch, a fork. Register yours and post the numbers it gets."
            action={register}
          />
        )}
      </Section>
    </div>
  )
}

import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { GitHubMark } from '@/components/GitHubMark'
import { LeaderboardTable } from '@/components/LeaderboardTable'
import { Podium } from '@/components/Podium'
import { HardwareCard, RigCard } from '@/components/cards'
import { CountdownStrip, RigSilhouette, SealedBoard } from '@/components/launch'
import { ErrorState } from '@/components/ErrorState'
import { ArrowLink, Block, Cell, CellGrid, PillTabs, Section, Toolbar, inset } from '@/components/frame'
import { useAsync } from '@/hooks/useAsync'
import { useCatalog } from '@/hooks/useCatalog'
import { useSealed } from '@/hooks/useSealed'
import { usePageTitle } from '@/hooks/usePageTitle'
import { useSession } from '@/hooks/useSession'
import { api } from '@/lib/api'
import type { HardwareItem } from '@/lib/api/types'
import { CATALOG_REPO_URL } from '@/lib/brand'
import { fmtInstant, fmtInt } from '@/lib/format'
import { PAGE_SEO } from '@/lib/seo'
import { cn } from '@/lib/utils'

function Stat({ label, value }: { label: string; value: number | undefined }) {
  return (
    <Cell>
      <div className="font-mono text-3xl font-semibold tnum">{value == null ? <Skeleton className="h-8 w-20" /> : fmtInt(value)}</div>
      <div className="mt-1 text-sm text-muted-foreground">{label}</div>
    </Cell>
  )
}

const quietLink = 'font-normal text-muted-foreground hover:text-foreground'

export default function Home() {
  usePageTitle(PAGE_SEO.home.title, PAGE_SEO.home.description, PAGE_SEO.home.brandFirst)
  // Launch week. Flips to the ordinary page in place at zero.
  const { sealed, revealAt, countdown } = useSealed()
  const home = useAsync(() => api.home(), [])
  const cat = useCatalog()
  const { user, requestSignIn } = useSession()
  const [model, setModel] = useState('')
  // While sealed, nothing that is not shown is fetched.
  const top = useAsync(() => (sealed ? Promise.resolve(null) : api.topResults({ model: model || undefined, limit: 10 })), [model, sealed])
  const rigs = useAsync(() => (sealed ? api.rigs({ sort: 'newest', limit: 6 }) : Promise.resolve(null)), [sealed])
  // Six parts across the kinds for the catalog section, so it shows the breadth of the database rather than the first six CPUs.
  const parts = useAsync(async () => {
    if (!sealed) return null
    const [gpu, cpu, igpu, npu] = await Promise.all([
      api.hardware({ type: 'gpu', limit: 2 }),
      api.hardware({ type: 'cpu', limit: 2 }),
      api.hardware({ type: 'igpu', limit: 1 }),
      api.hardware({ type: 'npu', limit: 1 }),
    ])
    return [gpu.items[0], cpu.items[0], igpu.items[0], gpu.items[1], cpu.items[1], npu.items[0]].filter((h): h is HardwareItem => h != null)
  }, [sealed])
  const noRigs = home.data != null && home.data.topRigs.length === 0

  return (
    <div>
      <div className={cn('py-14 md:py-24', inset)}>
        <div className="max-w-3xl">
          <h1 className="text-4xl font-semibold text-balance md:text-6xl">
            <span className="text-muted-foreground">Show your rig.</span>
            <br />
            Post your tok/s.
          </h1>
          <p className="mt-5 max-w-xl text-lg text-muted-foreground text-pretty">
            Real inference numbers from real Intel machines. Register the hardware you run, submit what a model does on it, and see where it lands against everyone else.
          </p>
          <div className="mt-8 flex flex-wrap gap-2">
            {user ? (
              <Button size="xl" render={<Link to="/submit" />} nativeButton={false}>
                <Plus data-icon="inline-start" /> Submit a result
              </Button>
            ) : (
              <Button size="xl" onClick={() => requestSignIn('/submit')}>
                <GitHubMark data-icon="inline-start" className="size-4" /> Sign in with GitHub
              </Button>
            )}
            {sealed ? (
              <Button size="xl" variant="outline" render={<Link to="/hardware" />} nativeButton={false}>
                Browse the hardware catalog
              </Button>
            ) : (
              <Button size="xl" variant="outline" render={<Link to="/models" />} nativeButton={false}>
                Browse leaderboards
              </Button>
            )}
          </div>
        </div>
      </div>

      {sealed ? null : (
        <Section>
          <CellGrid cols={4}>
            <Stat label="results" value={home.data?.stats.results} />
            <Stat label="rigs" value={home.data?.stats.rigs} />
            <Stat label="hardware items" value={home.data?.stats.hardware} />
            <Stat label="members" value={home.data?.stats.members} />
          </CellGrid>
        </Section>
      )}

      {home.error ? (
        <Block>
          <ErrorState error={home.error} />
        </Block>
      ) : null}

      {sealed && revealAt && countdown ? (
        <>
          <Section label="Top results">
            <SealedBoard revealAt={revealAt} />
          </Section>
          <Section label="The board goes live in" action={<time dateTime={revealAt.toISOString()}>{fmtInstant(revealAt)}</time>}>
            <CountdownStrip countdown={countdown} />
          </Section>
        </>
      ) : (
        <Section label="Top results">
          <Toolbar>
            <PillTabs
              className="-ml-3"
              value={model}
              onChange={setModel}
              items={[{ value: '', label: 'All models' }, ...(cat.data?.models ?? []).map((m) => ({ value: m.id, label: m.name }))]}
            />
            <span className="ml-auto text-xs text-muted-foreground">Best entry per rig or part, model, and quant · decode tok/s</span>
          </Toolbar>
          {top.data && cat.data ? (
            top.data.items.length ? (
              <>
                <div className="border-b">
                  <Podium rows={top.data.items} runtimes={cat.data.runtimes} models={cat.data.models} quants={cat.data.quants} />
                </div>
                <LeaderboardTable rows={top.data.items} runtimes={cat.data.runtimes} models={cat.data.models} quants={cat.data.quants} />
              </>
            ) : (
              <Block className="text-sm text-muted-foreground">No results yet.</Block>
            )
          ) : (
            <Block className="space-y-4">
              <Skeleton className="h-64" />
              <Skeleton className="h-72" />
            </Block>
          )}
        </Section>
      )}

      {sealed ? (
        rigs.data && rigs.data.items.length >= 6 ? (
          <Section label="Newest rigs" action={<ArrowLink to="/rigs" className={quietLink}>All rigs</ArrowLink>}>
            <CellGrid cols={3}>
              {rigs.data.items.map((rig) => (
                <RigCard key={rig.id} rig={rig} sealed />
              ))}
            </CellGrid>
          </Section>
        ) : (
          <Section label="Rigs">
            <RigSilhouette revealAt={revealAt} />
          </Section>
        )
      ) : (
        <Section label="Top rigs" action={noRigs ? undefined : <ArrowLink to="/rigs" className={quietLink}>All rigs</ArrowLink>}>
          {noRigs ? (
            <RigSilhouette />
          ) : (
            <CellGrid cols={3}>
              {(home.data?.topRigs ?? Array.from({ length: 6 })).map((rig, i) =>
                rig ? (
                  <RigCard key={rig.id} rig={rig} />
                ) : (
                  <Cell key={i}>
                    <Skeleton className="h-56" />
                  </Cell>
                ),
              )}
            </CellGrid>
          )}
        </Section>
      )}

      {sealed ? (
        <Section label="In the catalog">
          <CellGrid cols={3}>
            {parts.data
              ? parts.data.map((h) => <HardwareCard key={h.id} hardware={h} counts={false} />)
              : Array.from({ length: 6 }).map((_, i) => (
                  <Cell key={i}>
                    <Skeleton className="h-28" />
                  </Cell>
                ))}
          </CellGrid>
          <div className={cn('flex flex-col gap-4 border-t py-5 sm:flex-row sm:items-center sm:justify-between', inset)}>
            <p className="text-sm text-muted-foreground text-pretty">
              {home.data ? `${fmtInt(home.data.stats.hardware)} parts` : 'Parts'} across CPUs, GPUs, integrated graphics, NPUs, and memory. Intel is seeded and leads the boards; other vendors' parts are welcome for comparison. Missing something?{' '}
              <a href={CATALOG_REPO_URL} target="_blank" rel="noreferrer" className="text-foreground underline underline-offset-4">
                Add it by pull request
              </a>
              .
            </p>
            <Button variant="outline" size="lg" className="shrink-0" render={<Link to="/hardware" />} nativeButton={false}>
              Browse all hardware <ChevronRight data-icon="inline-end" />
            </Button>
          </div>
        </Section>
      ) : null}
    </div>
  )
}

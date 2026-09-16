import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { GitHubMark } from '@/components/GitHubMark'
import { LeaderboardTable } from '@/components/LeaderboardTable'
import { Podium } from '@/components/Podium'
import { HardwareCard, RigCard } from '@/components/cards'
import { HowItWorks } from '@/components/HowItWorks'
import { EmptyBoard, EmptyRigs } from '@/components/empty'
import { ErrorState } from '@/components/ErrorState'
import { ArrowLink, Block, Cell, CellGrid, PillTabs, Section, Toolbar, inset } from '@/components/frame'
import { useAsync } from '@/hooks/useAsync'
import { useCatalog } from '@/hooks/useCatalog'
import { usePageTitle } from '@/hooks/usePageTitle'
import { useSession } from '@/hooks/useSession'
import { api } from '@/lib/api'
import type { HardwareItem } from '@/lib/api/types'
import { CATALOG_DIR_URL } from '@/lib/brand'
import { fmtInt } from '@/lib/format'
import { PAGE_SEO } from '@/lib/seo'
import { cn } from '@/lib/utils'

const quietLink = 'font-normal text-muted-foreground hover:text-foreground'

// Keep a small, curated mix of local models up front as the catalog grows.
const FEATURED_MODEL_IDS = ['qwen3-5-9b', 'gemma-4-12b', 'gpt-oss-20b', 'qwen3-6-35b-a3b']

export default function Home() {
  usePageTitle(PAGE_SEO.home.title, PAGE_SEO.home.description, PAGE_SEO.home.brandFirst)
  // Launch week. Flips to the ordinary page in place at zero.
  const home = useAsync(() => api.home(), [])
  const cat = useCatalog()
  const { user, requestSignIn } = useSession()
  const [model, setModel] = useState('')
  const top = useAsync(() => api.topResults({ model: model || undefined, limit: 10 }), [model])
  const models = cat.data?.models ?? []
  const featuredModels = [
    ...FEATURED_MODEL_IDS.flatMap((id) => models.filter((m) => m.id === id)),
    ...models.filter((m) => !FEATURED_MODEL_IDS.includes(m.id)),
  ].slice(0, 4)
  const moreModels = models.filter((m) => !featuredModels.some((featured) => featured.id === m.id))
  const moreModelItems = moreModels.map((m) => ({ value: m.id, label: m.name }))
  const selectedMoreModel = moreModels.some((m) => m.id === model) ? model : null
  // Six parts across the kinds for the catalog section, so it shows the breadth of the database rather than the first six CPUs.
  const parts = useAsync(async () => {
    const [gpu, cpu, igpu, npu] = await Promise.all([
      api.hardware({ type: 'gpu', limit: 2 }),
      api.hardware({ type: 'cpu', limit: 2 }),
      api.hardware({ type: 'igpu', limit: 1 }),
      api.hardware({ type: 'npu', limit: 1 }),
    ])
    return [gpu.items[0], cpu.items[0], igpu.items[0], gpu.items[1], cpu.items[1], npu.items[0]].filter((h): h is HardwareItem => h != null)
  }, [])
  const noRigs = home.data != null && home.data.topRigs.length === 0

  return (
    <div>
      <div className={cn('py-14', inset)}>
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
            <Button size="xl" variant="outline" render={<Link to="/models" />} nativeButton={false}>
              Browse leaderboards
            </Button>
          </div>
        </div>
      </div>

      <HowItWorks />

      {home.error ? (
        <Block>
          <ErrorState error={home.error} />
        </Block>
      ) : null}

      <Section label="Top results">
          <Toolbar>
            <PillTabs
              className="-ml-3"
              value={model}
              onChange={setModel}
              items={[{ value: '', label: 'All models' }, ...featuredModels.map((m) => ({ value: m.id, label: m.name }))]}
            />
            {moreModels.length > 0 ? (
              <Select value={selectedMoreModel} onValueChange={(value) => { if (value != null) setModel(value) }} items={moreModelItems}>
                <SelectTrigger aria-label="More models" className={cn('max-w-full', selectedMoreModel && 'border-foreground/40')}>
                  <SelectValue placeholder="More models" />
                </SelectTrigger>
                <SelectContent align="start" alignItemWithTrigger={false} className="max-h-72 w-max max-w-[calc(100vw-2.5rem)]">
                  {moreModelItems.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}
                </SelectContent>
              </Select>
            ) : null}
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
              <EmptyBoard
                ask={model ? 'Post the first for this model.' : 'Post the first and it ranks right away.'}
                submitTo={model ? `/submit?model=${model}` : '/submit'}
              />
            )
          ) : (
            <Block className="space-y-4">
              <Skeleton className="h-64" />
              <Skeleton className="h-72" />
            </Block>
          )}
      </Section>

      <Section label="Top rigs" action={noRigs ? undefined : <ArrowLink to="/rigs" className={quietLink}>All rigs</ArrowLink>}>
        {noRigs ? (
          <EmptyRigs />
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
              <a href={CATALOG_DIR_URL} target="_blank" rel="noreferrer" className="text-foreground underline underline-offset-4">
                Add it by pull request
              </a>
              .
            </p>
          <Button variant="outline" size="lg" className="shrink-0" render={<Link to="/hardware" />} nativeButton={false}>
            Browse all hardware <ChevronRight data-icon="inline-end" />
          </Button>
        </div>
      </Section>
    </div>
  )
}

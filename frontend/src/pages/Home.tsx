import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { GitHubMark } from '@/components/GitHubMark'
import { LeaderboardTable } from '@/components/LeaderboardTable'
import { Podium } from '@/components/Podium'
import { RigCard } from '@/components/cards'
import { ErrorState } from '@/components/ErrorState'
import { ArrowLink, Block, Cell, CellGrid, PillTabs, Section, Toolbar, inset } from '@/components/frame'
import { useAsync } from '@/hooks/useAsync'
import { useCatalog } from '@/hooks/useCatalog'
import { usePageTitle } from '@/hooks/usePageTitle'
import { useSession } from '@/hooks/useSession'
import { api } from '@/lib/api'
import { fmtInt } from '@/lib/format'
import { cn } from '@/lib/utils'

function Stat({ label, value }: { label: string; value: number | undefined }) {
  return (
    <Cell>
      <div className="font-mono text-3xl font-semibold tnum">{value == null ? <Skeleton className="h-8 w-20" /> : fmtInt(value)}</div>
      <div className="mt-1 text-sm text-muted-foreground">{label}</div>
    </Cell>
  )
}

export default function Home() {
  usePageTitle()
  const home = useAsync(() => api.home(), [])
  const cat = useCatalog()
  const { user, requestSignIn } = useSession()
  const [model, setModel] = useState('')
  const top = useAsync(() => api.topResults({ model: model || undefined, limit: 10 }), [model])

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
            Real inference numbers from real machines. Register the hardware you run, submit what a model does on it, and see where it lands against everyone else.
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

      <Section>
        <CellGrid cols={4}>
          <Stat label="results" value={home.data?.stats.results} />
          <Stat label="rigs" value={home.data?.stats.rigs} />
          <Stat label="hardware items" value={home.data?.stats.hardware} />
          <Stat label="members" value={home.data?.stats.members} />
        </CellGrid>
      </Section>

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

      <Section label="Top rigs" action={<ArrowLink to="/rigs" className="font-normal text-muted-foreground hover:text-foreground">All rigs</ArrowLink>}>
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
      </Section>
    </div>
  )
}

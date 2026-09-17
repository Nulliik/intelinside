import { Link, Navigate, useParams, useSearchParams } from 'react-router-dom'
import { ExternalLink, GitFork } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { UserAvatar } from '@/components/UserAvatar'
import { GitHubMark } from '@/components/GitHubMark'
import { RigCard } from '@/components/cards'
import { ResultsTable } from '@/components/ResultsTable'
import { customRuntimeHref } from '@/components/CustomRuntimeLink'
import { EmptyState } from '@/components/EmptyState'
import { ErrorState } from '@/components/ErrorState'
import { Block, Cell, CellGrid, PillTabs, Section, Toolbar, inset } from '@/components/frame'
import { useAsync } from '@/hooks/useAsync'
import { useCatalog } from '@/hooks/useCatalog'
import { usePageTitle } from '@/hooks/usePageTitle'
import { api } from '@/lib/api'
import { fmtDate, fmtInt } from '@/lib/format'
import { QUANT_BY_ID } from '@/catalog'
import { cn } from '@/lib/utils'

type Tab = 'rigs' | 'results' | 'custom'

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <Cell className="py-5 md:py-5">
      <div className="font-mono text-2xl font-semibold tnum">{value}</div>
      <div className="mt-1 text-xs text-muted-foreground">{label}</div>
    </Cell>
  )
}

export default function Profile() {
  const { handle = '' } = useParams()
  const [sp, setSp] = useSearchParams()
  const tab = (sp.get('tab') as Tab) || 'rigs'
  const cat = useCatalog()
  // Handles are stored lowercase, but profile URLs are often typed or shared with
  // GitHub's casing (e.g. /u/SergiioB). Resolve against the lowercase handle and
  // canonicalize the address bar without dropping the tab query.
  const canonical = handle.toLowerCase()
  const data = useAsync(
    () => Promise.all([api.user(canonical), api.userRigs(canonical), api.userResults(canonical), api.customRuntimes({ owner: canonical })]),
    [canonical],
  )
  usePageTitle(canonical ? `@${canonical}` : 'Profile')
  if (canonical !== handle)
    return <Navigate to={{ pathname: `/u/${canonical}`, search: sp.toString() }} replace />
  if (data.error)
    return (
      <Block>
        <ErrorState error={data.error} />
      </Block>
    )
  if (!data.data || !cat.data)
    return (
      <Block>
        <Skeleton className="h-96" />
      </Block>
    )
  const [user, rigs, results, customRuntimes] = data.data
  const s = user.stats
  const model = s?.bestRank ? cat.data.models.find((m) => m.id === s.bestRank!.modelId) : undefined
  return (
    <div>
      <header className={cn('flex flex-col gap-5 py-10 sm:flex-row sm:items-start md:py-14', inset)}>
        <UserAvatar user={user} size="lg" className="size-16 sm:size-20" />
        <div className="min-w-0 flex-1">
          <h1 className="text-3xl font-semibold">{user.name ?? user.handle}</h1>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
            <a href={`https://github.com/${user.handle}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 hover:text-foreground">
              <GitHubMark className="size-3.5" /> @{user.handle} <ExternalLink className="size-3" />
            </a>
            <span>member since {fmtDate(user.createdAt)}</span>
          </div>
          {user.bio ? <p className="mt-3 max-w-xl text-sm text-pretty">{user.bio}</p> : null}
        </div>
      </header>
      <Section>
        <CellGrid cols={4}>
          <Stat label="results" value={fmtInt(s?.results ?? 0)} />
          <Stat label="rigs" value={fmtInt(s?.rigs ?? 0)} />
          <Stat
            label={s?.bestRank ? `best rank · ${model?.name ?? ''} ${QUANT_BY_ID[s.bestRank.quant]?.label ?? ''} ${s.bestRank.kind}` : 'best rank'}
            value={s?.bestRank ? `#${s.bestRank.position}` : '—'}
          />
          <Stat label="confirmations given" value={fmtInt(s?.confirmationsGiven ?? 0)} />
        </CellGrid>
      </Section>
      <Section>
        <Toolbar>
          <PillTabs<Tab>
            className="-ml-3"
            value={tab}
            onChange={(v) => setSp({ tab: v }, { replace: true })}
            items={[
              { value: 'rigs', label: 'Rigs', count: rigs.items.length },
              { value: 'results', label: 'Results', count: results.items.length },
              { value: 'custom', label: 'Custom runtimes', count: customRuntimes.items.length },
            ]}
          />
        </Toolbar>
        {tab === 'rigs' ? (
          rigs.items.length ? (
            <CellGrid cols={3}>
              {rigs.items.map((r) => (
                <RigCard key={r.id} rig={r} />
              ))}
            </CellGrid>
          ) : (
            <EmptyState title="No rigs yet" description="No machines registered on this account." />
          )
        ) : tab === 'custom' ? (
          customRuntimes.items.length ? (
            <CellGrid cols={3}>
              {customRuntimes.items.map((b) => (
                <Cell key={b.id}>
                  <Link to={customRuntimeHref(b)} className="inline-flex items-center gap-2 font-heading text-base font-semibold text-warning hover:underline underline-offset-4">
                    <GitFork className="size-3.5 shrink-0" /> {b.name}
                  </Link>
                  <p className="mt-2 text-sm text-muted-foreground text-pretty">{b.summary}</p>
                  <div className="mt-2 text-xs text-muted-foreground">
                    on {b.runtime?.name ?? b.runtimeId} · <span className="font-mono tnum">{fmtInt(b.resultsCount ?? 0)}</span>{' '}
                    {b.resultsCount === 1 ? 'result' : 'results'}
                  </div>
                </Cell>
              ))}
            </CellGrid>
          ) : (
            <EmptyState title="No custom runtimes yet" description="A custom runtime is one this person changed — a custom kernel or op, a patch, a fork." />
          )
        ) : results.items.length ? (
          <ResultsTable results={results.items} runtimes={cat.data.runtimes} models={cat.data.models} quants={cat.data.quants} showSubmitter={false} />
        ) : (
          <EmptyState title="No results yet" description="Nothing posted from this account yet." />
        )}
      </Section>
    </div>
  )
}

import { Fragment, useMemo, useState } from 'react'
import { ChevronDown, ChevronRight, LayoutGrid, Plus, Rows3, Search } from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { PageHeader } from '@/components/PageHeader'
import { ModelBoardCard, QuantChips } from '@/components/cards'
import { ModelLogo } from '@/components/ModelLogo'
import { RuntimeMark } from '@/components/RuntimeMark'
import { ErrorState } from '@/components/ErrorState'
import { EmptyState } from '@/components/EmptyState'
import { Block, CellGrid, PillTabs, Section, Toolbar, inset } from '@/components/frame'
import { useAsync } from '@/hooks/useAsync'
import { useCatalog } from '@/hooks/useCatalog'
import { useSession } from '@/hooks/useSession'
import { api } from '@/lib/api'
import type { Model, ModelSummary, Runtime } from '@/lib/api/types'
import { fmtTps, pluralize } from '@/lib/format'
import { usePageTitle } from '@/hooks/usePageTitle'
import { PAGE_SEO } from '@/lib/seo'
import { cn } from '@/lib/utils'

/*
  The catalog grouped by brand, the family at the logo level, so thirty-odd models read as a dozen families. One row
  per model by default; the grid view brings back the tiles. Sort orders the families and the rows inside them, the
  pills filter to one family, and the search runs across the lot. Sort and family live in the URL; the view is a
  preference and lives in the browser.
*/

type Sort = 'results' | 'name'
type View = 'list' | 'grid'
const sortItems: { value: Sort; label: string }[] = [
  { value: 'results', label: 'Most results' },
  { value: 'name', label: 'Name' },
]
const VIEW_KEY = 'intelinside.models.view'

function readView(): View {
  try {
    return localStorage.getItem(VIEW_KEY) === 'grid' ? 'grid' : 'list'
  } catch {
    return 'list'
  }
}

const byName = (a: string, b: string) => a.localeCompare(b, undefined, { numeric: true })
const resultsOf = (sm: ModelSummary) => Object.values(sm.model.resultCounts ?? {}).reduce((a, b) => a + b, 0)

type Group = { brand: string; logo: Model; models: ModelSummary[]; results: number }

function groupByBrand(items: ModelSummary[]): Group[] {
  const groups = new Map<string, Group>()
  for (const sm of items) {
    const g = groups.get(sm.model.brand) ?? { brand: sm.model.brand, logo: sm.model, models: [], results: 0 }
    g.models.push(sm)
    g.results += resultsOf(sm)
    groups.set(sm.model.brand, g)
  }
  return [...groups.values()]
}

/** Families by result count, then rows the same way; ties fall to the newest generation, which numeric name order puts first. */
function order(groups: Group[], sort: Sort): Group[] {
  const models = (list: ModelSummary[]) =>
    [...list].sort((a, b) => (sort === 'results' ? resultsOf(b) - resultsOf(a) || byName(b.model.name, a.model.name) : byName(a.model.name, b.model.name)))
  return [...groups]
    .sort((a, b) => (sort === 'results' ? b.results - a.results || byName(a.brand, b.brand) : byName(a.brand, b.brand)))
    .map((g) => ({ ...g, models: models(g.models) }))
}

/** The bare mark for a pill: the logo when the catalog has one, else the brand's initial in its colour. */
function BrandMark({ model }: { model: Model }) {
  if (model.logoUrl) return <img src={model.logoUrl} alt="" className="size-3.5" />
  return (
    <span aria-hidden className="font-heading text-xs font-semibold leading-none" style={{ color: model.brandColor ?? 'var(--muted-foreground)' }}>
      {model.brand.charAt(0).toUpperCase()}
    </span>
  )
}

// One template for the header row and every model row, so the columns line up down the page.
const columns = 'md:grid-cols-[minmax(0,1.1fr)_minmax(0,1.6fr)_5.5rem_minmax(0,1fr)_1.5rem]'

function ColumnHeader() {
  const label = 'text-2xs font-medium uppercase tracking-label text-muted-foreground'
  return (
    <div className={cn('sticky top-14 z-10 hidden gap-x-6 border-b bg-background py-2 md:grid', columns, inset)}>
      <span className={label}>Model</span>
      <span className={label}>Quantization</span>
      <span className={cn(label, 'text-right')}>Results</span>
      <span className={label}>Best decode</span>
      <span />
    </div>
  )
}

function GroupHeader({ group, collapsed, onToggle }: { group: Group; collapsed: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={!collapsed}
      className={cn('flex w-full items-center gap-3 border-b bg-card py-3 text-left transition-colors hover:bg-popover focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-inset focus-visible:outline-none', inset)}
    >
      <ModelLogo model={group.logo} size="sm" />
      <h3 className="text-[15px] font-semibold">{group.brand}</h3>
      <span className="text-sm text-muted-foreground">
        {pluralize(group.models.length, 'model')} · {pluralize(group.results, 'result')}
      </span>
      <ChevronDown className={cn('ml-auto size-4 text-muted-foreground transition-transform', collapsed ? '' : 'rotate-180')} />
    </button>
  )
}

function Best({ summary, runtimes, className }: { summary: ModelSummary; runtimes: Record<string, Runtime>; className?: string }) {
  const best = summary.best
  if (!best) return <span className={cn('text-sm text-muted-foreground/60', className)}>No results yet</span>
  return (
    <span className={cn('flex min-w-0 items-center gap-2 text-sm', className)}>
      <span className="font-mono tnum">
        {fmtTps(best.result.decodeTps)} <span className="text-muted-foreground">tok/s</span>
      </span>
      <RuntimeMark runtime={runtimes[best.result.runtimeId]} size="sm" />
      <Link to={`/results/${best.result.id}`} className="truncate text-muted-foreground hover:text-foreground hover:underline underline-offset-4">
        {best.unit.kind === 'rig' ? best.unit.rig.name : best.unit.hardware.name}
      </Link>
    </span>
  )
}

/** One model as a row: name and shape, the quant chips that are the links into each board, the count, the best. */
function ModelRow({ summary, runtimes }: { summary: ModelSummary; runtimes: Record<string, Runtime> }) {
  const { model, board } = summary
  const total = resultsOf(summary)
  const boardHref = `/models/${model.id}/${board.quant}`
  return (
    <div className={cn('grid gap-x-6 gap-y-2.5 border-b py-3 transition-colors hover:bg-card md:items-center', columns, inset)}>
      <div className="min-w-0">
        <Link to={boardHref} className="text-[15px] font-medium hover:underline underline-offset-4">
          {model.name}
        </Link>
        <div className="text-xs text-muted-foreground">
          {model.params} · {model.architecture === 'moe' ? `MoE, ${model.activeParams} active` : 'dense'}
        </div>
      </div>
      <QuantChips model={model} lit={(q) => (model.resultCounts?.[q] ?? 0) > 0} />
      <span className={cn('hidden font-mono text-sm tnum md:block md:text-right', !total && 'text-muted-foreground/60')}>{total}</span>
      <Best summary={summary} runtimes={runtimes} className="hidden md:flex" />
      <Link to={boardHref} aria-label={`${model.name} board`} className="hidden text-muted-foreground hover:text-foreground md:block">
        <ChevronRight className="size-4" />
      </Link>
      {/* Phones fold the count and the best into one line under the chips. */}
      <span className="flex items-center gap-2 text-sm md:hidden">
        {total ? (
          <>
            <span className="text-muted-foreground">{pluralize(total, 'result')}</span>
            <span className="text-muted-foreground">·</span>
            <Best summary={summary} runtimes={runtimes} />
          </>
        ) : (
          <Best summary={summary} runtimes={runtimes} />
        )}
      </span>
    </div>
  )
}

export default function Models() {
  usePageTitle(PAGE_SEO.models.title, PAGE_SEO.models.description)
  const cat = useCatalog()
  const { user, requestSignIn } = useSession()
  const summaries = useAsync(() => api.modelSummaries(), [])
  const [sp, setSp] = useSearchParams()
  const sort: Sort = sp.get('sort') === 'name' ? 'name' : 'results'
  const family = sp.get('family') ?? ''
  const setParam = (key: string, value: string) =>
    setSp(
      (prev) => {
        const next = new URLSearchParams(prev)
        if (value) next.set(key, value)
        else next.delete(key)
        return next
      },
      { replace: true },
    )
  const [q, setQ] = useState('')
  const [view, setViewState] = useState<View>(readView)
  const setView = (v: View) => {
    setViewState(v)
    try {
      localStorage.setItem(VIEW_KEY, v)
    } catch {
      /* a private window forgets; the page still works */
    }
  }
  const [collapsed, setCollapsed] = useState<Set<string>>(() => new Set())
  const toggle = (brand: string) =>
    setCollapsed((prev) => {
      const next = new Set(prev)
      if (next.has(brand)) next.delete(brand)
      else next.add(brand)
      return next
    })

  const runtimes = Object.fromEntries((cat.data?.runtimes ?? []).map((r) => [r.id, r]))
  const all = useMemo(() => summaries.data ?? [], [summaries.data])
  // Every family for the pills, largest first, regardless of what is filtered or searched.
  const brands = useMemo(() => groupByBrand(all).sort((a, b) => b.models.length - a.models.length || byName(a.brand, b.brand)), [all])
  const visible = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return all.filter((sm) => (!family || sm.model.brand === family) && (!needle || `${sm.model.name} ${sm.model.family} ${sm.model.brand}`.toLowerCase().includes(needle)))
  }, [all, family, q])
  const groups = useMemo(() => order(groupByBrand(visible), sort), [visible, sort])
  const shownResults = visible.reduce((a, sm) => a + resultsOf(sm), 0)

  return (
    <div>
      <PageHeader
        eyebrow="Models"
        title={
          <>
            Every board is one model at one quantization.
          </>
        }
        description="Every model the catalog knows, grouped by family. Pick a quant to open its rigs and components boards."
        actions={
          user ? (
            <Button render={<Link to="/submit" />} nativeButton={false}>
              <Plus data-icon="inline-start" /> Submit a result
            </Button>
          ) : (
            <Button onClick={() => requestSignIn('/submit')}>
              <Plus data-icon="inline-start" /> Submit a result
            </Button>
          )
        }
      />
      <Section>
        <Toolbar>
          <div className="relative w-full sm:w-64">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search models" aria-label="Search models" className="pl-8" />
          </div>
          {/* Each label stays with its control when the row wraps on a phone. */}
          <span className="inline-flex items-center gap-3">
            <span className="text-sm text-muted-foreground">Sort</span>
            <Select value={sort} onValueChange={(v) => setParam('sort', v === 'name' ? 'name' : '')} items={sortItems}>
              <SelectTrigger className="w-36" aria-label="Sort">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {sortItems.map((i) => (
                  <SelectItem key={i.value} value={i.value}>
                    {i.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </span>
          <span className="inline-flex items-center gap-3">
            <span className="text-sm text-muted-foreground">View</span>
            <ToggleGroup value={[view]} onValueChange={(v) => v[0] && setView(v[0] as View)} spacing={0} variant="outline" aria-label="View">
              <ToggleGroupItem value="list" aria-label="List">
                <Rows3 />
              </ToggleGroupItem>
              <ToggleGroupItem value="grid" aria-label="Grid">
                <LayoutGrid />
              </ToggleGroupItem>
            </ToggleGroup>
          </span>
          {all.length ? (
            <span className="ml-auto text-sm text-muted-foreground">
              {pluralize(visible.length, 'model')} · {pluralize(shownResults, 'result')}
            </span>
          ) : null}
        </Toolbar>
        {brands.length ? (
          // The pills scroll sideways on a phone and wrap from sm up.
          <div className={cn('overflow-x-auto border-b py-2 [scrollbar-width:none]', inset)}>
            <PillTabs
              className="flex-nowrap sm:flex-wrap [&_[role=tab]]:shrink-0"
              value={family}
              onChange={(v) => setParam('family', v)}
              items={[
                { value: '', label: 'All', count: all.length },
                ...brands.map((b) => ({
                  value: b.brand,
                  label: (
                    <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
                      <BrandMark model={b.logo} />
                      {b.brand}
                    </span>
                  ),
                  count: b.models.length,
                })),
              ]}
            />
          </div>
        ) : null}
        {cat.error || summaries.error ? (
          <Block>
            <ErrorState error={(cat.error ?? summaries.error) as Error} />
          </Block>
        ) : cat.loading || summaries.loading ? (
          <div>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className={cn('border-b py-4', inset)}>
                <Skeleton className="h-9" />
              </div>
            ))}
          </div>
        ) : groups.length ? (
          <>
            {view === 'list' ? <ColumnHeader /> : null}
            {groups.map((g) => {
              const open = !collapsed.has(g.brand)
              return (
                <Fragment key={g.brand}>
                  {/* Filtered to one family, the pill is the header. */}
                  {family ? null : <GroupHeader group={g} collapsed={!open} onToggle={() => toggle(g.brand)} />}
                  {!open ? null : view === 'list' ? (
                    g.models.map((sm) => <ModelRow key={sm.model.id} summary={sm} runtimes={runtimes} />)
                  ) : (
                    <CellGrid cols={2} className="border-b">
                      {g.models.map((sm) => (
                        <ModelBoardCard key={sm.model.id} summary={sm} runtimes={runtimes} />
                      ))}
                    </CellGrid>
                  )}
                </Fragment>
              )
            })}
          </>
        ) : (
          <EmptyState title="No models match" description="Models are added to the catalog by pull request." />
        )}
      </Section>
    </div>
  )
}

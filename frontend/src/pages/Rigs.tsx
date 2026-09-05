import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PageHeader } from '@/components/PageHeader'
import { RigCard } from '@/components/cards'
import { RigSilhouette } from '@/components/launch'
import { ErrorState } from '@/components/ErrorState'
import { LoadMore } from '@/components/LoadMore'
import { Block, Cell, CellGrid, Section, Toolbar } from '@/components/frame'
import { useAsync } from '@/hooks/useAsync'
import { usePageTitle } from '@/hooks/usePageTitle'
import { useSealed } from '@/hooks/useSealed'
import { useSession } from '@/hooks/useSession'
import { api } from '@/lib/api'
import type { RigSummary, RigsParams } from '@/lib/api/types'
import { PAGE_SEO } from '@/lib/seo'

const sortItems = [
  { value: 'newest', label: 'Newest' },
  { value: 'tps', label: 'Top tok/s' },
  { value: 'results', label: 'Most results' },
]

export default function Rigs() {
  usePageTitle(PAGE_SEO.rigs.title, PAGE_SEO.rigs.description)
  const { user, requestSignIn } = useSession()
  const { sealed, revealAt } = useSealed()
  const [sort, setSort] = useState<NonNullable<RigsParams['sort']>>('newest')
  // Sorting by tok/s or result count would rank the rigs, so the week is newest-first only.
  const list = useAsync(() => api.rigs({ sort: sealed ? 'newest' : sort }), [sort, sealed])
  const [extra, setExtra] = useState<RigSummary[]>([])
  const [cursor, setCursor] = useState<string | undefined>()
  useEffect(() => {
    setExtra([])
    setCursor(list.data?.nextCursor)
  }, [list.data])
  const rigs = [...(list.data?.items ?? []), ...extra]
  return (
    <div>
      <PageHeader
        eyebrow="Rigs"
        title={
          <>
            Machines people actually run models on, parts and all.
          </>
        }
        actions={
          user ? (
            <Button render={<Link to="/rigs/new" />} nativeButton={false}>
              <Plus data-icon="inline-start" /> New rig
            </Button>
          ) : (
            <Button onClick={() => requestSignIn('/rigs/new')}>
              <Plus data-icon="inline-start" /> New rig
            </Button>
          )
        }
      />
      <Section>
        {sealed ? null : (
        <Toolbar>
          <span className="text-sm text-muted-foreground">Sort</span>
          <Select value={sort} onValueChange={(v) => setSort(v as typeof sort)} items={sortItems}>
            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent>{sortItems.map((i) => <SelectItem key={i.value} value={i.value}>{i.label}</SelectItem>)}</SelectContent>
          </Select>
        </Toolbar>
        )}
        {list.error ? (
          <Block>
            <ErrorState error={list.error} />
          </Block>
        ) : list.loading && !list.data ? (
          <CellGrid cols={3}>
            {Array.from({ length: 6 }).map((_, i) => (
              <Cell key={i}>
                <Skeleton className="h-56" />
              </Cell>
            ))}
          </CellGrid>
        ) : rigs.length ? (
          <>
            <CellGrid cols={3}>
              {rigs.map((r) => (
                <RigCard key={r.id} rig={r} sealed={sealed} />
              ))}
            </CellGrid>
            {cursor ? (
              <Block className="border-t py-4">
                <LoadMore
                  hasMore={!!cursor}
                  onLoad={async () => {
                    const page = await api.rigs({ sort: sealed ? 'newest' : sort, cursor })
                    setExtra((e) => [...e, ...page.items])
                    setCursor(page.nextCursor)
                  }}
                />
              </Block>
            ) : null}
          </>
        ) : (
          <RigSilhouette revealAt={revealAt} />
        )}
      </Section>
    </div>
  )
}

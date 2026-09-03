import { useState } from 'react'
import { Plus, Search } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { PageHeader } from '@/components/PageHeader'
import { ModelBoardCard } from '@/components/cards'
import { ErrorState } from '@/components/ErrorState'
import { EmptyState } from '@/components/EmptyState'
import { Block, Cell, CellGrid, Section, Toolbar } from '@/components/frame'
import { useAsync } from '@/hooks/useAsync'
import { useCatalog } from '@/hooks/useCatalog'
import { useSealed } from '@/hooks/useSealed'
import { useSession } from '@/hooks/useSession'
import { api } from '@/lib/api'
import { usePageTitle } from '@/hooks/usePageTitle'
import { fmtInstant } from '@/lib/format'

export default function Models() {
  usePageTitle('Models')
  const cat = useCatalog()
  const { sealed, revealAt } = useSealed()
  const { user, requestSignIn } = useSession()
  const summaries = useAsync(() => api.modelSummaries(), [])
  const [q, setQ] = useState('')
  const runtimes = Object.fromEntries((cat.data?.runtimes ?? []).map((r) => [r.id, r]))
  const models = (summaries.data ?? []).filter((sm) => `${sm.model.name} ${sm.model.family}`.toLowerCase().includes(q.toLowerCase()))
  return (
    <div>
      <PageHeader
        eyebrow="Models"
        title={
          <>
            <span className="text-muted-foreground">Every board is one model</span> at one quantization.
          </>
        }
        description={
          sealed && revealAt
            ? `Boards are sealed until ${fmtInstant(revealAt)}. Pick a model and post a result now; it ranks the moment the board goes live.`
            : "Each tile shows the busiest quant's top rigs. Pick any quant to open its rigs and components boards."
        }
        actions={
          sealed ? (
            user ? (
              <Button render={<Link to="/submit" />} nativeButton={false}>
                <Plus data-icon="inline-start" /> Submit a result
              </Button>
            ) : (
              <Button onClick={() => requestSignIn('/submit')}>
                <Plus data-icon="inline-start" /> Submit a result
              </Button>
            )
          ) : undefined
        }
      />
      <Section>
        <Toolbar>
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search models" className="w-64 pl-8" />
          </div>
        </Toolbar>
        {cat.error || summaries.error ? (
          <Block>
            <ErrorState error={(cat.error ?? summaries.error) as Error} />
          </Block>
        ) : cat.loading || summaries.loading ? (
          <CellGrid cols={2}>
            {Array.from({ length: 4 }).map((_, i) => (
              <Cell key={i}>
                <Skeleton className="h-32" />
              </Cell>
            ))}
          </CellGrid>
        ) : models.length ? (
          <CellGrid cols={2}>
            {models.map((sm) => (
              <ModelBoardCard key={sm.model.id} summary={sm} runtimes={runtimes} sealedUntil={revealAt} />
            ))}
          </CellGrid>
        ) : (
          <EmptyState title="No models match" description="Models are added to the catalog by pull request." />
        )}
      </Section>
    </div>
  )
}

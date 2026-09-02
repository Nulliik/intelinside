import { useParams } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { PageHeader } from '@/components/PageHeader'
import { HardwareTypeIcon } from '@/components/HardwareTypeIcon'
import { VendorMark } from '@/components/VendorMark'
import { TpsBarChart } from '@/components/TpsBarChart'
import { ResultsTable } from '@/components/ResultsTable'
import { RigCard } from '@/components/cards'
import { EmptyState } from '@/components/EmptyState'
import { ErrorState } from '@/components/ErrorState'
import { Block, Cell, CellGrid, Framed, Section } from '@/components/frame'
import { useAsync } from '@/hooks/useAsync'
import { useCatalog } from '@/hooks/useCatalog'
import { usePageTitle } from '@/hooks/usePageTitle'
import { api } from '@/lib/api'
import { fmtDate, pluralize } from '@/lib/format'
import { HARDWARE_TYPE_LABEL } from '@/mocks/catalog'

const SPEC_LABEL: Record<string, string> = {
  cores: 'Cores', threads: 'Threads', boostGhz: 'Boost clock', tdpW: 'TDP', platform: 'Platform', vramGb: 'Memory', memoryType: 'Memory type',
  xeCores: 'Xe cores', euCount: 'Execution units', architecture: 'Architecture', tops: 'NPU TOPS', type: 'Type', speedMts: 'Speed', capacityGb: 'Capacity', formFactor: 'Form factor',
}
const SPEC_UNIT: Record<string, string> = { boostGhz: ' GHz', tdpW: ' W', vramGb: ' GB', speedMts: ' MT/s', capacityGb: ' GB' }

export default function HardwareDetail() {
  const { hardwareId = '' } = useParams()
  const item = useAsync(() => api.hardwareItem(hardwareId), [hardwareId])
  const cat = useCatalog()
  usePageTitle(item.data?.name)
  if (item.error)
    return (
      <Block>
        <ErrorState error={item.error} />
      </Block>
    )
  if (!item.data || !cat.data)
    return (
      <Block>
        <Skeleton className="h-96" />
      </Block>
    )
  const h = item.data
  return (
    <div>
      <PageHeader
        eyebrow={
          <span className="inline-flex items-center gap-1.5">
            <HardwareTypeIcon type={h.type} className="size-3.5" /> {HARDWARE_TYPE_LABEL[h.type]} · <VendorMark vendor={h.vendor} withName />
            {h.series ? ` · ${h.series}` : ''}
          </span>
        }
        title={h.name}
        description={`${pluralize(h.resultsCount ?? 0, 'result')} · ${pluralize(h.rigsCount ?? 0, 'rig')}${h.releaseDate ? ` · released ${fmtDate(h.releaseDate)}` : ''}`}
        actions={<Badge variant="outline">{h.source === 'seeded' ? 'Seeded' : 'Community added'}</Badge>}
      />
      <Section label="Specifications">
        <CellGrid cols={4}>
          {Object.entries(h.specs).map(([k, v]) => (
            <Cell key={k} className="py-5 md:py-5">
              <div className="text-xs text-muted-foreground">{SPEC_LABEL[k] ?? k}</div>
              <div className="mt-1 font-mono text-lg tnum">
                {v}
                {SPEC_UNIT[k] ?? ''}
              </div>
            </Cell>
          ))}
        </CellGrid>
      </Section>
      <Section label="Best decode tok/s per model and quant">
        <Framed>
          <TpsBarChart bars={h.chart} runtimes={cat.data.runtimes} />
        </Framed>
      </Section>
      <Section label="Results on this part">
        {h.results.length ? (
          <ResultsTable results={h.results} runtimes={cat.data.runtimes} models={cat.data.models} quants={cat.data.quants} />
        ) : (
          <EmptyState title="No results name this part yet" description="Component-level results show here. Whole-rig results live on the rig pages." />
        )}
      </Section>
      <Section label="Rigs with this part">
        {h.rigs.length ? (
          <CellGrid cols={3}>
            {h.rigs.map((r) => (
              <RigCard key={r.id} rig={r} />
            ))}
          </CellGrid>
        ) : (
          <EmptyState title="No rigs list this part yet" />
        )}
      </Section>
    </div>
  )
}

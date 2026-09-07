import { useState } from 'react'
import { ExternalLink, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PageHeader } from '@/components/PageHeader'
import { HardwareCard } from '@/components/cards'
import { HardwareTypeIcon } from '@/components/HardwareTypeIcon'
import { EmptyState } from '@/components/EmptyState'
import { ErrorState } from '@/components/ErrorState'
import { Block, Cell, CellGrid, Section, Toolbar } from '@/components/frame'
import { useAsync } from '@/hooks/useAsync'
import { useSealed } from '@/hooks/useSealed'
import { usePageTitle } from '@/hooks/usePageTitle'
import { api } from '@/lib/api'
import type { HardwareType } from '@/lib/api/types'
import { CATALOG_DIR_URL } from '@/lib/brand'
import { PAGE_SEO } from '@/lib/seo'
import { HARDWARE_TYPE_LABEL, HARDWARE_TYPES, VENDORS } from '@/catalog'

const ALL = 'all'
const vendorItems = [{ value: ALL, label: 'All vendors' }, ...VENDORS.map((v) => ({ value: v, label: v })), { value: 'Generic', label: 'Generic' }]

export default function Hardware() {
  usePageTitle(PAGE_SEO.hardware.title, PAGE_SEO.hardware.description)
  const { sealed } = useSealed()
  const [type, setType] = useState<string[]>([])
  const [vendor, setVendor] = useState(ALL)
  const [q, setQ] = useState('')
  const list = useAsync(
    () => api.hardware({ type: (type[0] || undefined) as HardwareType | undefined, vendor: vendor === ALL ? undefined : vendor, q: q || undefined, limit: 100 }),
    [type.join(), vendor, q],
  )
  return (
    <div>
      <PageHeader
        eyebrow="Hardware"
        title={
          <>
            The open database of Intel hardware for local AI.
          </>
        }
        description="Arc, Core Ultra, Xeon, and Gaudi are seeded. Other vendors' parts are welcome by pull request for comparison, and show up with the next deploy."
        actions={
          <Button variant="outline" render={<a href={CATALOG_DIR_URL} target="_blank" rel="noreferrer" />} nativeButton={false}>
            Add hardware by PR <ExternalLink data-icon="inline-end" />
          </Button>
        }
      />
      <Section>
        <Toolbar>
          <ToggleGroup value={type} onValueChange={(v) => setType(v as string[])} variant="outline" size="sm" className="flex-wrap">
            {HARDWARE_TYPES.map((t) => (
              <ToggleGroupItem key={t} value={t} aria-label={HARDWARE_TYPE_LABEL[t]}>
                <HardwareTypeIcon type={t} /> {HARDWARE_TYPE_LABEL[t]}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
          <Select value={vendor} onValueChange={(v) => setVendor(String(v))} items={vendorItems}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>{vendorItems.map((i) => <SelectItem key={i.value} value={i.value}>{i.label}</SelectItem>)}</SelectContent>
          </Select>
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search hardware" className="w-56 pl-8" />
          </div>
        </Toolbar>
        {list.error ? (
          <Block>
            <ErrorState error={list.error} />
          </Block>
        ) : list.loading && !list.data ? (
          <CellGrid cols={4}>
            {Array.from({ length: 8 }).map((_, i) => (
              <Cell key={i}>
                <Skeleton className="h-28" />
              </Cell>
            ))}
          </CellGrid>
        ) : list.data?.items.length ? (
          <CellGrid cols={4}>
            {list.data.items.map((h) => (
              <HardwareCard key={h.id} hardware={h} counts={!sealed} />
            ))}
          </CellGrid>
        ) : (
          <EmptyState title="Nothing matches" description="Try another vendor or type, or add the part by pull request." />
        )}
      </Section>
    </div>
  )
}

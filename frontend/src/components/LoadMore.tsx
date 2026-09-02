import { useState } from 'react'
import { Button } from '@/components/ui/button'

export function LoadMore({ hasMore, onLoad }: { hasMore: boolean; onLoad: () => Promise<void> }) {
  const [busy, setBusy] = useState(false)
  if (!hasMore) return null
  return (
    <div className="flex justify-center pt-4">
      <Button
        variant="outline"
        disabled={busy}
        onClick={async () => {
          setBusy(true)
          try {
            await onLoad()
          } finally {
            setBusy(false)
          }
        }}
      >
        {busy ? 'Loading…' : 'Load more'}
      </Button>
    </div>
  )
}

import { Link, useNavigate } from 'react-router-dom'
import { CellGrid } from '@/components/frame'
import { RuntimeBadge } from '@/components/RuntimeBadge'
import { ExecutionBadge } from '@/components/ExecutionBadge'
import { CustomRuntimeLink } from '@/components/CustomRuntimeLink'
import { VerificationBadge } from '@/components/VerificationBadge'
import { UserAvatar } from '@/components/UserAvatar'
import { RankMedal } from '@/components/RankMedal'
import type { BoardRow, Model, Quant, Runtime } from '@/lib/api/types'
import { fmtTps } from '@/lib/format'

/** The top three places as cells, first to third left to right. The submitter leads each cell. */
export function Podium({ rows, runtimes, models, quants }: { rows: BoardRow[]; runtimes: Runtime[]; models: Model[]; quants: Quant[] }) {
  const navigate = useNavigate()
  const rt = Object.fromEntries(runtimes.map((r) => [r.id, r]))
  const md = Object.fromEntries(models.map((m) => [m.id, m]))
  const qt = Object.fromEntries(quants.map((q) => [q.id, q]))
  const places = rows.slice(0, 3)
  return (
    <CellGrid cols={3}>
      {places.map(({ rank, result, unit }) => {
        const label = unit.kind === 'rig' ? unit.rig.name : `${unit.quantity > 1 ? `${unit.quantity}× ` : ''}${unit.hardware.name}`
        const context = unit.kind === 'rig' ? unit.rig.summary : `${unit.hardware.vendor} · in ${result.rig?.name ?? 'rig'}`
        const href = `/results/${result.id}`
        const user = result.submitter
        return (
          <div
            key={result.id}
            role="link"
            tabIndex={0}
            onClick={() => navigate(href)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                navigate(href)
              }
            }}
            className="group flex min-w-0 cursor-pointer flex-col gap-5 bg-background p-6 transition-colors hover:bg-card focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-inset focus-visible:outline-none md:p-7"
          >
            <div className="flex items-center justify-between">
              <RankMedal rank={rank} />
              <VerificationBadge verification={result.verification} />
            </div>
            {user ? (
              <Link to={`/u/${user.handle}`} onClick={(e) => e.stopPropagation()} className="flex min-w-0 items-center gap-3">
                <UserAvatar user={user} size="lg" className="size-12" />
                <span className="min-w-0">
                  <span className="block truncate text-lg font-semibold leading-tight hover:underline underline-offset-4">{user.name ?? user.handle}</span>
                  <span className="block truncate text-sm text-muted-foreground">@{user.handle}</span>
                </span>
              </Link>
            ) : null}
            <div className="font-mono text-4xl font-semibold tnum">
              {fmtTps(result.decodeTps)} <span className="text-base font-normal text-muted-foreground">tok/s</span>
            </div>
            <dl className="grid gap-4 sm:grid-cols-2">
              <div className="min-w-0">
                <dt className="text-xs font-medium uppercase tracking-label text-muted-foreground">Hardware</dt>
                <dd className="mt-1 min-w-0">
                  <div className="truncate text-sm font-medium">{label}</div>
                  <div className="truncate text-xs text-muted-foreground">{context}</div>
                </dd>
              </div>
              <div className="min-w-0">
                <dt className="text-xs font-medium uppercase tracking-label text-muted-foreground">Model</dt>
                <dd className="mt-1 min-w-0">
                  <div className="truncate text-sm font-medium">{md[result.modelId]?.name ?? result.modelId}</div>
                  <div className="font-mono text-xs text-muted-foreground">{qt[result.quant]?.label ?? result.quant}</div>
                </dd>
              </div>
            </dl>
            <div className="mt-auto">
              <div className="text-xs font-medium uppercase tracking-label text-muted-foreground">Runtime</div>
              <div className="mt-1 text-sm">
                <span className="inline-flex flex-wrap items-center gap-x-2 gap-y-1"><RuntimeBadge runtime={rt[result.runtimeId]} version={result.runtimeVersion} />{result.customRuntime ? <CustomRuntimeLink build={result.customRuntime} className="text-xs" /> : <ExecutionBadge result={result} iconOnly />}</span>
              </div>
            </div>
          </div>
        )
      })}
    </CellGrid>
  )
}

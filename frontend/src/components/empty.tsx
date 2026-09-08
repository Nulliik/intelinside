import type { CSSProperties, ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { GitHubMark } from '@/components/GitHubMark'
import { CellGrid, inset } from '@/components/frame'
import { useSession } from '@/hooks/useSession'
import { cn } from '@/lib/utils'

/*
  Empty states for the ranked surfaces. A board with nothing on it keeps its shape — a silhouette of the podium,
  chart, table, or rig cells that will live there — with the message sitting in a clearing masked out of the middle.
  The shape is the point: it says what this place is for, which a line of centred grey text cannot.

  EmptyState is the plain version, for smaller and secondary spots. These are for the surfaces a visitor comes to
  the site to read.
*/

/** One bar of a silhouette. Static, unlike Skeleton: nothing is loading, this is what is missing. */
function Bone({ className, style }: { className?: string; style?: CSSProperties }) {
  return <div className={cn('h-2.5 rounded-sm bg-foreground/[7%]', className)} style={style} />
}

// The clearing: the silhouette is masked away under the message so the words sit on clean ground. Wider on phones, where the
// text wraps to more lines; the shape is one ellipse per breakpoint, tuned by eye.
const CLEARING =
  '[mask-image:radial-gradient(ellipse_85%_72%_at_50%_50%,transparent_0,transparent_44%,rgb(0_0_0/0.75)_78%,#000_100%)] md:[mask-image:radial-gradient(ellipse_58%_88%_at_50%_50%,transparent_0,transparent_38%,rgb(0_0_0/0.75)_72%,#000_100%)]'

/**
 * A silhouette with a message centred on it. Both sit in the same grid cell, so the block is as tall as the
 * taller of the two. The silhouette is hidden from assistive tech; the message is all a screen reader meets.
 */
function Clearing({ silhouette, children }: { silhouette: ReactNode; children: ReactNode }) {
  return (
    <div className="grid *:col-start-1 *:row-start-1">
      <div aria-hidden className={cn('pointer-events-none select-none', CLEARING)}>
        {silhouette}
      </div>
      <div className={cn('flex flex-col items-center justify-center py-10 text-center', inset)}>{children}</div>
    </div>
  )
}

/** The hero's two-line form: a muted line for the situation, a white line for the ask. */
function Message({ lead, ask, actions, children }: { lead: string; ask: string; actions: ReactNode; children: ReactNode }) {
  return (
    <>
      <h3 className="max-w-2xl text-2xl font-semibold text-balance md:text-3xl">
        <span className="text-muted-foreground">{lead}</span>
        <br />
        {ask}
      </h3>
      <p className="mt-3 max-w-lg text-sm text-muted-foreground text-pretty md:text-base">{children}</p>
      <div className="mt-6 flex flex-wrap justify-center gap-2">{actions}</div>
    </>
  )
}

function GhostPodium() {
  return (
    <CellGrid cols={3}>
      {[0, 1, 2].map((i) => (
        <div key={i} className="flex flex-col gap-5 bg-background p-6 md:p-7">
          <div className="flex items-center justify-between">
            <Bone className="size-9 rounded-lg" />
            <Bone className="w-20" />
          </div>
          <div className="flex items-center gap-3">
            <Bone className="size-12 rounded-full" />
            <div className="flex flex-col gap-2">
              <Bone className="h-3 w-32" />
              <Bone className="h-2 w-20" />
            </div>
          </div>
          <Bone className="h-8 w-40" />
          <div className="grid grid-cols-2 gap-4">
            {[0, 1].map((j) => (
              <div key={j} className="flex flex-col gap-2">
                <Bone className="h-2 w-14" />
                <Bone className="h-3 w-28" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </CellGrid>
  )
}

// Bar lengths, fastest first, in the shape of TpsBarChart. Label bones vary so the axis reads as names, not a pattern.
const BARS = [92, 80, 71, 64, 55, 48, 40, 33]
const LABELS = [78, 56, 88, 64, 72, 50, 82, 60]

function GhostChart() {
  return (
    <div className="flex flex-col gap-3 p-5 md:p-8">
      {BARS.map((w, i) => (
        <div key={i} className="flex items-center gap-4">
          <div className="flex w-60 shrink-0 justify-end">
            <Bone style={{ width: `${LABELS[i]}%` }} />
          </div>
          <div className="flex-1">
            <Bone className="h-6 rounded-sm" style={{ width: `${w}%` }} />
          </div>
        </div>
      ))}
    </div>
  )
}

// Column widths per row, as percentages of the column, so the rows read as a table and not a pattern.
const ROWS = [
  [70, 60, 55, 60, 70, 50],
  [55, 70, 45, 60, 60, 50],
  [65, 50, 60, 60, 65, 50],
  [60, 65, 50, 60, 55, 50],
  [62, 58, 52, 60, 60, 50],
  [58, 62, 48, 60, 66, 50],
  [66, 54, 58, 60, 58, 50],
]

/** Table rows: seven on phones, where the podium or chart is hidden, five beside it from md. */
function GhostRows({ className }: { className?: string }) {
  return (
    <div className={cn('divide-y', className)}>
      {ROWS.map((w, i) => (
        <div
          key={i}
          className={cn('grid grid-cols-[1.25rem_2fr_1.2fr_1fr] items-center gap-5 py-4 md:grid-cols-[2rem_2.2fr_1.4fr_1fr_0.8fr_0.9fr_0.9fr]', i >= 5 && 'md:hidden', inset)}
        >
          <Bone className="w-3.5" />
          {w.map((pct, j) => (
            <Bone key={j} className={cn(j >= 3 && 'hidden md:block')} style={{ width: `${pct}%` }} />
          ))}
        </div>
      ))}
    </div>
  )
}

/** Rig cells in the shape of RigCard: two on phones, four on tablets, six from lg. */
function GhostRigs() {
  return (
    <CellGrid cols={3}>
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <div key={i} className={cn('flex flex-col gap-4 bg-background p-6 md:p-7', i >= 4 ? 'hidden lg:flex' : i >= 2 ? 'hidden sm:flex' : undefined)}>
          <Bone className="aspect-[2/1] h-auto w-full rounded-xl sm:aspect-[16/10]" />
          <div className="flex items-center gap-2">
            <Bone className="size-6 rounded-full" />
            <Bone className="w-16" />
            <Bone className="ml-auto w-12" />
          </div>
          <div className="flex flex-col gap-2">
            <Bone className="h-3.5 w-3/5" />
            <Bone className="h-2 w-4/5" />
          </div>
          <div className="mt-auto flex items-center justify-between pt-2">
            <Bone className="w-16" />
            <Bone className="w-14" />
          </div>
        </div>
      ))}
    </CellGrid>
  )
}

/** Three rows in the shape of a model tile's top three, for the model index while sealed. */
export function GhostList() {
  return (
    <div aria-hidden className="mt-1 divide-y">
      {[38, 46, 30].map((w, i) => (
        <div key={i} className="flex h-10 items-center gap-3">
          <Bone className="w-3" />
          <Bone style={{ width: `${w}%` }} />
          <Bone className="ml-auto size-4 rounded-full" />
          <Bone className="w-10" />
        </div>
      ))}
    </div>
  )
}

/**
 * A ranked view with nothing ranked on it. `podium` is the home page's shape, `chart` the board, rig, hardware and
 * runtime pages'. Pages name their subject with `lead` and prefill the form with `submitTo`.
 */
export function EmptyBoard({
  variant = 'podium',
  lead = 'No results yet.',
  ask = 'Post the first and it ranks right away.',
  body,
  submitTo = '/submit',
}: {
  variant?: 'podium' | 'chart'
  lead?: string
  ask?: string
  body?: ReactNode
  submitTo?: string
}) {
  const { user, requestSignIn } = useSession()
  return (
    <Clearing
      silhouette={
        variant === 'chart' ? (
          <>
            <div className="hidden border-b md:block">
              <GhostChart />
            </div>
            <GhostRows />
          </>
        ) : (
          <>
            <div className="hidden md:block">
              <GhostPodium />
            </div>
            <GhostRows className="md:border-t" />
          </>
        )
      }
    >
      <Message
        lead={lead}
        ask={ask}
        actions={
          <>
            {user ? (
              <Button size="lg" render={<Link to={submitTo} />} nativeButton={false}>
                <Plus data-icon="inline-start" /> Submit a result
              </Button>
            ) : (
              <Button size="lg" onClick={() => requestSignIn(submitTo)}>
                <GitHubMark data-icon="inline-start" className="size-4" /> Sign in to submit
              </Button>
            )}
            <Button size="lg" variant="outline" render={<Link to="/guidelines" />} nativeButton={false}>
              How to measure tok/s
            </Button>
          </>
        }
      >
        {body ?? 'Every result is one model, one runtime, and one machine. Submit yours and this fills in — it ranks the moment it is in.'}
      </Message>
    </Clearing>
  )
}

/** The rig section with no rigs to show. */
export function EmptyRigs() {
  const { user, requestSignIn } = useSession()
  return (
    <Clearing silhouette={<GhostRigs />}>
      <Message
        lead="No rigs yet."
        ask="Register yours and show it off."
        actions={
          user ? (
            <Button size="lg" render={<Link to="/rigs/new" />} nativeButton={false}>
              <Plus data-icon="inline-start" /> Register a rig
            </Button>
          ) : (
            <Button size="lg" onClick={() => requestSignIn('/rigs/new')}>
              <GitHubMark data-icon="inline-start" className="size-4" /> Sign in to register a rig
            </Button>
          )
        }
      >
        Name the machine, pick its parts from the catalog, add a photo. It goes up the moment you save it, ready to carry results.
      </Message>
    </Clearing>
  )
}

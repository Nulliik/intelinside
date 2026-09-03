import { Children, type ComponentProps, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

/*
  Layout primitives for the framed, hairline-grid look:
  - the page container draws two vertical guides (see AppShell);
  - Section draws a horizontal rule between them, with an optional uppercase label row;
  - CellGrid lays content out as cells separated by 1px lines;
  - Crosses put registration marks where a rule meets the guides;
  - PillTabs are the bordered text tabs.
*/

/** Page gutter outside the frame: small side margins so the frame can be as wide as the screen allows. */
export const gutter = 'px-4 md:px-6 xl:px-10'

/** The frame itself: fluid up to 1600px, with the two vertical guides. Nav, main, and footer all use it. */
export const frame = 'mx-auto w-full max-w-[1600px] md:border-x'

/** Horizontal padding that keeps content inset from the vertical guides. */
export const inset = 'px-5 md:px-8'

export function Section({ id, label, action, rule = 'top', className, children }: { id?: string; label?: ReactNode; action?: ReactNode; rule?: 'top' | 'both'; className?: string; children?: ReactNode }) {
  return (
    <section id={id} className={cn('relative border-t', rule === 'both' && 'border-b', className)}>
      <Crosses bottom={rule === 'both'} />
      {rule !== 'both' ? (
        <span className="crosses-bottom hidden">
          <Crosses top={false} bottom />
        </span>
      ) : null}
      {label ? (
        <div className={cn('flex min-h-11 items-center justify-between gap-4 border-b py-2', inset)}>
          <h2 className="font-sans text-xs font-medium uppercase tracking-label text-muted-foreground">{label}</h2>
          {action ? <div className="text-sm text-muted-foreground [&_a:hover]:text-foreground">{action}</div> : null}
        </div>
      ) : null}
      {children}
    </section>
  )
}

export function Toolbar({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn('flex flex-wrap items-center gap-3 border-b py-3', inset, className)}>{children}</div>
}

/** A plain block of inset content, for prose, empty states, and skeletons. */
export function Block({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn('py-8', inset, className)}>{children}</div>
}

/** Column counts. '2/4' is two on phones and four from lg, for strips of four figures. */
type Cols = 1 | 2 | 3 | 4 | 5 | '2/4'
const PRESET: Record<Cols, { cls: string; base: number; sm: number; lg: number }> = {
  1: { cls: 'grid-cols-1', base: 1, sm: 1, lg: 1 },
  2: { cls: 'grid-cols-1 sm:grid-cols-2', base: 1, sm: 2, lg: 2 },
  3: { cls: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3', base: 1, sm: 2, lg: 3 },
  4: { cls: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4', base: 1, sm: 2, lg: 4 },
  5: { cls: 'grid-cols-2 lg:grid-cols-5', base: 2, sm: 2, lg: 5 },
  '2/4': { cls: 'grid-cols-2 lg:grid-cols-4', base: 2, sm: 2, lg: 4 },
}

/** Cells separated by hairlines. Children must paint their own background (Cell does). */
export function CellGrid({ cols = 3, count, className, children }: { cols?: Cols; count?: number; className?: string; children: ReactNode }) {
  const n = count ?? Children.count(children)
  const p = PRESET[cols]
  const fill = (c: number) => (c === 1 ? 0 : (c - (n % c)) % c)
  const fillers: ReactNode[] = []
  for (let i = 0; i < fill(p.base); i++) fillers.push(<div key={`b${i}`} aria-hidden className="bg-background sm:hidden" />)
  for (let i = 0; i < fill(p.sm); i++) fillers.push(<div key={`s${i}`} aria-hidden className="hidden bg-background sm:block lg:hidden" />)
  for (let i = 0; i < fill(p.lg); i++) fillers.push(<div key={`l${i}`} aria-hidden className="hidden bg-background lg:block" />)
  return (
    <div className={cn('grid gap-px bg-border', p.cls, className)}>
      {children}
      {fillers}
    </div>
  )
}

export function Cell({ className, ...props }: ComponentProps<'div'>) {
  return <div className={cn('min-w-0 bg-background p-6 md:p-7', className)} {...props} />
}

function Cross({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      width="10"
      height="10"
      viewBox="0 0 10 10"
      className={cn('pointer-events-none absolute z-10 hidden text-muted-foreground/90 md:block [mask-image:radial-gradient(circle_at_center,black_20%,transparent_70%)]', className)}
    >
      <rect x="4" y="0" width="1" height="10" fill="currentColor" />
      <rect x="0" y="4" width="10" height="1" fill="currentColor" />
    </svg>
  )
}

/**
 * Registration marks where a horizontal rule meets the two vertical guides.
 * The line pixel sits at 4..5 in the 10px box. Offsets are from the padding box: the rule is the element's own 1px top or
 * bottom border and the guides are the parent frame's side borders, so left/top use 5px and right/bottom use 6px.
 */
export function Crosses({ top = true, bottom = false }: { top?: boolean; bottom?: boolean }) {
  return (
    <>
      {top ? (
        <>
          <Cross className="-top-[5px] -left-[5px]" />
          <Cross className="-top-[5px] -right-[6px]" />
        </>
      ) : null}
      {bottom ? (
        <>
          <Cross className="-bottom-[6px] -left-[5px]" />
          <Cross className="-bottom-[6px] -right-[6px]" />
        </>
      ) : null}
    </>
  )
}

/** A padded block inside a section, for charts and other framed content. */
export function Framed({ padded = true, className, children }: { padded?: boolean; className?: string; children: ReactNode }) {
  return <div className={cn('relative', padded && 'p-5 md:p-8', className)}>{children}</div>
}

export type PillTab<T extends string> = { value: T; label: ReactNode; count?: number; to?: string; disabled?: boolean; hint?: ReactNode }

/** Bordered text tabs. Pass `to` on items to make them links, otherwise `onChange` fires. */
export function PillTabs<T extends string>({ items, value, onChange, className }: { items: PillTab<T>[]; value: T; onChange?: (v: T) => void; className?: string }) {
  return (
    <div role="tablist" className={cn('flex flex-wrap items-center gap-1', className)}>
      {items.map((it) => {
        const active = it.value === value
        const cls = cn(
          'inline-flex items-center rounded-lg border px-3 py-1.5 text-sm transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
          active ? 'border-foreground/40 text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground',
          it.disabled && 'pointer-events-none opacity-40',
        )
        const body = (
          <>
            {it.label}
            {it.count != null ? <span className="ml-1.5 font-mono text-xs opacity-60">{it.count}</span> : null}
          </>
        )
        const control = it.to ? (
          <Link to={it.to} role="tab" aria-selected={active} className={cls}>
            {body}
          </Link>
        ) : (
          <button type="button" role="tab" aria-selected={active} className={cls} onClick={() => onChange?.(it.value)}>
            {body}
          </button>
        )
        if (!it.hint) return <span key={it.value} className="contents">{control}</span>
        return (
          <Tooltip key={it.value}>
            <TooltipTrigger render={control} />
            <TooltipContent>{it.hint}</TooltipContent>
          </Tooltip>
        )
      })}
    </div>
  )
}

/** "Read ›" style link. */
export function ArrowLink({ to, children, className }: { to: string; children: ReactNode; className?: string }) {
  return (
    <Link to={to} className={cn('group/arrow inline-flex items-center gap-1 text-sm font-medium text-foreground hover:underline underline-offset-4', className)}>
      {children}
      <ChevronRight className="size-3.5 transition-transform group-hover/arrow:translate-x-0.5" />
    </Link>
  )
}

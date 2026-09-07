import type { ReactNode } from 'react'
import { Section, inset } from '@/components/frame'
import { PageHeader } from '@/components/PageHeader'
import { cn } from '@/lib/utils'

/*
  Shell for the long legal pages (Terms, Privacy). Each section is a framed row: the heading sits in
  a rail on the left, against the guide, and the prose runs beside it. On a phone the rail stacks on
  top. Running prose is styled by `legalProse` rather than by hand, so the pages stay readable JSX.
*/

/** Element styles for the running text inside a section. Nested lists change marker so the nesting reads. */
export const legalProse =
  'space-y-4 text-sm leading-relaxed text-muted-foreground [&_h3]:mt-6 [&_h3]:font-heading [&_h3]:text-base [&_h3]:font-medium [&_h3]:text-foreground [&_strong]:font-medium [&_strong]:text-foreground [&_ul]:space-y-2 [&_li]:ml-5 [&_li]:list-disc [&_ul_ul]:mt-2 [&_ul_ul_li]:list-[circle] [&_ul_ul_ul_li]:list-[square] [&_a]:text-foreground [&_a]:underline [&_a]:underline-offset-4'

export function LegalPage({
  title,
  updated,
  intro,
  callout,
  children,
}: {
  title: ReactNode
  /** The date the text last changed, e.g. "September 7, 2026". */
  updated: string
  intro?: ReactNode
  /** The one thing worth reading before the rest. Boxed under the intro. */
  callout?: ReactNode
  children: ReactNode
}) {
  return (
    <div>
      <PageHeader
        eyebrow={<span className="font-mono text-xs uppercase tracking-label">Last updated {updated}</span>}
        title={title}
      >
        {intro ? <div className="mt-4 space-y-4 text-base text-muted-foreground text-pretty">{intro}</div> : null}
        {callout ? (
          <div className="mt-6 rounded-lg border bg-card p-4 text-sm leading-relaxed text-muted-foreground">{callout}</div>
        ) : null}
      </PageHeader>
      {children}
    </div>
  )
}

export function LegalSection({ id, heading, children }: { id?: string; heading: string; children: ReactNode }) {
  return (
    <Section id={id}>
      <div className="flex flex-col gap-4 py-8 md:flex-row md:gap-0 md:py-0">
        <div className={cn('shrink-0 md:w-72 md:border-r md:py-10', inset)}>
          <h2 className="font-heading text-lg font-medium text-foreground md:sticky md:top-6">{heading}</h2>
        </div>
        <div className={cn('min-w-0 flex-1 md:py-10', inset)}>
          <div className={cn('max-w-3xl', legalProse)}>{children}</div>
        </div>
      </div>
    </Section>
  )
}

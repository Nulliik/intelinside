import { GitFork } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { CustomRuntime } from '@/lib/api/types'
import { cn } from '@/lib/utils'

/** Where one lives. Nested under its runtime, because a custom runtime means nothing without the one it changed. */
export const customRuntimeHref = (build: Pick<CustomRuntime, 'id' | 'runtimeId'>) =>
  `/runtimes/${build.runtimeId}/custom/${build.id}`

/**
 * The custom runtime's name, linked. This is the difference between a caveat and a credit: the same mark that warns a reader
 * off the board also takes them to the work.
 */
export function CustomRuntimeLink({ build, className }: { build: Pick<CustomRuntime, 'id' | 'runtimeId' | 'name'>; className?: string }) {
  return (
    <Link
      to={customRuntimeHref(build)}
      onClick={(e) => e.stopPropagation()}
      className={cn('inline-flex items-center gap-1.5 text-warning hover:underline underline-offset-4', className)}
    >
      <GitFork className="size-3.5 shrink-0" />
      {build.name}
    </Link>
  )
}

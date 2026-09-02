import { api } from '@/lib/api'
import type { Model, Quant, Runtime } from '@/lib/api/types'
import { useAsync } from './useAsync'

export type Catalog = { runtimes: Runtime[]; models: Model[]; quants: Quant[] }

let cache: Promise<Catalog> | null = null

/** Runtimes, models, and quants, loaded once and shared across pages. */
export function loadCatalog(): Promise<Catalog> {
  cache ??= Promise.all([api.runtimes(), api.models(), api.quants()]).then(([runtimes, models, quants]) => ({ runtimes, models, quants }))
  return cache
}

export function useCatalog() {
  return useAsync(loadCatalog, [])
}

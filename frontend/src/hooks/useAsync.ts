import { useCallback, useEffect, useState } from 'react'

type State<T> = { data?: T; error?: Error; loading: boolean }

/** Minimal data hook: runs `fn` when `deps` change, exposes refetch and setData for optimistic updates. */
export function useAsync<T>(fn: () => Promise<T>, deps: unknown[]) {
  const [state, setState] = useState<State<T>>({ loading: true })
  const [tick, setTick] = useState(0)
  useEffect(() => {
    let alive = true
    setState((s) => ({ ...s, loading: true, error: undefined }))
    fn().then(
      (data) => alive && setState({ data, loading: false }),
      (error: Error) => alive && setState((s) => ({ ...s, error, loading: false })),
    )
    return () => {
      alive = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick])
  const refetch = useCallback(() => setTick((t) => t + 1), [])
  const setData = useCallback((updater: T | ((prev: T | undefined) => T)) => {
    setState((s) => ({ ...s, data: typeof updater === 'function' ? (updater as (p: T | undefined) => T)(s.data) : updater }))
  }, [])
  return { ...state, refetch, setData }
}

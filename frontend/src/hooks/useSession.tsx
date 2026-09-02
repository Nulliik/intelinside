import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { api } from '@/lib/api'
import type { User } from '@/lib/api/types'

type Session = {
  user: User | null
  loading: boolean
  refresh: () => Promise<void>
  signOut: () => Promise<void>
  /** Opens the mock picker, or redirects to GitHub in live mode. */
  requestSignIn: (returnTo?: string) => void
  signInOpen: boolean
  setSignInOpen: (open: boolean) => void
  mockSignIn: (handle: string) => Promise<void>
}

const SessionContext = createContext<Session | null>(null)

export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [signInOpen, setSignInOpen] = useState(false)

  const refresh = useCallback(async () => {
    try {
      setUser(await api.me())
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const signOut = useCallback(async () => {
    await api.signOut()
    setUser(null)
  }, [])

  const requestSignIn = useCallback((returnTo?: string) => {
    if (api.mode === 'live') window.location.assign(api.signInUrl(returnTo ?? window.location.pathname))
    else setSignInOpen(true)
  }, [])

  const mockSignIn = useCallback(async (handle: string) => {
    if (!api.mockSignIn) return
    setUser(await api.mockSignIn(handle))
    setSignInOpen(false)
  }, [])

  const value = useMemo<Session>(
    () => ({ user, loading, refresh, signOut, requestSignIn, signInOpen, setSignInOpen, mockSignIn }),
    [user, loading, refresh, signOut, requestSignIn, signInOpen, mockSignIn],
  )
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}

export function useSession(): Session {
  const ctx = useContext(SessionContext)
  if (!ctx) throw new Error('useSession must be used inside SessionProvider')
  return ctx
}

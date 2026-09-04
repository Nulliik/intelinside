import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { LoaderCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useSession } from '@/hooks/useSession'
import { takeAuthReturnTo } from '@/lib/auth'

function callbackError(): string | null {
  const query = new URLSearchParams(window.location.search)
  const fragment = new URLSearchParams(window.location.hash.slice(1))
  return query.get('error_description') ?? fragment.get('error_description')
}

export default function AuthCallback() {
  const { user, loading } = useSession()
  const navigate = useNavigate()
  const returnTo = useRef<string | null>(null)
  const [error] = useState(callbackError)

  useEffect(() => {
    if (loading || error) return
    if (user) {
      returnTo.current ??= takeAuthReturnTo()
      navigate(returnTo.current, { replace: true })
    }
  }, [error, loading, navigate, user])

  if (error) {
    return (
      <section className="mx-auto flex max-w-xl flex-col items-center gap-4 px-6 py-20 text-center">
        <h1 className="text-2xl font-semibold">GitHub sign-in failed</h1>
        <p className="text-sm text-muted-foreground">{error}</p>
        <Button render={<Link to="/" />} nativeButton={false}>Return home</Button>
      </section>
    )
  }

  if (!loading && !user) {
    return (
      <section className="mx-auto flex max-w-xl flex-col items-center gap-4 px-6 py-20 text-center">
        <h1 className="text-2xl font-semibold">No session was created</h1>
        <p className="text-sm text-muted-foreground">Please return home and try signing in again.</p>
        <Button render={<Link to="/" />} nativeButton={false}>Return home</Button>
      </section>
    )
  }

  return (
    <section className="flex items-center justify-center gap-2 px-6 py-20 text-sm text-muted-foreground" aria-live="polite">
      <LoaderCircle className="size-4 animate-spin" /> Finishing GitHub sign-in…
    </section>
  )
}

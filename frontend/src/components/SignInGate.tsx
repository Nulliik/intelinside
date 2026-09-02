import { useLocation } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/EmptyState'
import { GitHubMark } from '@/components/GitHubMark'
import { useSession } from '@/hooks/useSession'

/** Shown in place of a write flow when nobody is signed in. */
export function SignInGate({ what }: { what: string }) {
  const { requestSignIn } = useSession()
  const location = useLocation()
  return (
    <EmptyState
      icon={<GitHubMark />}
      title={`Sign in to ${what}`}
      description="Sign-in uses your public GitHub profile only. Your repos are never requested."
      action={
        <Button onClick={() => requestSignIn(location.pathname + location.search)}>
          <GitHubMark data-icon="inline-start" className="size-4" /> Sign in with GitHub
        </Button>
      }
    />
  )
}

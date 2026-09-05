import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { GitHubMark } from '@/components/GitHubMark'
import { UserAvatar } from '@/components/UserAvatar'
import { useAsync } from '@/hooks/useAsync'
import { useSession } from '@/hooks/useSession'
import { api } from '@/lib/api'

/** Offline mock mode only. Configured Supabase Auth redirects to GitHub instead. */
export function SignInDialog() {
  const { signInOpen, setSignInOpen, mockSignIn } = useSession()
  const users = useAsync(() => (api.mockUsers ? api.mockUsers() : Promise.resolve([])), [signInOpen])
  return (
    <Dialog open={signInOpen} onOpenChange={setSignInOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GitHubMark className="size-5" /> Sign in with GitHub
          </DialogTitle>
          <DialogDescription>
            Sign in to register rigs, submit results, and confirm or flag entries. Only your public profile is read, never your repos.
          </DialogDescription>
        </DialogHeader>
        <div className="rounded-lg border border-dashed p-3 text-xs text-muted-foreground">
          Mock mode: pick a seeded account. The real flow redirects to GitHub and comes back signed in.
        </div>
        <div className="grid max-h-80 gap-1 overflow-y-auto">
          {(users.data ?? []).map((u) => (
            <Button key={u.id} variant="ghost" className="h-auto justify-start gap-3 px-2 py-2" onClick={() => void mockSignIn(u.handle)}>
              <UserAvatar user={u} />
              <span className="flex min-w-0 flex-col items-start">
                <span className="text-sm">{u.name}</span>
                <span className="text-xs text-muted-foreground">@{u.handle}</span>
              </span>
            </Button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}

import { useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { LogOut, Menu, Plus, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import { GitHubMark } from '@/components/GitHubMark'
import { UserAvatar } from '@/components/UserAvatar'
import { useSession } from '@/hooks/useSession'
import { frame, gutter, inset } from '@/components/frame'
import { BRAND_NAME } from '@/lib/brand'
import { cn } from '@/lib/utils'

const LINKS = [
  { to: '/models', label: 'Models' },
  { to: '/hardware', label: 'Hardware' },
  { to: '/rigs', label: 'Rigs' },
]

function navClass({ isActive }: { isActive: boolean }) {
  return cn('rounded-md px-2.5 py-1.5 text-sm transition-colors hover:text-foreground', isActive ? 'text-foreground bg-muted' : 'text-muted-foreground')
}

export function TopNav() {
  const { user, loading, signOut, requestSignIn } = useSession()
  const [open, setOpen] = useState(false)
  const location = useLocation()

  const submit = user ? (
    <Button render={<Link to="/submit" />} nativeButton={false}>
      <Plus data-icon="inline-start" /> Submit result
    </Button>
  ) : (
    <Button onClick={() => requestSignIn('/submit')}>
      <Plus data-icon="inline-start" /> Submit result
    </Button>
  )

  return (
    <header className="sticky top-0 z-40 border-b bg-background">
      <div className={gutter}>
      <div className={cn(frame, inset, 'flex h-14 items-center gap-3')}>
        <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setOpen(true)} aria-label="Open menu">
          <Menu />
        </Button>
        <Link to="/" className="flex items-center gap-2 font-semibold">
          <span className="inline-block size-2.5 rounded-sm bg-primary" aria-hidden />
          {BRAND_NAME}
        </Link>
        <nav aria-label="Primary" className="ml-4 hidden items-center gap-1 md:flex">
          {LINKS.map((l) => (
            <NavLink key={l.to} to={l.to} className={navClass}>
              {l.label}
            </NavLink>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <div className="hidden sm:block">{submit}</div>
          {loading ? (
            <Skeleton className="size-8 rounded-full" />
          ) : user ? (
            <DropdownMenu>
              <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="rounded-full" aria-label="Account menu" />}>
                <UserAvatar user={user} />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuLabel>
                  <div className="text-sm">{user.name ?? user.handle}</div>
                  <div className="text-xs font-normal text-muted-foreground">@{user.handle}</div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem render={<Link to={`/u/${user.handle}`} />}>
                  <User /> Profile
                </DropdownMenuItem>
                <DropdownMenuItem render={<Link to={`/u/${user.handle}?tab=rigs`} />}>My rigs</DropdownMenuItem>
                <DropdownMenuItem render={<Link to={`/u/${user.handle}?tab=results`} />}>My results</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => void signOut()}>
                  <LogOut /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button variant="outline" onClick={() => requestSignIn(location.pathname)}>
              <GitHubMark data-icon="inline-start" className="size-4" /> Sign in
            </Button>
          )}
        </div>
      </div>
      </div>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-72">
          <SheetHeader>
            <SheetTitle>{BRAND_NAME}</SheetTitle>
          </SheetHeader>
          <nav aria-label="Primary, mobile" className="flex flex-col gap-1 px-4">
            {LINKS.map((l) => (
              <NavLink key={l.to} to={l.to} className={navClass} onClick={() => setOpen(false)}>
                {l.label}
              </NavLink>
            ))}
            <div className="mt-3" onClick={() => setOpen(false)}>
              {submit}
            </div>
          </nav>
        </SheetContent>
      </Sheet>
    </header>
  )
}

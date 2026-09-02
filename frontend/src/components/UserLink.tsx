import { Link } from 'react-router-dom'
import { UserAvatar } from '@/components/UserAvatar'
import type { User } from '@/lib/api/types'
import { cn } from '@/lib/utils'

export function UserLink({ user, className, size = 'sm' }: { user?: User | null; className?: string; size?: 'sm' | 'default' }) {
  if (!user) return <span className="text-muted-foreground">—</span>
  return (
    <Link
      to={`/u/${user.handle}`}
      onClick={(e) => e.stopPropagation()}
      className={cn('inline-flex items-center gap-1.5 text-foreground hover:underline underline-offset-4', className)}
    >
      <UserAvatar user={user} size={size} />
      <span className="truncate">{user.handle}</span>
    </Link>
  )
}

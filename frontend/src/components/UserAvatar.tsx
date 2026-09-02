import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import type { User } from '@/lib/api/types'

export function UserAvatar({ user, size = 'default', className }: { user?: User | null; size?: 'sm' | 'default' | 'lg'; className?: string }) {
  const initials = (user?.name ?? user?.handle ?? '?').slice(0, 2).toUpperCase()
  return (
    <Avatar size={size} className={className}>
      {user?.avatarUrl ? <AvatarImage src={user.avatarUrl} alt={user.handle} /> : null}
      <AvatarFallback>{initials}</AvatarFallback>
    </Avatar>
  )
}

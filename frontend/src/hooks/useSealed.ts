import { REVEAL_AT } from '@/lib/launch'
import { useCountdown, type Countdown } from './useCountdown'

/**
 * Launch-week state for a page: sealed while the flag is set and the moment has not passed. It ticks, so a page
 * that is open at the moment flips to its ordinary state in place. `revealAt` is null once the seal has lifted.
 */
export function useSealed(): { sealed: boolean; revealAt: Date | null; countdown: Countdown | null } {
  const countdown = useCountdown(REVEAL_AT)
  const sealed = REVEAL_AT != null && countdown != null && !countdown.done
  return { sealed, revealAt: sealed ? REVEAL_AT : null, countdown }
}

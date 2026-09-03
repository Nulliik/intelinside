import { useEffect, useState } from 'react'

export type Countdown = { days: number; hours: number; minutes: number; seconds: number; done: boolean }

function split(target: Date, now: number): Countdown {
  const s = Math.max(0, Math.floor((target.getTime() - now) / 1000))
  return { days: Math.floor(s / 86400), hours: Math.floor((s % 86400) / 3600), minutes: Math.floor((s % 3600) / 60), seconds: s % 60, done: s === 0 }
}

/**
 * Time left until `target`, recomputed from the clock every second rather than accumulated, so a tab that
 * sat in the background is right the moment it comes back. Stops ticking at zero. Null when there is no target.
 */
export function useCountdown(target: Date | null): Countdown | null {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (!target || target.getTime() <= Date.now()) return
    const id = setInterval(() => {
      const t = Date.now()
      setNow(t)
      if (t >= target.getTime()) clearInterval(id)
    }, 1000)
    return () => clearInterval(id)
  }, [target])
  return target ? split(target, now) : null
}

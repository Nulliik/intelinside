export function fmtTps(n: number | undefined | null): string {
  if (n == null || Number.isNaN(n)) return '—'
  if (n >= 100) return n.toFixed(0)
  if (n >= 10) return n.toFixed(1)
  return n.toFixed(2)
}

export function fmtInt(n: number | undefined | null): string {
  if (n == null) return '—'
  return new Intl.NumberFormat('en-US').format(n)
}

export function fmtMs(n: number | undefined | null): string {
  if (n == null) return '—'
  return n >= 1000 ? `${(n / 1000).toFixed(2)} s` : `${Math.round(n)} ms`
}

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/

/**
 * "Sep 2, 2026". Date-only values such as a run date are calendar days, not instants: they are formatted in UTC so
 * the day never shifts with the viewer's zone. Full timestamps keep the viewer's zone.
 */
export function fmtDate(iso: string): string {
  const dateOnly = DATE_ONLY.test(iso)
  return new Date(dateOnly ? `${iso}T00:00:00Z` : iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...(dateOnly ? { timeZone: 'UTC' } : {}),
  })
}

export function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.round(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.round(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.round(h / 24)
  if (d < 30) return `${d}d ago`
  const mo = Math.round(d / 30)
  if (mo < 12) return `${mo}mo ago`
  return `${Math.round(mo / 12)}y ago`
}

/** An instant in the viewer's own zone, zone named: "Fri, Sep 11, 9:00 AM PDT". */
export function fmtInstant(d: Date): string {
  return new Intl.DateTimeFormat('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZoneName: 'short' }).format(d)
}

/** "Friday", in the viewer's zone. */
export function fmtWeekday(d: Date): string {
  return d.toLocaleDateString('en-US', { weekday: 'long' })
}

export function pluralize(n: number, one: string, many = `${one}s`): string {
  return `${fmtInt(n)} ${n === 1 ? one : many}`
}

export function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

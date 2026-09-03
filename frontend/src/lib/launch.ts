/*
  Launch week. VITE_REVEAL_AT is the instant the board goes live, as an ISO timestamp with a zone
  (2026-09-11T16:00:00Z is Fri Sep 11, 9:00 AM PT). While it is in the future the home page shows the
  sealed state; unset, malformed, or past means the ordinary page, so the code goes inert on its own
  once the moment passes. Set it in the Vercel project for production; `frontend/.env.sealed` sets it
  for the `frontend-sealed` launch config.
*/
function parse(raw: string | undefined): Date | null {
  if (!raw) return null
  const d = new Date(raw)
  return Number.isNaN(d.getTime()) ? null : d
}

export const REVEAL_AT: Date | null = parse(import.meta.env.VITE_REVEAL_AT)

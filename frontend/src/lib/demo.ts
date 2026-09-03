/*
  Mock-mode demo switch, for preview links. `?demo=launch` shows launch morning (the board sealed, nothing
  registered), `?demo=sealed` the sealed state with the seed's rigs, and `?demo=off` clears it. The choice is
  remembered for the tab so in-app navigation and reloads keep it. Ignored entirely in live mode.
*/
export type Demo = 'launch' | 'sealed'

const KEY = 'intelinside.demo'

function read(): Demo | null {
  if (import.meta.env.VITE_API_MODE === 'live' || typeof window === 'undefined') return null
  try {
    const q = new URLSearchParams(window.location.search).get('demo')
    if (q === 'off') {
      sessionStorage.removeItem(KEY)
      return null
    }
    if (q === 'launch' || q === 'sealed') {
      sessionStorage.setItem(KEY, q)
      return q
    }
    const saved = sessionStorage.getItem(KEY)
    return saved === 'launch' || saved === 'sealed' ? saved : null
  } catch {
    return null
  }
}

export const DEMO: Demo | null = read()

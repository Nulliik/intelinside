/**
 * Cookie consent: what the visitor has allowed us to store on their device.
 *
 * Nothing outside "strictly necessary" is stored until the visitor opts in. This module is the one
 * source of truth for that choice after the banner. It is a tiny external store read through
 * `useSyncExternalStore`, so the banner, the preferences dialog, and the footer's Cookies Settings
 * button share one state without a provider around the whole tree.
 *
 * Four categories, the standard ones:
 *   necessary  — the session, the sign-in return path, this choice itself. Always on.
 *   functional — remembered preferences.
 *   analytics  — how the site is used.
 *   marketing  — advertising. We have never set one.
 *
 * `necessary` and `analytics` have something in them today (see cookies.ts). Google Analytics is
 * governed by Consent Mode v2 rather than by a load-time check: index.html denies every storage type
 * before gtag.js runs, and `syncGtag` below sends the visitor's answer as an update. A non-Google tag
 * added later gates itself on `hasConsent(category)` instead.
 */

import { useSyncExternalStore } from 'react'

declare global {
  interface Window {
    /** Defined by the Consent Mode snippet in index.html, before gtag.js loads. */
    gtag?: (...args: unknown[]) => void
  }
}

export type CookieCategory = 'necessary' | 'functional' | 'analytics' | 'marketing'
export type Categories = Record<CookieCategory, boolean>

export const CONSENT_STORAGE_KEY = 'intelinside.consent'
/**
 * Bump when what we store materially changes: stored choices are invalidated and everyone is asked
 * again. Went to 2 when Google Analytics landed (Sep 7, 2026). Keep it in step with the inline
 * snippet in index.html, which reads the same record before the app boots.
 */
export const CONSENT_VERSION = 2
/** A choice older than this has expired, and we ask again. */
export const CONSENT_MAX_AGE_MS = 365 * 24 * 60 * 60 * 1000

const NONE: Categories = { necessary: true, functional: false, analytics: false, marketing: false }
const ALL: Categories = { necessary: true, functional: true, analytics: true, marketing: true }

type StoredRecord = { v: number; at: number; categories: Categories }

export type ConsentState = {
  /** True once a valid, unexpired choice is stored. The banner shows until it is. */
  decided: boolean
  categories: Categories
  /** Whether the per-category dialog is open. */
  settingsOpen: boolean
}

function readStored(): { decided: boolean; categories: Categories } {
  try {
    const raw = localStorage.getItem(CONSENT_STORAGE_KEY)
    if (!raw) return { decided: false, categories: NONE }
    const rec = JSON.parse(raw) as StoredRecord
    const fresh =
      rec &&
      rec.v === CONSENT_VERSION &&
      typeof rec.at === 'number' &&
      Date.now() - rec.at < CONSENT_MAX_AGE_MS &&
      rec.categories
    if (!fresh) return { decided: false, categories: NONE }
    return {
      decided: true,
      categories: {
        necessary: true,
        functional: !!rec.categories.functional,
        analytics: !!rec.categories.analytics,
        marketing: !!rec.categories.marketing,
      },
    }
  } catch {
    return { decided: false, categories: NONE }
  }
}

let state: ConsentState = { ...readStored(), settingsOpen: false }
const listeners = new Set<() => void>()

function setState(patch: Partial<ConsentState>): void {
  state = { ...state, ...patch }
  for (const listener of listeners) listener()
}

/** The four categories as Consent Mode v2 signals. Mirrors the defaults in index.html. */
function signalsFor(c: Categories): Record<string, 'granted' | 'denied'> {
  const g = (on: boolean) => (on ? 'granted' : 'denied')
  return {
    security_storage: 'granted',
    functionality_storage: g(c.functional),
    personalization_storage: g(c.functional),
    analytics_storage: g(c.analytics),
    ad_storage: g(c.marketing),
    ad_user_data: g(c.marketing),
    ad_personalization: g(c.marketing),
  }
}

/** Tell the Google tag what the visitor just chose. A no-op if gtag.js has not loaded. */
function syncGtag(c: Categories): void {
  window.gtag?.('consent', 'update', signalsFor(c))
}

function persist(categories: Categories): void {
  const next: Categories = { ...categories, necessary: true }
  const rec: StoredRecord = { v: CONSENT_VERSION, at: Date.now(), categories: next }
  try {
    localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(rec))
  } catch {
    /* Private window, or storage turned off. The choice holds for this session only. */
  }
  setState({ decided: true, categories: next, settingsOpen: false })
  syncGtag(next)
}

export function acceptAllConsent(): void {
  persist(ALL)
}

export function rejectAllConsent(): void {
  persist(NONE)
}

/** Store an explicit per-category choice. Necessary stays on whatever is passed. */
export function saveConsent(categories: Categories): void {
  persist(categories)
}

export function openConsentSettings(): void {
  setState({ settingsOpen: true })
}

export function closeConsentSettings(): void {
  setState({ settingsOpen: false })
}

/** Gate for anything that stores outside the necessary category. */
export function hasConsent(category: CookieCategory): boolean {
  return state.categories[category]
}

export function subscribeConsent(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function getConsentSnapshot(): ConsentState {
  return state
}

/** The current choice, re-rendering the caller whenever it changes. */
export function useConsent(): ConsentState {
  return useSyncExternalStore(subscribeConsent, getConsentSnapshot)
}

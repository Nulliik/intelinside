/**
 * Everything this site stores on your device, by category. Read by the preferences dialog and by the
 * cookie table on the Privacy page, so what the banner governs and what the policy discloses cannot
 * drift apart.
 *
 * Add a row here when you add something that stores. If the addition changes what a category does,
 * bump CONSENT_VERSION in consent.ts so people who already answered are asked again.
 *
 * Most of what is here is not a cookie in the HTTP sense — the session lives in local storage, not a
 * cookie header — but Google Analytics sets real ones. "Cookies" is the word people look for either
 * way, so it is the word the banner and this table use.
 */
import { BRAND_NAME } from '@/lib/brand'
import type { CookieCategory } from '@/lib/consent'

export type CookieRow = {
  name: string
  provider: string
  purpose: string
  duration: string
}

export type CookieCategoryDef = {
  key: CookieCategory
  label: string
  /** Locked on: the site does not work without it. */
  locked?: boolean
  description: string
  cookies: CookieRow[]
}

export const COOKIE_CATEGORIES: CookieCategoryDef[] = [
  {
    key: 'necessary',
    label: 'Strictly necessary',
    locked: true,
    description:
      'Keeps you signed in, returns you to the page you came from, and remembers this choice. Always on, and none of it is used to profile you.',
    cookies: [
      {
        name: 'intelinside.consent',
        provider: BRAND_NAME,
        purpose: 'Remembers which categories you allowed, so we stop asking.',
        duration: '12 months (local storage)',
      },
      {
        name: 'sb-<project>-auth-token',
        provider: 'Supabase',
        purpose:
          'Holds your session after you sign in with GitHub, and refreshes it while you browse. Set only once you sign in.',
        duration: 'Until you sign out (local storage)',
      },
      {
        name: 'intelinside.auth.returnTo',
        provider: BRAND_NAME,
        purpose: 'Remembers the page you were on when you started signing in, so you land back on it.',
        duration: 'Until you close the tab (session storage)',
      },
    ],
  },
  {
    key: 'functional',
    label: 'Functional',
    description:
      'Remember choices you make, like filters or units, to give you a more personal experience. We store nothing in this category today.',
    cookies: [],
  },
  {
    key: 'analytics',
    label: 'Analytics',
    description:
      'Tell us which pages and boards people actually use, so we know what to improve. Aggregated, and not used to identify you. Nothing is set until you turn this on.',
    cookies: [
      {
        name: '_ga',
        provider: 'Google Analytics',
        purpose: 'Tells one visitor apart from another.',
        duration: '2 years',
      },
      {
        // The suffix is the measurement ID from index.html without its "G-".
        name: '_ga_DNTXPVPPEJ',
        provider: 'Google Analytics',
        purpose: 'Keeps the Google Analytics 4 session going across pages.',
        duration: '2 years',
      },
    ],
  },
  {
    key: 'marketing',
    label: 'Marketing',
    description:
      'Used to deliver and measure advertising. We have never set one of these, and we do not sell or share what we hold.',
    cookies: [],
  },
]

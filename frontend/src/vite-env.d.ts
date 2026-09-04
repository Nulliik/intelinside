/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_MODE?: 'mock' | 'live' | 'supabase'
  readonly VITE_SUPABASE_URL?: string
  readonly VITE_SUPABASE_PUBLISHABLE_KEY?: string
  /** Launch week: the ISO instant the board goes live. Unset or past means the ordinary site. See src/lib/launch.ts. */
  readonly VITE_REVEAL_AT?: string
  /** Mock mode only: 'true' starts with no rigs or results, as on launch morning. */
  readonly VITE_MOCK_EMPTY?: string
}
interface ImportMeta {
  readonly env: ImportMetaEnv
}

/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_MODE?: 'mock' | 'live'
  /** Launch week: the ISO instant the board goes live. Unset or past means the ordinary site. See src/lib/launch.ts. */
  readonly VITE_REVEAL_AT?: string
}
interface ImportMeta {
  readonly env: ImportMetaEnv
}

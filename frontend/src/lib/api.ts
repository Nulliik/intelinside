import type { Api } from './api/types'
import { mockApi } from './api/mock'
import { liveApi } from './api/live'
import { supabaseApi } from './api/supabase'

// Supabase is the hosted backend. The legacy fetch adapter remains available
// for deployments that provide the API described in docs/API.md.
export const api: Api = import.meta.env.VITE_API_MODE === 'supabase'
  ? supabaseApi
  : import.meta.env.VITE_API_MODE === 'live'
    ? liveApi
    : mockApi
export * from './api/types'

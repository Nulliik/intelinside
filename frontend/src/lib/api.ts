import type { Api } from './api/types'
import { mockApi } from './api/mock'
import { liveApi } from './api/live'

// The only module that talks to the network. VITE_API_MODE=live switches to Jack's backend.
export const api: Api = import.meta.env.VITE_API_MODE === 'live' ? liveApi : mockApi
export * from './api/types'

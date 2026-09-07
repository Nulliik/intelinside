import type { Api } from './types'
import { ApiError } from './types'

// Thin fetch client for Jack's backend. Paths and shapes follow docs/API.md.

type Query = Record<string, string | number | string[] | undefined>

function qs(q: Query = {}): string {
  const p = new URLSearchParams()
  for (const [k, v] of Object.entries(q)) {
    if (v == null || v === '' || (Array.isArray(v) && v.length === 0)) continue
    p.set(k, Array.isArray(v) ? v.join(',') : String(v))
  }
  const s = p.toString()
  return s ? `?${s}` : ''
}

async function req<T>(path: string, init?: RequestInit & { json?: unknown }): Promise<T> {
  const headers: Record<string, string> = {}
  let body: BodyInit | undefined
  if (init?.json !== undefined) {
    headers['content-type'] = 'application/json'
    body = JSON.stringify(init.json)
  } else if (init?.body) body = init.body
  const res = await fetch(path, { ...init, body, headers: { ...headers, ...(init?.headers as Record<string, string>) }, credentials: 'include' })
  if (res.status === 204) return undefined as T
  const data = await res.json().catch(() => null)
  if (!res.ok) {
    const e = data?.error ?? {}
    throw new ApiError(e.code ?? 'error', e.message ?? res.statusText, res.status, e.fields)
  }
  return data as T
}

export const liveApi: Api = {
  mode: 'live',
  async me() {
    try {
      return await req('/api/me')
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) return null
      throw e
    }
  },
  signInUrl: (returnTo) => `/auth/github?returnTo=${encodeURIComponent(returnTo)}`,
  signOut: () => req('/auth/logout', { method: 'POST' }),

  models: () => req('/api/models'),
  model: (id) => req(`/api/models/${id}`),
  modelSummaries: () => req('/api/models/summary'),
  runtimes: () => req('/api/runtimes'),
  quants: () => req('/api/quants'),
  hardware: (params) => req(`/api/hardware${qs(params as Query)}`),
  hardwareItem: (id) => req(`/api/hardware/${id}`),

  board: (modelId, quant, params) => req(`/api/boards/${modelId}/${quant}${qs(params as unknown as Query)}`),

  rigs: (params) => req(`/api/rigs${qs(params as Query)}`),
  rig: (id) => req(`/api/rigs/${id}`),
  createRig: (input) => req('/api/rigs', { method: 'POST', json: input }),
  updateRig: (id, input) => req(`/api/rigs/${id}`, { method: 'PATCH', json: input }),
  deleteRig: (id) => req(`/api/rigs/${id}`, { method: 'DELETE' }),
  runtimeSummaries: () => req('/api/runtimes/summaries'),
  customRuntimes: (params) => req(`/api/custom-runtimes${qs(params as Query)}`),
  customRuntime: (id) => req(`/api/custom-runtimes/${id}`),
  createCustomRuntime: (input) => req('/api/custom-runtimes', { method: 'POST', json: input }),
  updateCustomRuntime: (id, input) => req(`/api/custom-runtimes/${id}`, { method: 'PATCH', json: input }),

  results: (params) => req(`/api/results${qs(params as Query)}`),
  result: (id) => req(`/api/results/${id}`),
  createResult: (input) => req('/api/results', { method: 'POST', json: input }),
  updateResult: (id, input) => req(`/api/results/${id}`, { method: 'PATCH', json: input }),
  deleteResult: (id) => req(`/api/results/${id}`, { method: 'DELETE' }),
  confirmResult: (id) => req(`/api/results/${id}/confirm`, { method: 'POST' }),
  flagResult: (id, reason, note) => req(`/api/results/${id}/flag`, { method: 'POST', json: { reason, note } }),

  user: (handle) => req(`/api/users/${handle}`),
  userRigs: (handle) => req(`/api/users/${handle}/rigs`),
  userResults: (handle) => req(`/api/users/${handle}/results`),

  home: () => req('/api/home'),
  topResults: (params) => req(`/api/results/top${qs(params as Query)}`),
  upload: (file) => {
    const fd = new FormData()
    fd.append('file', file)
    return req('/api/uploads', { method: 'POST', body: fd })
  },
}

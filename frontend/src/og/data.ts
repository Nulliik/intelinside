// Everything a card needs, read straight from the public Supabase endpoints with the publishable key.
// Runs in the Vercel edge runtime and in node (the preview script), so no `@/` aliases and no browser client.
import { HARDWARE_BY_ID, MODEL_BY_ID, QUANT_BY_ID, RUNTIME_BY_ID } from '../mocks/catalog.js'
import type { HardwareItem } from '../lib/api/types.js'

export type OgEnv = { supabaseUrl: string; supabaseKey: string }

/** Reads the same variables the site is deployed with; null when they are missing. */
export function ogEnv(): OgEnv | null {
  const env = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env ?? {}
  const supabaseUrl = (env.VITE_SUPABASE_URL ?? env.SUPABASE_URL)?.trim()
  const supabaseKey = (env.VITE_SUPABASE_PUBLISHABLE_KEY ?? env.SUPABASE_PUBLISHABLE_KEY ?? env.SUPABASE_ANON_KEY)?.trim()
  return supabaseUrl && supabaseKey ? { supabaseUrl: supabaseUrl.replace(/\/$/, ''), supabaseKey } : null
}

export type Owner = { handle: string; initials: string; avatarUrl?: string }

export type ResultCardData = {
  id: string
  decodeTps: number
  model: string
  quant: string
  runtime: string
  runtimeVersion: string
  /** "1× Intel Arc Pro B70" for a part, or the rig name for a whole-rig result. */
  hardware: string
  /** The rig a part sits in; empty for whole-rig results. */
  inRig?: string
  verified: boolean
  rank?: { position: number; size: number; kind: 'rigs' | 'components' }
  owner: Owner
  runDate: string
  updatedAt: string
}

export type RigCardData = {
  id: string
  name: string
  os: string
  parts: { quantity: number; name: string; detail?: string }[]
  best?: { tps: number; model: string; quant: string; runtime: string }
  resultsCount: number
  owner: Owner
  photoUrl?: string
  updatedAt: string
}

type ResultRow = {
  id: number | string
  submitter_id: string
  model_id: string
  quant_id: string
  runtime_id: string
  runtime_version: string
  rig_id: number | string
  component_id: string | null
  component_quantity: number | null
  decode_tps: number | string
  run_date: string
  verification_status: 'self_reported' | 'community_verified'
  hidden: boolean
  updated_at: string
}
type BoardRow = Pick<ResultRow, 'id' | 'rig_id' | 'component_id' | 'component_quantity' | 'decode_tps' | 'run_date'>
type RigRow = { id: number | string; owner_id: string; name: string; os: string; photo_url: string | null; updated_at: string }
type ComponentRow = { hardware_id: string; quantity: number }
type ProfileRow = { id: string; handle: string; name: string | null; avatar_url: string }

const validId = (id: string) => /^\d{1,18}$/.test(id)

async function rest<T>(env: OgEnv, path: string): Promise<T> {
  const response = await fetch(`${env.supabaseUrl}/rest/v1/${path}`, {
    headers: { apikey: env.supabaseKey, authorization: `Bearer ${env.supabaseKey}`, accept: 'application/json' },
  })
  if (!response.ok) throw new Error(`Supabase returned ${response.status} for ${path.split('?')[0]}`)
  return (await response.json()) as T
}

const first = <T,>(rows: T[]): T | undefined => rows[0]

function owner(profile: ProfileRow | undefined): Owner {
  const handle = profile?.handle ?? 'someone'
  const source = profile?.name?.trim() || handle
  const words = source.split(/\s+/).filter(Boolean)
  const initials = (words.length > 1 ? words[0][0] + words[words.length - 1][0] : source.slice(0, 2)).toUpperCase()
  return { handle, initials, avatarUrl: profile?.avatar_url || undefined }
}

/** "Intel Arc Pro B70": the vendor in front unless the name already carries it. */
export function hardwareName(hardware: HardwareItem | undefined, id: string): string {
  if (!hardware) return id
  return hardware.vendor && hardware.vendor !== 'Generic' && !hardware.name.startsWith(hardware.vendor) ? `${hardware.vendor} ${hardware.name}` : hardware.name
}

// Mirrors the site's board ordering: the best entry per rig-or-part, higher decode first, earlier run date on ties.
const unitKey = (row: BoardRow) => (row.component_id ? `${row.component_id}x${row.component_quantity ?? 1}` : `rig:${row.rig_id}`)

function boardOrder(rows: BoardRow[]): BoardRow[] {
  const best = new Map<string, BoardRow>()
  for (const row of rows) {
    const key = unitKey(row)
    const current = best.get(key)
    const tps = Number(row.decode_tps)
    if (!current || tps > Number(current.decode_tps) || (tps === Number(current.decode_tps) && row.run_date < current.run_date)) best.set(key, row)
  }
  return [...best.values()].sort((a, b) => Number(b.decode_tps) - Number(a.decode_tps) || a.run_date.localeCompare(b.run_date))
}

export async function loadResultCard(id: string, env: OgEnv): Promise<ResultCardData | null> {
  if (!validId(id)) return null
  const row = first(await rest<ResultRow[]>(env, `results?id=eq.${id}&select=id,submitter_id,model_id,quant_id,runtime_id,runtime_version,rig_id,component_id,component_quantity,decode_tps,run_date,verification_status,hidden,updated_at`))
  if (!row || row.hidden) return null
  const kind = row.component_id ? 'components' : 'rigs'
  const [rig, profile, board] = await Promise.all([
    rest<RigRow[]>(env, `rigs?id=eq.${row.rig_id}&select=id,owner_id,name,os,photo_url,updated_at`).then(first),
    rest<ProfileRow[]>(env, `profiles?id=eq.${encodeURIComponent(row.submitter_id)}&select=id,handle,name,avatar_url`).then(first),
    rest<BoardRow[]>(
      env,
      `results?model_id=eq.${encodeURIComponent(row.model_id)}&quant_id=eq.${encodeURIComponent(row.quant_id)}&hidden=is.false&component_id=${kind === 'components' ? 'not.is.null' : 'is.null'}&select=id,rig_id,component_id,component_quantity,decode_tps,run_date`,
    ),
  ])
  const ordered = boardOrder(board)
  const position = ordered.findIndex((candidate) => unitKey(candidate) === unitKey(row))
  const component = row.component_id ? HARDWARE_BY_ID[row.component_id] : undefined
  const quantity = row.component_quantity ?? 1
  return {
    id: String(row.id),
    decodeTps: Number(row.decode_tps),
    model: MODEL_BY_ID[row.model_id]?.name ?? row.model_id,
    quant: QUANT_BY_ID[row.quant_id]?.label ?? row.quant_id,
    runtime: RUNTIME_BY_ID[row.runtime_id]?.name ?? row.runtime_id,
    runtimeVersion: row.runtime_version,
    hardware: row.component_id ? `${quantity}× ${hardwareName(component, row.component_id)}` : rig?.name ?? 'a rig',
    inRig: row.component_id ? rig?.name : undefined,
    verified: row.verification_status === 'community_verified',
    rank: position >= 0 ? { position: position + 1, size: ordered.length, kind } : undefined,
    owner: owner(profile),
    runDate: row.run_date,
    updatedAt: row.updated_at,
  }
}

/** Up to three rows for the card: the CPU, then GPUs, then memory, then anything else. */
export function cardParts(components: ComponentRow[]): RigCardData['parts'] {
  const order = ['cpu', 'gpu', 'ram', 'igpu', 'npu']
  const sorted = [...components].sort((a, b) => {
    const rank = (c: ComponentRow) => {
      const index = order.indexOf(HARDWARE_BY_ID[c.hardware_id]?.type ?? '')
      return index < 0 ? order.length : index
    }
    return rank(a) - rank(b)
  })
  return sorted.slice(0, 3).map((c) => {
    const hardware = HARDWARE_BY_ID[c.hardware_id]
    const specs = hardware?.specs ?? {}
    // Memory names already carry their capacity ("DDR5-6000 32 GB"); GPU names do not, so VRAM is the one detail shown.
    const detail = hardware?.type === 'gpu' && specs.vramGb ? `${specs.vramGb} GB` : undefined
    return { quantity: c.quantity, name: hardwareName(hardware, c.hardware_id), detail }
  })
}

export async function loadRigCard(id: string, env: OgEnv): Promise<RigCardData | null> {
  if (!validId(id)) return null
  const rig = first(await rest<RigRow[]>(env, `rigs?id=eq.${id}&select=id,owner_id,name,os,photo_url,updated_at`))
  if (!rig) return null
  const [components, profile, results] = await Promise.all([
    rest<ComponentRow[]>(env, `rig_components?rig_id=eq.${id}&select=hardware_id,quantity`),
    rest<ProfileRow[]>(env, `profiles?id=eq.${encodeURIComponent(rig.owner_id)}&select=id,handle,name,avatar_url`).then(first),
    rest<Pick<ResultRow, 'model_id' | 'quant_id' | 'runtime_id' | 'decode_tps'>[]>(env, `results?rig_id=eq.${id}&hidden=is.false&select=model_id,quant_id,runtime_id,decode_tps`),
  ])
  const bestRow = results.reduce<(typeof results)[number] | undefined>((best, row) => (!best || Number(row.decode_tps) > Number(best.decode_tps) ? row : best), undefined)
  return {
    id: String(rig.id),
    name: rig.name,
    os: rig.os,
    parts: cardParts(components),
    best: bestRow
      ? {
          tps: Number(bestRow.decode_tps),
          model: MODEL_BY_ID[bestRow.model_id]?.name ?? bestRow.model_id,
          quant: QUANT_BY_ID[bestRow.quant_id]?.label ?? bestRow.quant_id,
          runtime: RUNTIME_BY_ID[bestRow.runtime_id]?.name ?? bestRow.runtime_id,
        }
      : undefined,
    resultsCount: results.length,
    owner: owner(profile),
    photoUrl: rig.photo_url || undefined,
    updatedAt: rig.updated_at,
  }
}

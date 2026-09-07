import { REVISION_MAX, RUNTIME_FLAGS_MAX, type Result, type ResultInput } from '@/lib/api/types'
import { REPO } from '@/lib/brand'
import { HARDWARE_BY_ID, MODEL_BY_ID, QUANT_BY_ID, RUNTIME_BY_ID } from '@/catalog'

// Submitting by pull request. A contributor adds `results/<handle>/<name>.json` to the site's repo and opens a PR;
// the repo's check validates the file with `parseResultFile` (the same code, run by frontend/scripts/validate-results.mjs)
// and comments with a link to /submit?pr=N. The submit form reads the PR through GitHub's public API, fills itself
// in, and uses the PR as the evidence link. Nothing here writes to GitHub: the browser only reads public data.

export const RESULTS_DIR = 'results'
const API = 'https://api.github.com'

/** A result as committed to the repo. Mirrors ResultInput with catalog ids, plus the rig by id or name. */
export type ResultFile = {
  /** The number at the end of the rig's URL on the site, or the rig's exact name. */
  rig: string
  /** Hardware id of the one part the run used. Leave out for a whole-rig result. */
  component?: string
  componentQuantity?: number
  model: string
  quant: string
  runtime: string
  runtimeVersion: string
  /** Flags and settings that change the number, as you would type them: "-fa 1, SYCL backend". */
  runtimeFlags?: string
  /** The build this ran on: the number at the end of its URL on the site, or its exact name. Omit for stock. */
  build?: string
  /** Builds only: the exact revision behind the number — a commit, a tag, or a build id. */
  revision?: string
  decodeTps: number
  promptTps?: number
  ttftMs?: number
  contextLength?: number
  batchSize?: number
  /** YYYY-MM-DD */
  runDate: string
  notes?: string
  /** The result's URL on the site once it has been submitted, so the archive entry and the live entry point at each other. */
  result?: string
}

export type PrRef = { number: number; url: string }
export const prUrl = (number: number) => `https://github.com/${REPO}/pull/${number}`

/** Accepts a PR number, "#12", or a PR URL on the site's repo. */
export function parsePrRef(input: string): PrRef | null {
  const text = input.trim()
  const bare = text.match(/^#?(\d+)$/)
  if (bare) return { number: Number(bare[1]), url: prUrl(Number(bare[1])) }
  try {
    const url = new URL(text)
    const match = url.pathname.match(/^\/([^/]+\/[^/]+)\/pull\/(\d+)/)
    if ((url.hostname === 'github.com' || url.hostname === 'www.github.com') && match && match[1].toLowerCase() === REPO.toLowerCase())
      return { number: Number(match[2]), url: prUrl(Number(match[2])) }
  } catch {
    /* not a URL */
  }
  return null
}

const DATE = /^\d{4}-\d{2}-\d{2}$/

/**
 * Reads a result file leniently: every field that can be used is kept, every problem is named, so a file with one
 * bad id still prefills the rest of the form. The CI check treats any problem as a failure.
 */
export function parseResultFile(raw: unknown): { file: Partial<ResultFile>; problems: string[] } {
  const problems: string[] = []
  const file: Partial<ResultFile> = {}
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return { file, problems: ['The file must be a JSON object.'] }
  const data = raw as Record<string, unknown>
  const str = (key: keyof ResultFile, required = false) => {
    const value = data[key]
    if (typeof value === 'string' && value.trim()) return value.trim()
    if (value != null && value !== '') problems.push(`"${key}" must be text.`)
    else if (required) problems.push(`"${key}" is missing.`)
    return undefined
  }
  const num = (key: keyof ResultFile, required = false, integer = false) => {
    const value = data[key]
    if (value == null || value === '') {
      if (required) problems.push(`"${key}" is missing.`)
      return undefined
    }
    if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0 || (integer && !Number.isInteger(value))) {
      problems.push(`"${key}" must be a ${integer ? 'whole ' : ''}number above zero.`)
      return undefined
    }
    return value
  }

  file.rig = str('rig', true)
  file.component = str('component')
  if (file.component && !HARDWARE_BY_ID[file.component]) problems.push(`"component" ${file.component} is not a hardware id in the catalog.`)
  file.componentQuantity = num('componentQuantity', false, true)
  if (file.componentQuantity && !file.component) problems.push('"componentQuantity" needs a "component".')
  file.model = str('model', true)
  const model = file.model ? MODEL_BY_ID[file.model] : undefined
  if (file.model && !model) problems.push(`"model" ${file.model} is not a model id in the catalog.`)
  file.quant = str('quant', true)
  if (file.quant && !QUANT_BY_ID[file.quant]) problems.push(`"quant" ${file.quant} is not a quant id in the catalog.`)
  else if (file.quant && model && !model.quants.includes(file.quant)) problems.push(`${model.name} has no ${QUANT_BY_ID[file.quant].label} board.`)
  file.runtime = str('runtime', true)
  if (file.runtime && !RUNTIME_BY_ID[file.runtime]) problems.push(`"runtime" ${file.runtime} is not a runtime id in the catalog.`)
  file.runtimeVersion = str('runtimeVersion', true)
  file.runtimeFlags = str('runtimeFlags')
  if (file.runtimeFlags && file.runtimeFlags.length > RUNTIME_FLAGS_MAX) problems.push(`"runtimeFlags" must be ${RUNTIME_FLAGS_MAX} characters or fewer.`)
  file.build = str('build')
  file.revision = str('revision')
  if (file.revision && file.revision.length > REVISION_MAX) problems.push(`"revision" must be ${REVISION_MAX} characters or fewer.`)
  // The build is resolved against the site when the form loads, so the file only has to be shaped right here.
  if (file.revision && !file.build) problems.push('"revision" needs a "build"; a stock run has no revision.')
  file.decodeTps = num('decodeTps', true)
  file.promptTps = num('promptTps')
  file.ttftMs = num('ttftMs')
  file.contextLength = num('contextLength', false, true)
  file.batchSize = num('batchSize', false, true)
  file.runDate = str('runDate', true)
  if (file.runDate && !DATE.test(file.runDate)) {
    problems.push('"runDate" must be YYYY-MM-DD.')
    file.runDate = undefined
  }
  file.notes = str('notes')
  file.result = str('result')
  return { file, problems }
}

export type PrResultFile = { path: string; file: Partial<ResultFile>; problems: string[] }
export type PrResults = {
  pr: { number: number; url: string; title: string; author: string; state: 'open' | 'closed'; merged: boolean }
  files: PrResultFile[]
}

export class PrError extends Error {}

async function github<T>(path: string, accept = 'application/vnd.github+json'): Promise<T> {
  const response = await fetch(`${API}${path}`, { headers: { Accept: accept, 'X-GitHub-Api-Version': '2022-11-28' } })
  if (response.status === 404) throw new PrError(`No such pull request on ${REPO}. The repo has to be public and the number right.`)
  if (response.status === 403 || response.status === 429) {
    if (response.headers.get('x-ratelimit-remaining') === '0') throw new PrError("GitHub's API limit for your network is used up. Try again in a few minutes.")
    throw new PrError('GitHub refused the request.')
  }
  if (!response.ok) throw new PrError(`GitHub answered ${response.status}.`)
  return (accept.includes('raw') ? response.text() : response.json()) as Promise<T>
}

type PrPayload = { number: number; html_url: string; title: string; state: 'open' | 'closed'; merged: boolean; user: { login: string } }
type PrFilePayload = { filename: string; status: string; contents_url: string }

/** The result files a pull request adds or changes, read through GitHub's public API. */
export async function fetchPrResults(ref: PrRef): Promise<PrResults> {
  const [pr, changed] = await Promise.all([
    github<PrPayload>(`/repos/${REPO}/pulls/${ref.number}`),
    github<PrFilePayload[]>(`/repos/${REPO}/pulls/${ref.number}/files?per_page=100`),
  ])
  const candidates = changed.filter((f) => f.status !== 'removed' && /^results\/[^/]+\/[^/]+\.json$/.test(f.filename))
  if (!candidates.length) throw new PrError(`That pull request adds no result file. Files live at ${RESULTS_DIR}/<your-handle>/<name>.json.`)
  const files = await Promise.all(
    candidates.map(async (f): Promise<PrResultFile> => {
      // contents_url carries the head commit's ref, so files on a fork's branch resolve too.
      const text = await github<string>(f.contents_url.replace(API, ''), 'application/vnd.github.raw+json')
      try {
        return { path: f.filename, ...parseResultFile(JSON.parse(text)) }
      } catch (error) {
        return { path: f.filename, file: {}, problems: [`Not valid JSON: ${error instanceof Error ? error.message : String(error)}`] }
      }
    }),
  )
  return { pr: { number: pr.number, url: pr.html_url, title: pr.title, author: pr.user.login, state: pr.state, merged: pr.merged }, files }
}

/** The file for a submitted (or about-to-be-submitted) result, in the order people read it. */
export function resultFileFor(r: Result | ResultInput, resultUrl?: string): ResultFile {
  const rig = 'rig' in r && r.rig ? r.rig.id : r.rigId
  return {
    rig,
    ...(r.componentId ? { component: r.componentId, componentQuantity: r.componentQuantity ?? 1 } : {}),
    model: r.modelId,
    quant: r.quant,
    runtime: r.runtimeId,
    runtimeVersion: r.runtimeVersion,
    ...(r.runtimeFlags ? { runtimeFlags: r.runtimeFlags } : {}),
    ...(r.customRuntimeId ? { build: r.customRuntimeId } : {}),
    ...(r.revision ? { revision: r.revision } : {}),
    decodeTps: r.decodeTps,
    ...(r.promptTps != null ? { promptTps: r.promptTps } : {}),
    ...(r.ttftMs != null ? { ttftMs: r.ttftMs } : {}),
    ...(r.contextLength != null ? { contextLength: r.contextLength } : {}),
    ...(r.batchSize != null ? { batchSize: r.batchSize } : {}),
    runDate: r.runDate.slice(0, 10),
    ...(r.notes ? { notes: r.notes } : {}),
    ...(resultUrl ? { result: resultUrl } : {}),
  }
}

/**
 * GitHub's new-file page with the path and contents filled in. Someone without push access is offered a fork and a
 * pull request from there, which is the whole point.
 */
export function newResultFileUrl(handle: string, file: ResultFile): string {
  const name = `${file.runDate}-${file.model}-${file.quant}-${file.runtime}`.replace(/[^a-z0-9-]+/gi, '-').toLowerCase()
  const params = new URLSearchParams({ filename: `${RESULTS_DIR}/${handle}/${name}.json`, value: `${JSON.stringify(file, null, 2)}\n` })
  return `https://github.com/${REPO}/new/main?${params}`
}

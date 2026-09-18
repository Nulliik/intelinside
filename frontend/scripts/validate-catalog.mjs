// Checks the catalog in src/catalog/index.ts: ids unique and well formed, cross-references resolved, required
// fields present, and every part's placeholder drawing laid out without a clash. Runs on every pull request that
// touches the catalog, so a contributor sees the problem on their own PR instead of in review.
//   node frontend/scripts/validate-catalog.mjs [--report <markdown-file>]
import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'

const args = process.argv.slice(2)
const report = args.indexOf('--report') >= 0 ? args[args.indexOf('--report') + 1] : undefined

const ID = /^[a-z0-9]+(-[a-z0-9]+)*$/
// GGUF names its quantizations Q4_K_M and friends, so quant ids keep the underscores.
const QUANT_ID = /^[a-z0-9]+([-_][a-z0-9]+)*$/
const DATE = /^\d{4}-\d{2}-\d{2}$/
const HARDWARE_TYPES = ['cpu', 'gpu', 'igpu', 'npu', 'ram']
const problems = []
const fail = (message) => problems.push(message)

/** Every entry needs a unique, kebab-case id. */
function checkIds(label, items, pattern = ID) {
  const seen = new Map()
  for (const [index, item] of items.entries()) {
    const where = `${label}[${index}]`
    if (typeof item.id !== 'string' || !item.id) {
      fail(`${where} has no id.`)
      continue
    }
    if (!pattern.test(item.id)) fail(`${label} id "${item.id}" must be lowercase letters, digits, and single ${pattern === QUANT_ID ? 'hyphens or underscores' : 'hyphens'}.`)
    if (seen.has(item.id)) fail(`${label} id "${item.id}" is used twice (entries ${seen.get(item.id)} and ${index}).`)
    else seen.set(item.id, index)
  }
}

const server = await createServer({
  root: fileURLToPath(new URL('..', import.meta.url)),
  server: { middlewareMode: true },
  appType: 'custom',
  logLevel: 'error',
})
try {
  const { HARDWARE, MODELS, QUANTS, RUNTIMES } = await server.ssrLoadModule('/src/catalog/index.ts')
  const { checkHardware } = await server.ssrLoadModule('/src/lib/schematic.ts')

  checkIds('hardware', HARDWARE)
  checkIds('model', MODELS)
  checkIds('quant', QUANTS, QUANT_ID)
  checkIds('runtime', RUNTIMES)

  const hardwareById = new Map(HARDWARE.map((h) => [h.id, h]))
  const quantIds = new Set(QUANTS.map((q) => q.id))

  for (const h of HARDWARE) {
    const where = `hardware "${h.id}"`
    if (!HARDWARE_TYPES.includes(h.type)) fail(`${where} has type "${h.type}"; use one of ${HARDWARE_TYPES.join(', ')}.`)
    if (!h.vendor) fail(`${where} has no vendor.`)
    if (!h.name) fail(`${where} has no name.`)
    if (!h.specs || typeof h.specs !== 'object' || !Object.keys(h.specs).length) fail(`${where} has no specs.`)
    if (h.releaseDate && !DATE.test(h.releaseDate)) fail(`${where} has releaseDate "${h.releaseDate}"; use YYYY-MM-DD.`)
    if (h.source !== 'seeded' && h.source !== 'community') fail(`${where} has source "${h.source}"; use "seeded" or "community".`)
    for (const id of h.integrated ?? []) {
      const part = hardwareById.get(id)
      if (!part) fail(`${where} lists integrated part "${id}", which is not in the catalog.`)
      else if (part.type !== 'igpu' && part.type !== 'npu') fail(`${where} lists integrated part "${id}", which is a ${part.type}; only an igpu or npu sits on a package.`)
    }
    if (h.integrated?.length && h.type !== 'cpu') fail(`${where} is a ${h.type} but lists integrated parts; only a CPU carries them.`)
  }

  // The parts schematic that stands in for a rig photo is drawn from these specs. It fits the printed model number
  // before it places anything else and reports what it could not fit, so nobody has to eyeball a new part.
  for (const clash of checkHardware(HARDWARE)) fail(`The placeholder drawing for ${clash}.`)

  for (const m of MODELS) {
    const where = `model "${m.id}"`
    if (!m.name) fail(`${where} has no name.`)
    if (!m.family) fail(`${where} has no family.`)
    if (!m.brand) fail(`${where} has no brand, the family at the logo level the Models page groups by.`)
    if (!m.params) fail(`${where} has no params.`)
    if (m.architecture !== 'dense' && m.architecture !== 'moe') fail(`${where} has architecture "${m.architecture}"; use "dense" or "moe".`)
    if (m.architecture === 'moe' && !m.activeParams) fail(`${where} is a mixture of experts, so it needs activeParams.`)
    if (!m.sourceUrl) fail(`${where} has no sourceUrl. Link the model card.`)
    if (!m.quants?.length) fail(`${where} lists no quants, so it would have no board.`)
    for (const q of m.quants ?? []) if (!quantIds.has(q)) fail(`${where} lists quant "${q}", which is not in the catalog.`)
  }

  for (const q of QUANTS) {
    const where = `quant "${q.id}"`
    if (!q.label) fail(`${where} has no label.`)
    if (!Number.isInteger(q.bits) || q.bits <= 0) fail(`${where} needs bits as a whole number above zero.`)
    if (!q.format) fail(`${where} has no format, the one-line explanation shown in tooltips.`)
  }

  for (const r of RUNTIMES) {
    const where = `runtime "${r.id}"`
    if (!r.name) fail(`${where} has no name.`)
    if (!r.repoUrl) fail(`${where} has no repoUrl. Every runtime badge links to its repo.`)
    if (!/^#[0-9a-f]{6}$/i.test(r.color ?? '')) fail(`${where} needs color as a six-digit hex value like #6ab8e4.`)
  }

  const counts = `${HARDWARE.length} hardware, ${MODELS.length} models, ${QUANTS.length} quants, ${RUNTIMES.length} runtimes`
  const lines = problems.length
    ? [`❌ The catalog has ${problems.length} problem${problems.length === 1 ? '' : 's'}.`, ...problems.map((p) => `- ${p}`)]
    : [`✅ The catalog validates: ${counts}.`]
  console.log(lines.join('\n'))
  if (report) writeFileSync(report, `${lines.join('\n')}\n`)
  process.exitCode = problems.length ? 1 : 0
} finally {
  await server.close()
}

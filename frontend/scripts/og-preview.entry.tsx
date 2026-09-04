// Renders the card layouts with sample data to PNGs, so they can be checked without a deploy. Bundled and run by
// scripts/og-preview.mjs (`npm run og:preview [outDir]`). Sample values mirror the design canvas.
import fs from 'node:fs'
import path from 'node:path'
import satori from 'satori'
import { Resvg } from '@resvg/resvg-js'
import { loadCardAssets, loadFonts, type AssetSource } from '../src/og/assets'
import { ResultCardImage, RigCardImage } from '../src/og/cards'
import type { ResultCardData, RigCardData } from '../src/og/data'

const root = path.resolve(process.cwd())
const outDir = path.resolve(process.argv[2] ?? '.og-preview')
fs.mkdirSync(outDir, { recursive: true })

const disk: AssetSource = {
  binary: async (file) => {
    const bytes = fs.readFileSync(path.join(root, 'public', 'og', file))
    return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength)
  },
  text: async (file) => fs.readFileSync(path.join(root, 'public', 'og', file), 'utf8'),
}

const owner = { handle: 'tatef', initials: 'TB' }

const result: ResultCardData = {
  id: '1042',
  decodeTps: 84.6,
  model: 'Qwen3-8B',
  quant: 'INT4',
  runtime: 'Cascadia',
  runtimeVersion: '0.9.2',
  hardware: '1× Intel Arc Pro B70',
  inRig: 'Quad B70 workstation',
  verified: true,
  rank: { position: 3, size: 41, kind: 'components' },
  owner,
  runDate: '2026-09-02',
  updatedAt: '2026-09-02T18:00:00Z',
}

const rig: RigCardData = {
  id: '12',
  name: 'Quad B70 workstation',
  os: 'Ubuntu 24.04',
  parts: [
    { quantity: 1, name: 'Intel Core Ultra 9 285K' },
    { quantity: 4, name: 'Intel Arc Pro B70', detail: '32 GB' },
    { quantity: 4, name: 'DDR5-6000 32 GB' },
  ],
  best: { tps: 84.6, model: 'Qwen3-8B', quant: 'INT4', runtime: 'Cascadia' },
  resultsCount: 12,
  owner,
  updatedAt: '2026-09-02T18:00:00Z',
}

/** A stand-in photo: a dark panel rendered to PNG, since real uploads are JPEG or PNG. */
function samplePhoto(): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="960" height="680"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2a2a33"/><stop offset="1" stop-color="#121216"/></linearGradient></defs><rect width="960" height="680" fill="url(#g)"/><rect x="120" y="200" width="720" height="280" rx="24" fill="#1c1c22" stroke="#3a3a44" stroke-width="3"/><rect x="120" y="200" width="720" height="14" rx="7" fill="#5438ff"/><circle cx="330" cy="340" r="104" fill="#121215" stroke="#3a3a44" stroke-width="3"/><circle cx="630" cy="340" r="104" fill="#121215" stroke="#3a3a44" stroke-width="3"/></svg>`
  const png = new Resvg(svg).render().asPng()
  return `data:image/png;base64,${Buffer.from(png).toString('base64')}`
}

async function write(name: string, element: Parameters<typeof satori>[0], fonts: Awaited<ReturnType<typeof loadFonts>>) {
  const svg = await satori(element, { width: 1200, height: 630, fonts })
  const png = new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } }).render().asPng()
  const file = path.join(outDir, `${name}.png`)
  fs.writeFileSync(file, png)
  console.log(`wrote ${path.relative(root, file)}`)
}

const fonts = await loadFonts(disk)
const resultAssets = await loadCardAssets(disk, 'dots-result.svg')
const rigAssets = await loadCardAssets(disk, 'dots-side.svg')

await write('result', <ResultCardImage data={result} assets={resultAssets} />, fonts)
await write('rig', <RigCardImage data={rig} assets={{ ...rigAssets, photo: samplePhoto() }} />, fonts)
await write('rig-no-photo', <RigCardImage data={rig} assets={rigAssets} />, fonts)
await write(
  'result-long',
  <ResultCardImage data={{ ...result, model: 'Llama 3.1 8B Instruct', quant: 'Q4_K_M', runtime: 'OpenVINO GenAI', runtimeVersion: '2026.1.0', hardware: 'NUC charlie', inRig: undefined, verified: false, rank: { position: 17, size: 41, kind: 'rigs' } }} assets={resultAssets} />,
  fonts,
)
await write('rig-long', <RigCardImage data={{ ...rig, name: 'The absurdly long name of a workstation that never ends', best: undefined, resultsCount: 0 }} assets={rigAssets} />, fonts)

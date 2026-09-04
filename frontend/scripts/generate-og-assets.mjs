// Builds the static pieces the OG card renderer composites text over. Run with `npm run og:assets`.
//
// - public/og/dots-result.svg, dots-side.svg: the dot matrix from assets/og/template.svg with the dots inside a
//   per-layout exclusion zone dropped and the ones within `feather` px faded in, so text never collides with pixels.
//   Each dot is grey or lavender, chosen by a seeded random draw so the mix is fixed and matches the Figma frames.
// - public/og/mark.svg: the logo mark lifted out of the template; the wordmark is set as text by the renderer so
//   the domain can change without redrawing it.
// - public/og/runtimes/*.svg: the runtime logos from public/logos/runtimes, so the card can inline them.
// - public/og/fonts/*.woff: static Red Hat faces from the fontsource packages. Satori needs static weights; the
//   variable fonts the site uses would render every weight as regular.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const out = path.join(root, 'public', 'og')
fs.mkdirSync(path.join(out, 'fonts'), { recursive: true })
fs.mkdirSync(path.join(out, 'runtimes'), { recursive: true })

const template = fs.readFileSync(path.join(root, 'assets', 'og', 'template.svg'), 'utf8')

function dots(svg) {
  const re = /<path d="M([\d.]+) ([\d.]+)H([\d.]+)V([\d.]+)H[\d.]+V[\d.]+Z" fill="#7F9392"\/>/g
  const list = []
  let m
  while ((m = re.exec(svg))) {
    const x1 = +m[1], y1 = +m[2], x2 = +m[3], y2 = +m[4]
    list.push({ x: Math.min(x1, x2), y: Math.min(y1, y2) })
  }
  // Row-major, so the seeded colour sequence below is the one the Figma frames were built with.
  return list.sort((a, b) => Math.round(a.y) - Math.round(b.y) || a.x - b.x)
}

/** mulberry32: a tiny seeded generator, so the grey/lavender mix is the same on every build. */
function rng(seed) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const GREY = '#7F9392'
const LAVENDER = '#9C8BFF'
const LAVENDER_SHARE = 0.4

function background(list, zones, feather, seed) {
  const random = rng(seed)
  const parts = []
  for (const d of list) {
    const cx = d.x + 3, cy = d.y + 3
    let opacity = 1
    for (const [x1, y1, x2, y2] of zones) {
      const dx = Math.max(x1 - cx, 0, cx - x2)
      const dy = Math.max(y1 - cy, 0, cy - y2)
      const dist = Math.hypot(dx, dy)
      opacity = Math.min(opacity, dist >= feather ? 1 : dist / feather)
    }
    if (opacity < 0.15) continue
    const tone = random() < 1 - LAVENDER_SHARE ? 'g' : 'p'
    parts.push(`<use href="#${tone}" x="${d.x.toFixed(1)}" y="${d.y.toFixed(1)}"${opacity < 0.995 ? ` opacity="${opacity.toFixed(2)}"` : ''}/>`)
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630"><rect width="1200" height="630" fill="#0A0A0A"/><defs><rect id="g" width="6" height="6" fill="${GREY}"/><rect id="p" width="6" height="6" fill="${LAVENDER}"/></defs><g>${parts.join('')}</g></svg>`
}

const matrix = dots(template)
const layouts = {
  // result card: figure, model line, hardware line, and badges sit in x < 780, y 150–520
  'dots-result.svg': { zones: [[0, 150, 780, 520]], feather: 56, seed: 41 },
  // rig card: parts list and best line stay left of x 660; the photo panel covers the matrix on the right
  'dots-side.svg': { zones: [[0, 150, 660, 540]], feather: 56, seed: 7 },
}
for (const [name, layout] of Object.entries(layouts)) {
  fs.writeFileSync(path.join(out, name), background(matrix, layout.zones, layout.feather, layout.seed))
  console.log(`wrote public/og/${name}`)
}

// The mark: the white squares and bars plus the purple frame, without the wordmark path, which starts at x=165.
const mark = template
  .split('\n')
  .filter((line) => (line.includes('fill="white"') || line.includes('fill="#795CFF"')) && !line.includes('width="1200"') && !line.includes('width="1452.5"') && !line.includes('M165.172'))
  .join('\n')
fs.writeFileSync(path.join(out, 'mark.svg'), `<svg xmlns="http://www.w3.org/2000/svg" width="71" height="60" viewBox="77 70 71 60">\n${mark}\n</svg>`)
console.log('wrote public/og/mark.svg')

for (const file of fs.readdirSync(path.join(root, 'public', 'logos', 'runtimes')).filter((f) => f.endsWith('.svg'))) {
  fs.copyFileSync(path.join(root, 'public', 'logos', 'runtimes', file), path.join(out, 'runtimes', file))
  console.log(`copied public/og/runtimes/${file}`)
}

const fonts = [
  ['red-hat-display', 600],
  ['red-hat-display', 700],
  ['red-hat-text', 400],
  ['red-hat-text', 500],
  ['red-hat-mono', 500],
  ['red-hat-mono', 600],
]
for (const [family, weight] of fonts) {
  const file = `${family}-latin-${weight}-normal.woff`
  fs.copyFileSync(path.join(root, 'node_modules', '@fontsource', family, 'files', file), path.join(out, 'fonts', file))
  console.log(`copied public/og/fonts/${file}`)
}

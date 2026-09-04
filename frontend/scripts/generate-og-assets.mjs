// Builds the static pieces the OG card renderer composites text over. Run with `npm run og:assets`.
//
// - public/og/dots-result.svg, dots-side.svg: the dot matrix from assets/og/template.svg with the dots inside a
//   per-layout exclusion zone dropped and the ones within `feather` px faded in, so text never collides with pixels.
// - public/og/lockup.svg: the lockup lifted out of the template so it can sit anywhere on a card.
// - public/og/fonts/*.woff: static Red Hat faces from the fontsource packages. Satori needs static weights; the
//   variable fonts the site uses would render every weight as regular.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const out = path.join(root, 'public', 'og')
fs.mkdirSync(path.join(out, 'fonts'), { recursive: true })

const template = fs.readFileSync(path.join(root, 'assets', 'og', 'template.svg'), 'utf8')

function dots(svg) {
  const re = /<path d="M([\d.]+) ([\d.]+)H([\d.]+)V([\d.]+)H[\d.]+V[\d.]+Z" fill="#7F9392"\/>/g
  const list = []
  let m
  while ((m = re.exec(svg))) {
    const x1 = +m[1], y1 = +m[2], x2 = +m[3], y2 = +m[4]
    list.push({ x: Math.min(x1, x2), y: Math.min(y1, y2) })
  }
  return list
}

function background(list, zones, feather) {
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
    parts.push(`<use href="#d" x="${d.x.toFixed(1)}" y="${d.y.toFixed(1)}"${opacity < 0.995 ? ` opacity="${opacity.toFixed(2)}"` : ''}/>`)
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630"><rect width="1200" height="630" fill="#0A0A0A"/><defs><rect id="d" width="6" height="6" fill="#7F9392"/></defs><g>${parts.join('')}</g></svg>`
}

const matrix = dots(template)
const layouts = {
  // result card: figure, model line, hardware line, and badges sit in x < 780, y 150–520
  'dots-result.svg': { zones: [[0, 150, 780, 520]], feather: 56 },
  // rig card: parts list and best line stay left of x 660; the photo panel covers the matrix on the right
  'dots-side.svg': { zones: [[0, 150, 660, 540]], feather: 56 },
}
for (const [name, layout] of Object.entries(layouts)) {
  fs.writeFileSync(path.join(out, name), background(matrix, layout.zones, layout.feather))
  console.log(`wrote public/og/${name}`)
}

const lockup = template
  .split('\n')
  .filter((line) => (line.includes('fill="white"') || line.includes('fill="#795CFF"')) && !line.includes('width="1200"') && !line.includes('width="1452.5"'))
  .join('\n')
fs.writeFileSync(path.join(out, 'lockup.svg'), `<svg xmlns="http://www.w3.org/2000/svg" width="340" height="60" viewBox="77 70 340 60">\n${lockup}\n</svg>`)
console.log('wrote public/og/lockup.svg')

const fonts = [
  ['red-hat-display', 600],
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

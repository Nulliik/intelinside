// The two card layouts, R1 for results and G1 for rigs, as chosen on Sep 4 and revised after Tate's review the same
// evening: the wordmark carries the domain, the runtime shows as its leaderboard badge (mark plus name), there is
// no verification pill, and the parts list's quantities are set in Red Hat Text. Written for Satori: every box with
// more than one child is a flex container, text sits alone in its element, sizes are absolute, and long names
// scale down before they wrap. Positions match the Figma frames at 1200×630.
//
// Built with createElement rather than JSX so this stays a .ts file: Vercel's function tracer resolves a `.js`
// import to a `.ts` source but not to `.tsx`, and a missing module here took the card route down in production.
import { createElement as h, type CSSProperties, type ReactElement, type ReactNode } from 'react'
import { HARDWARE_BY_ID } from '../catalog/index.js'
import { RUNTIME_MARKS } from '../components/runtimeMarks.generated.js'
import { drawRig, type Prim } from '../lib/schematic.js'
import { BRAND_NAME, SITE_DOMAIN } from '../lib/brand.js'
import { fmtDate, fmtTps } from '../lib/format.js'
import type { CardAssets } from './assets.js'
import type { Owner, ResultCardData, RigCardData } from './data.js'

const FG = '#f4f4f5'
const MUTED = '#a1a1aa'
const TEXT = 'Red Hat Text'
const DISPLAY = 'Red Hat Display'
const MONO = 'Red Hat Mono'

/** "Intelinside.ai": the brand's casing with the domain's suffix, so a card shared as a bare image still says where it is from. */
const WORDMARK = SITE_DOMAIN.includes('.') ? `${BRAND_NAME}${SITE_DOMAIN.slice(SITE_DOMAIN.indexOf('.'))}` : BRAND_NAME

// Two-letter tiles for runtimes with neither a logo file nor a generated mark; mirrors RuntimeMark in the app.
const MONOGRAM: Record<string, string> = { 'ipex-llm': 'IX' }

/** A font size that keeps `text` inside `maxWidth`, between `max` and `min`; 0.56 em per character is Red Hat's average. */
export function fitSize(text: string, maxWidth: number, max: number, min: number): number {
  const chars = Math.max(text.length, 1)
  return Math.max(min, Math.min(max, Math.floor(maxWidth / (chars * 0.56))))
}

const flex = (style: CSSProperties = {}): CSSProperties => ({ display: 'flex', ...style })

const div = (style: CSSProperties, ...children: ReactNode[]) => h('div', { style }, ...children)
const span = (style: CSSProperties, text: string) => h('span', { style }, text)

/** The lockup at the top left: the mark from the template, the wordmark as text so the domain can change. */
function lockup(assets: CardAssets): ReactElement {
  return div(
    flex({ position: 'absolute', top: 70, left: 77, height: 60, alignItems: 'flex-end' }),
    h('img', { src: assets.mark, width: 71, height: 60 }),
    span({ marginLeft: 14, fontFamily: DISPLAY, fontWeight: 700, fontSize: 49, lineHeight: '49px', paddingBottom: 1, color: FG }, WORDMARK),
  )
}

function frame(assets: CardAssets, ...children: ReactNode[]): ReactElement {
  return div(
    flex({ position: 'relative', width: 1200, height: 630, backgroundColor: '#0a0a0a', color: FG, fontFamily: TEXT, overflow: 'hidden' }),
    h('img', { src: assets.background, width: 1200, height: 630, style: { position: 'absolute', top: 0, left: 0 } }),
    lockup(assets),
    ...children,
  )
}

function avatar(owner: Owner, size: number): ReactElement {
  const style: CSSProperties = {
    width: size,
    height: size,
    borderRadius: 999,
    backgroundColor: '#18181b',
    border: '1px solid rgba(255,255,255,0.1)',
    overflow: 'hidden',
  }
  return div(flex({ ...style, alignItems: 'center', justifyContent: 'center', fontSize: size * 0.39, fontWeight: 500, color: FG }), owner.initials)
}

function ownerRow(owner: Owner, trailing: string): ReactElement {
  return div(
    flex({ position: 'absolute', left: 80, bottom: 46, alignItems: 'center', gap: 12, fontSize: 22, lineHeight: '28px', color: MUTED }),
    avatar(owner, 36),
    span({ color: FG, fontWeight: 500 }, owner.handle),
    span({}, trailing),
  )
}

function pill(color: string, border: string, ...children: ReactNode[]): ReactElement {
  return div(
    flex({ alignItems: 'center', gap: 8, height: 38, paddingLeft: 16, paddingRight: 16, borderRadius: 999, border: `1.5px solid ${border}`, color, fontSize: 20, fontWeight: 500 }),
    ...children,
  )
}

/**
 * The runtime's mark at `size` px, as the leaderboard shows it: the catalog's logo file when there is one, else the
 * generated mark, else a two-letter tile in the runtime's colour.
 */
function runtimeMark(data: ResultCardData, assets: CardAssets, size: number): ReactElement {
  if (assets.runtimeLogo) return h('img', { src: assets.runtimeLogo, width: size, height: size })
  const mark = RUNTIME_MARKS[data.runtimeId]
  if (mark) {
    return h(
      'svg',
      { viewBox: mark.viewBox, width: Math.round(size * mark.ratio), height: size },
      ...mark.paths.map((path, index) => h('path', { key: index, d: path.d, fill: path.fill === 'currentColor' ? FG : path.fill })),
    )
  }
  const letters = MONOGRAM[data.runtimeId] ?? data.runtime.slice(0, 2).toUpperCase()
  return div(
    flex({ alignItems: 'center', justifyContent: 'center', height: size, minWidth: size + 4, paddingLeft: 8, paddingRight: 8, borderRadius: Math.round(size / 4), backgroundColor: '#27272a', fontFamily: DISPLAY, fontWeight: 600, fontSize: Math.round(size * 0.55), lineHeight: `${size}px`, color: data.runtimeColor ?? MUTED }),
    letters,
  )
}

/** The text column: the dots start at x=780 with a feather, so nothing on the left may run past 700px from the margin. */
const COLUMN = 700
/** A wrapped build string fills its lines, so it stops short of the column to stay clear of the feathered dots. */
const VERSION_COLUMN = 660

/** Roughly how wide `text` renders at `size`: 0.56 em per character for Red Hat Text and Display, 0.6 for the mono. */
const textWidth = (text: string, size: number, mono = false) => text.length * (mono ? 0.6 : 0.56) * size

export function ResultCardImage({ data, assets }: { data: ResultCardData; assets: CardAssets }): ReactElement {
  // The mark takes about the width of two characters, so it counts for two when the line is sized to fit.
  const headline = `${data.model} ${data.quant} on ${data.runtime}  `
  const modelSize = fitSize(headline, COLUMN, 38, 26)
  const lineHeight = Math.round(modelSize * 1.2)
  const versionSize = Math.round(modelSize * 0.68)
  // A short version rides on the model line, as the Figma frame has it. A long build string — a dev version with a
  // hash and a kernels suffix — drops to its own line under it, wraps inside the column, and is cut at two lines,
  // so it never reaches the dots. The column tightens its rhythm to make room for the extra line.
  const versionInline = textWidth(headline, modelSize) + 10 + textWidth(data.runtimeVersion, versionSize, true) <= COLUMN
  const compact = !versionInline
  const hardwareLine = `${data.hardware}${data.inRig ? ` in ${data.inRig}` : ''}`
  const hardwareSize = fitSize(hardwareLine, COLUMN, 26, 18)
  const version = span({ fontFamily: MONO, fontWeight: 500, fontSize: versionSize, lineHeight: `${Math.round(versionSize * 1.3)}px`, color: MUTED, paddingBottom: 2 }, data.runtimeVersion)
  return frame(
    assets,
    div(
      flex({ position: 'absolute', left: 80, top: compact ? 168 : 176, width: COLUMN, flexDirection: 'column', alignItems: 'flex-start' }),
      div(
        flex({ alignItems: 'flex-end', gap: 20 }),
        span({ fontFamily: MONO, fontSize: 150, lineHeight: compact ? '142px' : '150px', fontWeight: 600, letterSpacing: -3, color: FG }, fmtTps(data.decodeTps)),
        span({ fontSize: 44, lineHeight: '48px', paddingBottom: compact ? 10 : 14, color: MUTED }, 'tok/s'),
      ),
      div(
        flex({ marginTop: compact ? 14 : 18, flexWrap: 'wrap', alignItems: 'flex-end', gap: 10, fontFamily: DISPLAY, fontSize: modelSize, lineHeight: `${lineHeight}px`, fontWeight: 600, color: FG }),
        span({}, data.model),
        span({ fontFamily: MONO, fontWeight: 500, color: MUTED }, data.quant),
        span({ fontFamily: TEXT, fontWeight: 400, color: MUTED }, 'on'),
        div(
          flex({ alignItems: 'center', gap: 8, height: lineHeight }),
          runtimeMark(data, assets, Math.round(modelSize * 1.1)),
          span({ fontFamily: TEXT, fontWeight: 500 }, data.runtime),
        ),
        ...(versionInline ? [version] : []),
      ),
      ...(versionInline
        ? []
        : [
            div(
              flex({ marginTop: 2, width: VERSION_COLUMN }),
              h('span', { style: { display: 'block', width: VERSION_COLUMN, fontFamily: MONO, fontWeight: 500, fontSize: 22, lineHeight: '26px', color: MUTED, wordBreak: 'break-word', lineClamp: 2 } }, data.runtimeVersion),
            ),
          ]),
      div(
        flex({ marginTop: compact ? 4 : 8, gap: 7, fontSize: hardwareSize, lineHeight: `${Math.round(hardwareSize * 1.3)}px`, color: MUTED }),
        span({}, data.hardware),
        ...(data.inRig ? [span({ color: '#71717a' }, 'in'), span({}, data.inRig)] : []),
      ),
      ...(data.rank
        ? [
            div(
              flex({ marginTop: compact ? 16 : 28, gap: 12 }),
              pill(FG, 'rgba(255,255,255,0.16)', span({ fontFamily: MONO }, `#${data.rank.position}`), span({ color: MUTED, fontWeight: 400 }, `of ${data.rank.size} on the ${data.rank.kind} board`)),
            ),
          ]
        : []),
    ),
    ownerRow(data.owner, `· ${fmtDate(data.runDate)}`),
  )
}

const PANEL = { right: 80, top: 140, width: 480, height: 340 }
const panelStyle = (): CSSProperties => flex({ position: 'absolute', right: PANEL.right, top: PANEL.top, width: PANEL.width, height: PANEL.height, borderRadius: 24, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.14)', backgroundColor: '#0f0f11' })

// The schematic's inks, as RigSchematic paints them on the site.
const SCHEMATIC_INK = { strong: 'rgba(244,244,245,0.62)', soft: 'rgba(244,244,245,0.34)', label: 'rgba(161,161,170,0.9)' } as const
const SCHEMATIC_FILL = 'rgba(244,244,245,0.035)'

/**
 * The rig's parts schematic in the photo panel, for rigs without a photo: the same drawing the site shows, on the same
 * faint grid. Shapes go through one inline SVG; the printed model numbers are laid as text by Satori itself, since the
 * rasteriser that turns an inline SVG into pixels has none of the card's fonts.
 */
function schematicPanel(components: RigCardData['components']): ReactElement {
  const { viewBox, prims } = drawRig(components, HARDWARE_BY_ID)
  const [, , vw, vh] = viewBox.split(' ').map(Number)
  const area = { x: 48, y: 41, w: 384, h: 258 }
  const scale = Math.min(area.w / vw, area.h / vh)
  const dw = vw * scale, dh = vh * scale
  const ox = area.x + (area.w - dw) / 2, oy = area.y + (area.h - dh) / 2
  const shapes = prims
    .filter((p) => p.kind !== 'text')
    .map((p, index) => {
      const stroke = SCHEMATIC_INK[p.ink]
      switch (p.kind) {
        case 'rect':
          return p.fill === 'stroke'
            ? h('rect', { key: index, x: p.x, y: p.y, width: p.w, height: p.h, rx: p.rx, fill: stroke, opacity: p.opacity })
            : h('rect', { key: index, x: p.x, y: p.y, width: p.w, height: p.h, rx: p.rx, fill: SCHEMATIC_FILL, stroke, strokeWidth: 1 / scale })
        case 'circle':
          return h('circle', { key: index, cx: p.cx, cy: p.cy, r: p.r, fill: SCHEMATIC_FILL, stroke, strokeWidth: 1 / scale })
        case 'path':
          return h('path', { key: index, d: p.d, fill: 'none', stroke, strokeWidth: 1 / scale })
        default:
          return null
      }
    })
  const labels = prims
    .filter((p): p is Extract<Prim, { kind: 'text' }> => p.kind === 'text')
    .map((p) => {
      const size = p.size * scale
      const width = textWidth(p.text, size, true) + 4
      const left = ox + p.x * scale - (p.anchor === 'middle' ? width / 2 : 0)
      return div(
        flex({ position: 'absolute', left, top: oy + p.y * scale - size * 0.78, width, height: size, justifyContent: p.anchor === 'middle' ? 'center' : 'flex-start' }),
        span({ fontFamily: MONO, fontWeight: 500, fontSize: size, lineHeight: `${size}px`, color: SCHEMATIC_INK[p.ink], whiteSpace: 'nowrap' }, p.text),
      )
    })
  // The site's grid ground: 24px lines at 16% white, at 40%.
  let grid = ''
  for (let x = 0; x <= PANEL.width; x += 24) grid += `M${x} 0V${PANEL.height}`
  for (let y = 0; y <= PANEL.height; y += 24) grid += `M0 ${y}H${PANEL.width}`
  return div(
    panelStyle(),
    h('svg', { viewBox: `0 0 ${PANEL.width} ${PANEL.height}`, width: PANEL.width, height: PANEL.height, style: { position: 'absolute', left: 0, top: 0 } }, h('path', { d: grid, fill: 'none', stroke: 'white', strokeOpacity: 0.064, strokeWidth: 0.5 })),
    h('svg', { viewBox, width: dw, height: dh, style: { position: 'absolute', left: ox, top: oy } }, ...shapes),
    ...labels,
  )
}

export function RigCardImage({ data, assets }: { data: RigCardData; assets: CardAssets }): ReactElement {
  const hasPhoto = Boolean(assets.photo)
  // Without a photo the panel shows the parts schematic instead, so the two cards share one layout.
  const hasPanel = hasPhoto || data.components.length > 0
  const columnWidth = hasPanel ? 540 : 620
  const nameSize = fitSize(data.name, columnWidth, hasPanel ? 52 : 54, 30)
  const eyebrow = `Rig${data.os ? ` · ${data.os}` : ''}`
  const photo = hasPhoto
    ? [div(panelStyle(), h('img', { src: assets.photo, width: PANEL.width, height: PANEL.height, style: { objectFit: 'cover' } }))]
    : hasPanel
      ? [schematicPanel(data.components)]
      : []
  const parts = data.parts.map((part, index) =>
    h(
      'div',
      { key: index, style: flex({ gap: 16 }) },
      span({ width: 44, fontWeight: 500, color: '#d4d4d8' }, `${part.quantity}×`),
      span({ maxWidth: columnWidth - 60, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }, part.name),
      ...(part.detail ? [span({ color: MUTED }, part.detail)] : []),
    ),
  )
  // The best line stays inside the column: its description wraps beside the figure, up to two lines, shrinking a
  // little first when a long model name needs it, and is cut only past that. The first line sits where the
  // single-line version always did, so short descriptions look as before and a second line simply hangs below.
  const bestText = data.best ? `tok/s best · ${data.best.model} ${data.best.quant} on ${data.best.runtime}` : ''
  const bestWidth = columnWidth - 130
  const bestSize = fitSize(bestText, bestWidth * 2, 22, 18)
  const best = data.best
    ? div(
        flex({ marginTop: 30, alignItems: 'flex-start', gap: 12, width: columnWidth }),
        span({ fontFamily: MONO, fontSize: 44, lineHeight: '44px', fontWeight: 600, color: FG }, fmtTps(data.best.tps)),
        div(
          flex({ width: bestWidth, paddingTop: 10 }),
          h('span', { style: { display: 'block', width: bestWidth, fontSize: bestSize, lineHeight: '28px', color: MUTED, wordBreak: 'break-word', lineClamp: 2 } }, bestText),
        ),
      )
    : div(flex({ marginTop: 30 }), span({ fontSize: 22, lineHeight: '28px', color: MUTED }, 'No results yet'))
  return frame(
    assets,
    ...photo,
    div(
      flex({ position: 'absolute', left: 80, top: 170, width: columnWidth, flexDirection: 'column', alignItems: 'flex-start' }),
      span({ fontSize: 20, lineHeight: '24px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: 1.2, color: MUTED }, eyebrow),
      span({ marginTop: 14, maxWidth: columnWidth, fontFamily: DISPLAY, fontSize: nameSize, lineHeight: `${Math.round(nameSize * 1.12)}px`, fontWeight: 600, color: FG, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }, data.name),
      div(flex({ marginTop: 26, flexDirection: 'column', gap: 10, fontSize: 25, lineHeight: '32px', color: FG }), ...parts),
      best,
    ),
    ownerRow(data.owner, `· ${data.resultsCount} ${data.resultsCount === 1 ? 'result' : 'results'}`),
  )
}

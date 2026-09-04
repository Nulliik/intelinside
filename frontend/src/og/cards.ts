// The two card layouts, R1 for results and G1 for rigs, as chosen on Sep 4 and revised after Tate's review the same
// evening: the wordmark carries the domain, the runtime shows as its leaderboard badge (mark plus name), there is
// no verification pill, and the parts list's quantities are set in Red Hat Text. Written for Satori: every box with
// more than one child is a flex container, text sits alone in its element, sizes are absolute, and long names
// scale down before they wrap. Positions match the Figma frames at 1200×630.
//
// Built with createElement rather than JSX so this stays a .ts file: Vercel's function tracer resolves a `.js`
// import to a `.ts` source but not to `.tsx`, and a missing module here took the card route down in production.
import { createElement as h, type CSSProperties, type ReactElement, type ReactNode } from 'react'
import { RUNTIME_MARKS } from '../components/runtimeMarks.generated.js'
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

function avatar(owner: Owner, src: string | undefined, size: number): ReactElement {
  const style: CSSProperties = {
    width: size,
    height: size,
    borderRadius: 999,
    backgroundColor: '#18181b',
    border: '1px solid rgba(255,255,255,0.1)',
    overflow: 'hidden',
  }
  if (src) return h('img', { src, width: size, height: size, style: { ...style, objectFit: 'cover' } })
  return div(flex({ ...style, alignItems: 'center', justifyContent: 'center', fontSize: size * 0.39, fontWeight: 500, color: FG }), owner.initials)
}

function ownerRow(owner: Owner, avatarSrc: string | undefined, trailing: string): ReactElement {
  return div(
    flex({ position: 'absolute', left: 80, bottom: 46, alignItems: 'center', gap: 12, fontSize: 22, lineHeight: '28px', color: MUTED }),
    avatar(owner, avatarSrc, 36),
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

export function ResultCardImage({ data, assets }: { data: ResultCardData; assets: CardAssets }): ReactElement {
  // The mark takes about the width of two characters, so it counts for two when the line is sized to fit.
  const modelSize = fitSize(`${data.model} ${data.quant} on ${data.runtime} ${data.runtimeVersion}  `, 700, 38, 26)
  const lineHeight = Math.round(modelSize * 1.2)
  const versionSize = Math.round(modelSize * 0.68)
  const hardwareLine = `${data.hardware}${data.inRig ? ` in ${data.inRig}` : ''}`
  const hardwareSize = fitSize(hardwareLine, 700, 26, 18)
  return frame(
    assets,
    div(
      flex({ position: 'absolute', left: 80, top: 176, flexDirection: 'column', alignItems: 'flex-start' }),
      div(
        flex({ alignItems: 'flex-end', gap: 20 }),
        span({ fontFamily: MONO, fontSize: 150, lineHeight: '150px', fontWeight: 600, letterSpacing: -3, color: FG }, fmtTps(data.decodeTps)),
        span({ fontSize: 44, lineHeight: '48px', paddingBottom: 14, color: MUTED }, 'tok/s'),
      ),
      div(
        flex({ marginTop: 18, alignItems: 'flex-end', gap: 10, fontFamily: DISPLAY, fontSize: modelSize, lineHeight: `${lineHeight}px`, fontWeight: 600, color: FG }),
        span({}, data.model),
        span({ fontFamily: MONO, fontWeight: 500, color: MUTED }, data.quant),
        span({ fontFamily: TEXT, fontWeight: 400, color: MUTED }, 'on'),
        div(
          flex({ alignItems: 'center', gap: 8, height: lineHeight }),
          runtimeMark(data, assets, Math.round(modelSize * 1.1)),
          span({ fontFamily: TEXT, fontWeight: 500 }, data.runtime),
        ),
        span({ fontFamily: MONO, fontWeight: 500, fontSize: versionSize, lineHeight: `${Math.round(versionSize * 1.3)}px`, color: MUTED, paddingBottom: 2 }, data.runtimeVersion),
      ),
      div(
        flex({ marginTop: 8, gap: 7, fontSize: hardwareSize, lineHeight: `${Math.round(hardwareSize * 1.3)}px`, color: MUTED }),
        span({}, data.hardware),
        ...(data.inRig ? [span({ color: '#71717a' }, 'in'), span({}, data.inRig)] : []),
      ),
      ...(data.rank
        ? [
            div(
              flex({ marginTop: 28, gap: 12 }),
              pill(FG, 'rgba(255,255,255,0.16)', span({ fontFamily: MONO }, `#${data.rank.position}`), span({ color: MUTED, fontWeight: 400 }, `of ${data.rank.size} on the ${data.rank.kind} board`)),
            ),
          ]
        : []),
    ),
    ownerRow(data.owner, assets.avatar, `· ${fmtDate(data.runDate)}`),
  )
}

export function RigCardImage({ data, assets }: { data: RigCardData; assets: CardAssets }): ReactElement {
  const hasPhoto = Boolean(assets.photo)
  const columnWidth = hasPhoto ? 540 : 620
  const nameSize = fitSize(data.name, columnWidth, hasPhoto ? 52 : 54, 30)
  const eyebrow = `Rig${data.os ? ` · ${data.os}` : ''}`
  const photo = hasPhoto
    ? [
        div(
          flex({ position: 'absolute', right: 80, top: 140, width: 480, height: 340, borderRadius: 24, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.14)', backgroundColor: '#0f0f11' }),
          h('img', { src: assets.photo, width: 480, height: 340, style: { objectFit: 'cover' } }),
        ),
      ]
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
  const best = data.best
    ? div(
        flex({ marginTop: 30, alignItems: 'flex-end', gap: 12 }),
        span({ fontFamily: MONO, fontSize: 44, lineHeight: '44px', fontWeight: 600, color: FG }, fmtTps(data.best.tps)),
        span({ fontSize: 22, lineHeight: '28px', paddingBottom: 6, color: MUTED }, `tok/s best · ${data.best.model} ${data.best.quant} on ${data.best.runtime}`),
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
    ownerRow(data.owner, assets.avatar, `· ${data.resultsCount} ${data.resultsCount === 1 ? 'result' : 'results'}`),
  )
}

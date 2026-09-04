// The two card layouts, R1 for results and G1 for rigs, as chosen on Sep 4. Written for Satori: every box with
// more than one child is a flex container, text sits alone in its element, sizes are absolute, and long names
// scale down before they wrap. Positions match the design canvas at 1200×630.
//
// Built with createElement rather than JSX so this stays a .ts file: Vercel's function tracer resolves a `.js`
// import to a `.ts` source but not to `.tsx`, and a missing module here took the card route down in production.
import { createElement as h, type CSSProperties, type ReactElement, type ReactNode } from 'react'
import { fmtDate, fmtTps } from '../lib/format.js'
import type { CardAssets } from './assets.js'
import type { Owner, ResultCardData, RigCardData } from './data.js'

const FG = '#f4f4f5'
const MUTED = '#a1a1aa'
const TEXT = 'Red Hat Text'
const DISPLAY = 'Red Hat Display'
const MONO = 'Red Hat Mono'

/** A font size that keeps `text` inside `maxWidth`, between `max` and `min`; 0.56 em per character is Red Hat's average. */
export function fitSize(text: string, maxWidth: number, max: number, min: number): number {
  const chars = Math.max(text.length, 1)
  return Math.max(min, Math.min(max, Math.floor(maxWidth / (chars * 0.56))))
}

const flex = (style: CSSProperties = {}): CSSProperties => ({ display: 'flex', ...style })

const div = (style: CSSProperties, ...children: ReactNode[]) => h('div', { style }, ...children)
const span = (style: CSSProperties, text: string) => h('span', { style }, text)

function frame(assets: CardAssets, ...children: ReactNode[]): ReactElement {
  return div(
    flex({ position: 'relative', width: 1200, height: 630, backgroundColor: '#0a0a0a', color: FG, fontFamily: TEXT, overflow: 'hidden' }),
    h('img', { src: assets.background, width: 1200, height: 630, style: { position: 'absolute', top: 0, left: 0 } }),
    h('img', { src: assets.lockup, width: 340, height: 60, style: { position: 'absolute', top: 70, left: 77 } }),
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

const verifiedIcon = () =>
  h(
    'svg',
    { viewBox: '0 0 24 24', width: 20, height: 20, fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' },
    h('path', { d: 'M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z' }),
    h('path', { d: 'm9 12 2 2 4-4' }),
  )

export function ResultCardImage({ data, assets }: { data: ResultCardData; assets: CardAssets }): ReactElement {
  const modelLine = `${data.model} ${data.quant} on ${data.runtime} ${data.runtimeVersion}`
  const modelSize = fitSize(modelLine, 700, 38, 26)
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
        flex({ marginTop: 18, alignItems: 'flex-end', gap: 10, fontFamily: DISPLAY, fontSize: modelSize, lineHeight: `${Math.round(modelSize * 1.2)}px`, fontWeight: 600, color: FG }),
        span({}, data.model),
        span({ fontFamily: MONO, fontWeight: 500, color: MUTED }, data.quant),
        span({ fontFamily: TEXT, fontWeight: 400, color: MUTED }, 'on'),
        span({}, data.runtime),
        span({ fontFamily: MONO, fontWeight: 500, fontSize: Math.round(modelSize * 0.68), color: MUTED, paddingBottom: 2 }, data.runtimeVersion),
      ),
      div(
        flex({ marginTop: 8, gap: 7, fontSize: hardwareSize, lineHeight: `${Math.round(hardwareSize * 1.3)}px`, color: MUTED }),
        span({}, data.hardware),
        ...(data.inRig ? [span({ color: '#71717a' }, 'in'), span({}, data.inRig)] : []),
      ),
      div(
        flex({ marginTop: 28, gap: 12 }),
        data.verified
          ? pill('#6dc799', 'rgba(109,199,153,0.45)', verifiedIcon(), span({}, 'Verified'))
          : pill(MUTED, 'rgba(255,255,255,0.16)', span({}, 'Self-reported')),
        ...(data.rank
          ? [pill(FG, 'rgba(255,255,255,0.16)', span({ fontFamily: MONO }, `#${data.rank.position}`), span({ color: MUTED, fontWeight: 400 }, `of ${data.rank.size} on the ${data.rank.kind} board`))]
          : []),
      ),
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
      span({ width: 44, fontFamily: MONO, color: MUTED }, `${part.quantity}×`),
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

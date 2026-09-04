// The head tags every page carries: title, description, canonical, and the social card. The middleware writes them
// into the SPA shell for whoever asks; `metaShell` is the bare fallback page for crawlers when the shell can't be read.
import { BRAND_NAME } from '../lib/brand.js'
import { fmtTps } from '../lib/format.js'
import { pageTitle, type PageSeo } from '../lib/seo.js'
import type { ResultCardData, RigCardData } from './data.js'

/** `title` is the full document title, brand included; it doubles as the social title, so a share reads like the tab. */
export type PageMeta = { title: string; description: string; path: string; image: string }

/** Home, models, hardware, and rigs: their SEO copy with the landing card. */
export function staticMeta(page: PageSeo): PageMeta {
  return { title: pageTitle(page.title, page.brandFirst), description: page.description, path: page.path, image: '/og/landing.jpg' }
}

const escape = (text: string) => text.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] ?? c)

export function cardImagePath(kind: 'result' | 'rig', id: string, updatedAt?: string): string {
  return `/api/og/${kind}?id=${encodeURIComponent(id)}${updatedAt ? `&v=${encodeURIComponent(updatedAt)}` : ''}`
}

export function resultMeta(data: ResultCardData): PageMeta {
  const where = `${data.hardware}${data.inRig ? ` in ${data.inRig}` : ''}`
  const rank = data.rank ? ` #${data.rank.position} of ${data.rank.size} on the ${data.rank.kind} board.` : ''
  return {
    title: pageTitle(`${fmtTps(data.decodeTps)} tok/s | ${data.model} ${data.quant} on ${data.runtime}`),
    description: `${where}.${rank} ${data.verified ? 'Verified by the community.' : 'Self-reported.'} Posted by ${data.owner.handle} on ${BRAND_NAME}.`,
    path: `/results/${data.id}`,
    image: cardImagePath('result', data.id, data.updatedAt),
  }
}

export function rigMeta(data: RigCardData): PageMeta {
  const parts = data.parts.map((part) => `${part.quantity > 1 ? `${part.quantity}× ` : ''}${part.name}`).join(' · ')
  const best = data.best ? ` Best ${fmtTps(data.best.tps)} tok/s on ${data.best.model} ${data.best.quant}.` : ''
  return {
    title: pageTitle(`${data.name} | ${data.owner.handle}`),
    description: `${parts || 'A rig'}${data.os ? ` · ${data.os}` : ''}.${best} ${data.resultsCount} ${data.resultsCount === 1 ? 'result' : 'results'}.`,
    path: `/rigs/${data.id}`,
    image: cardImagePath('rig', data.id, data.updatedAt),
  }
}

/** The head tags for a page, URLs made absolute on `origin`. */
export function metaTags(meta: PageMeta, origin: string): string {
  const url = escape(`${origin}${meta.path}`)
  const image = escape(`${origin}${meta.image}`)
  const title = escape(meta.title)
  const description = escape(meta.description)
  return [
    `<title>${title}</title>`,
    `<meta name="description" content="${description}">`,
    `<link rel="canonical" href="${url}">`,
    `<meta property="og:type" content="website">`,
    `<meta property="og:site_name" content="${BRAND_NAME}">`,
    `<meta property="og:url" content="${url}">`,
    `<meta property="og:title" content="${title}">`,
    `<meta property="og:description" content="${description}">`,
    `<meta property="og:image" content="${image}">`,
    `<meta property="og:image:width" content="1200">`,
    `<meta property="og:image:height" content="630">`,
    `<meta property="og:image:alt" content="${title}">`,
    `<meta name="twitter:card" content="summary_large_image">`,
    `<meta name="twitter:title" content="${title}">`,
    `<meta name="twitter:description" content="${description}">`,
    `<meta name="twitter:image" content="${image}">`,
  ].join('\n')
}

/** The tags the shell already carries for the home page, replaced wholesale by `injectMeta`. */
const SHELL_TAGS = /<title>[^<]*<\/title>\s*|<meta\s+(?:name|property)="(?:description|og:[^"]*|twitter:[^"]*)"[^>]*>\s*|<link\s+rel="canonical"[^>]*>\s*/g

/** The SPA shell with this page's tags in place of the site-wide ones. Untouched when it has no head to write into. */
export function injectMeta(html: string, meta: PageMeta, origin: string): string {
  const end = html.indexOf('</head>')
  if (end < 0) return html
  return `${html.slice(0, end).replace(SHELL_TAGS, '')}${metaTags(meta, origin)}\n${html.slice(end)}`
}

/** A bare page with the tags and a link to the app, for crawlers when the shell can't be read. */
export function metaShell(meta: PageMeta, origin: string): string {
  const url = escape(`${origin}${meta.path}`)
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="theme-color" content="#5438ff">
${metaTags(meta, origin)}
</head>
<body style="margin:0;background:#0a0a0a;color:#f4f4f5;font-family:system-ui,sans-serif">
<main style="padding:48px 32px;max-width:720px">
<h1 style="font-size:24px;line-height:32px;margin:0 0 8px">${escape(meta.title)}</h1>
<p style="color:#a1a1aa;margin:0 0 24px">${escape(meta.description)}</p>
<a href="${url}" style="color:#9c9cff">Open on ${BRAND_NAME}</a>
</main>
</body>
</html>
`
}

const CRAWLER = /bot|crawl|spider|slurp|preview|embed|fetch|facebookexternalhit|facebot|twitterbot|linkedinbot|discordbot|slackbot|redditbot|telegrambot|whatsapp|pinterest|bluesky|mastodon|iframely|embedly|skypeuripreview|applebot|googlebot|bingbot|duckduckbot|yandex|baiduspider|vkshare|w3c_validator/i

/** True for the user agents that unfurl links. They get the tags even when the app shell can't be read. */
export const isCrawler = (userAgent: string) => CRAWLER.test(userAgent)

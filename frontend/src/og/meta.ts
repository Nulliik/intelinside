// The HTML shell crawlers get instead of the SPA: title, description, and the card, nothing else to render.
import { BRAND_NAME } from '../lib/brand.js'
import { fmtTps } from '../lib/format.js'
import { pageTitle, type PageSeo } from '../lib/seo.js'
import type { ResultCardData, RigCardData } from './data.js'

export type PageMeta = { title: string; description: string; path: string; image: string }

/** Home, models, hardware, and rigs: their SEO copy with the landing card. */
export function staticMeta(page: PageSeo): PageMeta {
  return { title: page.title, description: page.description, path: page.path, image: '/og/landing.jpg' }
}

const escape = (text: string) => text.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] ?? c)

export function cardImagePath(kind: 'result' | 'rig', id: string, updatedAt?: string): string {
  return `/api/og/${kind}?id=${encodeURIComponent(id)}${updatedAt ? `&v=${encodeURIComponent(updatedAt)}` : ''}`
}

export function resultMeta(data: ResultCardData): PageMeta {
  const where = `${data.hardware}${data.inRig ? ` in ${data.inRig}` : ''}`
  const rank = data.rank ? ` #${data.rank.position} of ${data.rank.size} on the ${data.rank.kind} board.` : ''
  return {
    title: `${fmtTps(data.decodeTps)} tok/s | ${data.model} ${data.quant} on ${data.runtime}`,
    description: `${where}.${rank} ${data.verified ? 'Verified by the community.' : 'Self-reported.'} Posted by ${data.owner.handle} on ${BRAND_NAME}.`,
    path: `/results/${data.id}`,
    image: cardImagePath('result', data.id, data.updatedAt),
  }
}

export function rigMeta(data: RigCardData): PageMeta {
  const parts = data.parts.map((part) => `${part.quantity > 1 ? `${part.quantity}× ` : ''}${part.name}`).join(' · ')
  const best = data.best ? ` Best ${fmtTps(data.best.tps)} tok/s on ${data.best.model} ${data.best.quant}.` : ''
  return {
    title: `${data.name} | ${data.owner.handle}`,
    description: `${parts || 'A rig'}${data.os ? ` · ${data.os}` : ''}.${best} ${data.resultsCount} ${data.resultsCount === 1 ? 'result' : 'results'}.`,
    path: `/rigs/${data.id}`,
    image: cardImagePath('rig', data.id, data.updatedAt),
  }
}

export function metaShell(meta: PageMeta, origin: string): string {
  const url = `${origin}${meta.path}`
  const image = `${origin}${meta.image}`
  const title = escape(meta.title)
  const description = escape(meta.description)
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escape(pageTitle(meta.title))}</title>
<meta name="description" content="${description}">
<link rel="canonical" href="${escape(url)}">
<meta name="theme-color" content="#5438ff">
<meta property="og:type" content="website">
<meta property="og:site_name" content="${BRAND_NAME}">
<meta property="og:url" content="${escape(url)}">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${description}">
<meta property="og:image" content="${escape(image)}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="${title}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${title}">
<meta name="twitter:description" content="${description}">
<meta name="twitter:image" content="${escape(image)}">
</head>
<body style="margin:0;background:#0a0a0a;color:#f4f4f5;font-family:system-ui,sans-serif">
<main style="padding:48px 32px;max-width:720px">
<h1 style="font-size:24px;line-height:32px;margin:0 0 8px">${title}</h1>
<p style="color:#a1a1aa;margin:0 0 24px">${description}</p>
<a href="${escape(url)}" style="color:#9c9cff">Open on ${BRAND_NAME}</a>
</main>
</body>
</html>
`
}

const CRAWLER = /bot|crawl|spider|slurp|preview|embed|fetch|facebookexternalhit|facebot|twitterbot|linkedinbot|discordbot|slackbot|redditbot|telegrambot|whatsapp|pinterest|bluesky|mastodon|iframely|embedly|skypeuripreview|applebot|googlebot|bingbot|duckduckbot|yandex|baiduspider|vkshare|w3c_validator/i

/** True for the user agents that unfurl links; humans keep the SPA. */
export const isCrawler = (userAgent: string) => CRAWLER.test(userAgent)

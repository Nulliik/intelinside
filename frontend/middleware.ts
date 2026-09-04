// Vercel Edge Middleware. The site is a Vite SPA, so crawlers would otherwise see one static index.html for every
// page. Crawler user agents get a small HTML shell with the page's own title, description, and card: the SEO copy
// with the landing card for the home, models, hardware, and rigs pages, and a rendered card for a rig or result.
// Everyone else falls through to the SPA as before.
import { next } from '@vercel/functions'
import { staticPageSeo } from './src/lib/seo.js'
import { loadResultCard, loadRigCard, ogEnv } from './src/og/data.js'
import { isCrawler, metaShell, resultMeta, rigMeta, staticMeta, type PageMeta } from './src/og/meta.js'

export const config = { matcher: ['/', '/models', '/hardware', '/rigs', '/results/:id', '/rigs/:id'] }

function shell(meta: PageMeta, origin: string): Response {
  return new Response(metaShell(meta, origin), {
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'public, max-age=0, s-maxage=300, stale-while-revalidate=3600',
    },
  })
}

export default async function middleware(request: Request): Promise<Response> {
  if (!isCrawler(request.headers.get('user-agent') ?? '')) return next()
  const url = new URL(request.url)
  const page = staticPageSeo(url.pathname)
  if (page) return shell(staticMeta(page), url.origin)
  const [, kind, id] = url.pathname.split('/')
  const env = ogEnv()
  if (!env || !id || !/^\d{1,18}$/.test(id)) return next()
  try {
    const meta = kind === 'results' ? await loadResultCard(id, env).then((data) => data && resultMeta(data)) : kind === 'rigs' ? await loadRigCard(id, env).then((data) => data && rigMeta(data)) : null
    return meta ? shell(meta, url.origin) : next()
  } catch {
    return next()
  }
}

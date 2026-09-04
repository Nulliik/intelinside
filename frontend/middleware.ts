// Vercel Edge Middleware. The site is a Vite SPA whose one index.html carries the home page's title and card, so a
// share of any other page would unfurl as the home page. For the pages that matter (home, models, hardware, rigs,
// and every rig and result page) the middleware serves that same shell with the page's own title, description, and
// card written into the head, whoever is asking: browsers, social crawlers, and the link-preview scrapers that don't
// announce themselves. When the shell can't be read, crawlers get a bare page with the tags and people get the app.
import { next } from '@vercel/functions'
import { staticPageSeo } from './src/lib/seo.js'
import { loadResultCard, loadRigCard, ogEnv } from './src/og/data.js'
import { injectMeta, isCrawler, metaShell, resultMeta, rigMeta, staticMeta, type PageMeta } from './src/og/meta.js'

export const config = { matcher: ['/', '/models', '/hardware', '/rigs', '/results/:id', '/rigs/:id'] }

const HTML_HEADERS = {
  'content-type': 'text/html; charset=utf-8',
  'cache-control': 'public, max-age=0, s-maxage=300, stale-while-revalidate=3600',
}

/** The page's tags: the SEO copy for a static page, a rig's or result's own, or null when there is nothing to say. */
async function pageMeta(url: URL): Promise<PageMeta | null> {
  const page = staticPageSeo(url.pathname)
  if (page) return staticMeta(page)
  const [, kind, id] = url.pathname.split('/')
  const env = ogEnv()
  if (!env || !id || !/^\d{1,18}$/.test(id)) return null
  if (kind === 'results') return loadResultCard(id, env).then((data) => (data ? resultMeta(data) : null))
  if (kind === 'rigs') return loadRigCard(id, env).then((data) => (data ? rigMeta(data) : null))
  return null
}

/** Resolves to null after `ms`, or when the promise rejects. */
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T | null> {
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve(null), ms)
    const settle = (value: T | null) => {
      clearTimeout(timer)
      resolve(value)
    }
    promise.then(settle, () => settle(null))
  })
}

let shell: Promise<string | null> | undefined

/**
 * The deployment's own index.html, fetched once per isolate. The visitor's cookie goes along so a protected preview
 * deployment answers too. Null when it can't be read; that is not kept, so the next request tries again.
 */
function loadShell(request: Request, origin: string): Promise<string | null> {
  if (!shell) {
    const headers: Record<string, string> = { accept: 'text/html' }
    const cookie = request.headers.get('cookie')
    if (cookie) headers.cookie = cookie
    shell = fetch(`${origin}/index.html`, { headers })
      .then((response) => (response.ok ? response.text() : ''))
      .then((html) => (html.includes('</head>') && html.includes('id="root"') ? html : null))
      .catch(() => null)
    shell.then((html) => {
      if (!html) shell = undefined
    })
  }
  return shell
}

export default async function middleware(request: Request): Promise<Response> {
  const url = new URL(request.url)
  const crawler = isCrawler(request.headers.get('user-agent') ?? '')
  // Crawlers wait for the data; a person's page load is not held up by a slow lookup.
  const budget = crawler ? 8000 : 2500
  const meta = await withTimeout(pageMeta(url), budget)
  if (!meta) return next()
  const html = await withTimeout(loadShell(request, url.origin), budget)
  if (html) return new Response(injectMeta(html, meta, url.origin), { headers: HTML_HEADERS })
  return crawler ? new Response(metaShell(meta, url.origin), { headers: HTML_HEADERS }) : next()
}

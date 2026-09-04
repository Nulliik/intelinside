// Vercel Edge Middleware. The site is a Vite SPA, so crawlers would otherwise see one static index.html for every
// page. For rig and result pages, a crawler user agent gets a small HTML shell with the page's own title,
// description, and card; everyone else falls through to the SPA as before.
import { loadResultCard, loadRigCard, ogEnv } from './src/og/data'
import { isCrawler, metaShell, resultMeta, rigMeta } from './src/og/meta'

export const config = { matcher: ['/results/:id', '/rigs/:id'] }

export default async function middleware(request: Request): Promise<Response | undefined> {
  if (!isCrawler(request.headers.get('user-agent') ?? '')) return undefined
  const url = new URL(request.url)
  const [, kind, id] = url.pathname.split('/')
  const env = ogEnv()
  if (!env || !id || !/^\d{1,18}$/.test(id)) return undefined
  try {
    const meta = kind === 'results' ? await loadResultCard(id, env).then((data) => data && resultMeta(data)) : kind === 'rigs' ? await loadRigCard(id, env).then((data) => data && rigMeta(data)) : null
    if (!meta) return undefined
    return new Response(metaShell(meta, url.origin), {
      headers: {
        'content-type': 'text/html; charset=utf-8',
        'cache-control': 'public, max-age=0, s-maxage=300, stale-while-revalidate=3600',
      },
    })
  } catch {
    return undefined
  }
}

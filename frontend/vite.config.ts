import { fileURLToPath, URL } from 'node:url'
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { BRAND_NAME } from './src/lib/brand'
import { PAGE_SEO, SITE_DESCRIPTION, pageTitle } from './src/lib/seo'

/**
 * The site's own origin, for absolute URLs in the HTML shell: `VITE_SITE_URL` when set, else the production domain
 * Vercel exposes at build time (a custom domain once one is attached), else the dev server.
 */
function siteOrigin(): string {
  const configured = process.env.VITE_SITE_URL?.trim()
  if (configured) return configured.replace(/\/$/, '')
  const production = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim()
  if (production) return `https://${production.replace(/\/$/, '')}`
  return 'http://localhost:5173'
}

/**
 * The landing card and meta tags every page ships with. Crawlers get this index.html for every route except rig
 * and result pages, which the middleware answers with their own card, so this is the site-wide fallback.
 */
function siteMeta(): Plugin {
  return {
    name: 'intelinside-site-meta',
    transformIndexHtml(html) {
      const origin = siteOrigin()
      const title = pageTitle(PAGE_SEO.home.title, PAGE_SEO.home.brandFirst)
      const description = SITE_DESCRIPTION
      const image = `${origin}/og/landing.jpg`
      // The title, description, and social tags are the home page's. The middleware rewrites them per page for the
      // routes it covers, and the app sets the title and description as it navigates. No canonical or og:url here:
      // this shell also serves the routes the middleware leaves alone, so a fixed URL would mark them all as home.
      const withDefaults = html
        .replace(/<title>[^<]*<\/title>/, `<title>${title}</title>`)
        .replace(/<meta name="description" content="[^"]*" \/>/, `<meta name="description" content="${description}" />`)
      return { html: withDefaults, tags: [
        { tag: 'meta', attrs: { name: 'theme-color', content: '#5438ff' }, injectTo: 'head' },
        { tag: 'meta', attrs: { property: 'og:type', content: 'website' }, injectTo: 'head' },
        { tag: 'meta', attrs: { property: 'og:site_name', content: BRAND_NAME }, injectTo: 'head' },
        { tag: 'meta', attrs: { property: 'og:title', content: title }, injectTo: 'head' },
        { tag: 'meta', attrs: { property: 'og:description', content: description }, injectTo: 'head' },
        { tag: 'meta', attrs: { property: 'og:image', content: image }, injectTo: 'head' },
        { tag: 'meta', attrs: { property: 'og:image:width', content: '1200' }, injectTo: 'head' },
        { tag: 'meta', attrs: { property: 'og:image:height', content: '630' }, injectTo: 'head' },
        { tag: 'meta', attrs: { property: 'og:image:alt', content: title }, injectTo: 'head' },
        { tag: 'meta', attrs: { name: 'twitter:card', content: 'summary_large_image' }, injectTo: 'head' },
        { tag: 'meta', attrs: { name: 'twitter:title', content: title }, injectTo: 'head' },
        { tag: 'meta', attrs: { name: 'twitter:description', content: description }, injectTo: 'head' },
        { tag: 'meta', attrs: { name: 'twitter:image', content: image }, injectTo: 'head' },
      ] }
    },
  }
}

// Live data mode proxies /api and legacy /auth routes to Jack's backend on :8080.
// Supabase browser auth talks directly to the configured project in either data mode.
export default defineConfig({
  plugins: [react(), tailwindcss(), siteMeta()],
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': 'http://127.0.0.1:8080',
      '/auth': {
        target: 'http://127.0.0.1:8080',
        bypass(req) {
          if (req.url && new URL(req.url, 'http://localhost').pathname === '/auth/callback') {
            return '/index.html'
          }
        },
      },
    },
  },
})

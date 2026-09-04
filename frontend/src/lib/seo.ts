// Titles and descriptions for the pages that matter to search, in one place. The app sets them on the document,
// the Vite plugin bakes the defaults into index.html, and the middleware serves them to crawlers, which never run
// the app. Relative imports only: this also runs at the edge and in the Vite config.
import { BRAND_NAME } from './brand.js'

export const TITLE_SEPARATOR = ' | '

/** "Rigs | intelinside", or just the brand when there is no page title. */
export const pageTitle = (title?: string) => (title ? `${title}${TITLE_SEPARATOR}${BRAND_NAME}` : BRAND_NAME)

/** The site-wide description, used wherever a page has nothing more specific to say. */
export const SITE_DESCRIPTION =
  'Community leaderboard of local AI inference speed: real decode tok/s by model, quant, and runtime on GPUs, NUCs, and laptops. Post your rig and your numbers.'

/** The landing card's line, used as the social title for pages that share the landing image. */
export const LANDING_TITLE = 'Show your rig. Post your tok/s.'

export type PageSeo = { path: string; title: string; description: string }

export const PAGE_SEO = {
  home: {
    path: '/',
    title: 'Local LLM Benchmarks on Real Hardware',
    description: SITE_DESCRIPTION,
  },
  models: {
    path: '/models',
    title: 'LLM Leaderboards by Model and Quantization',
    description:
      'Decode tokens per second for Qwen3, Llama 3.1, Gemma 3, and more, ranked by rig and by part at every quantization. Community-run results, confirmed by the community.',
  },
  hardware: {
    path: '/hardware',
    title: 'GPU, CPU, and NPU Inference Benchmarks',
    description:
      'Browse the open hardware catalog: Intel Arc GPUs, Core Ultra CPUs, NPUs, and more, with real local LLM tokens-per-second results and the rigs that ran them.',
  },
  rigs: {
    path: '/rigs',
    title: 'Community AI Rigs and Their Benchmarks',
    description:
      'Real machines people run local AI on, parts and all. See each rig’s components, photo, and best decode tok/s, or register yours and submit results.',
  },
} as const satisfies Record<string, PageSeo>

/** The SEO entry for a pathname the middleware serves statically, or undefined. */
export function staticPageSeo(pathname: string): PageSeo | undefined {
  const path = pathname.replace(/\/+$/, '') || '/'
  return Object.values(PAGE_SEO).find((page) => page.path === path)
}

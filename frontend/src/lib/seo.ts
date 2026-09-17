// Titles and descriptions for the pages that matter to search, in one place. The app sets them on the document,
// the Vite plugin bakes the home page's into index.html, and the middleware serves them to crawlers, which never
// run the app. Relative imports only: this also runs at the edge and in the Vite config.
const TITLE_BRAND = 'Intelinside.ai'

export const TITLE_SEPARATOR = ' | '

/** "Models | Intelinside.ai", or brand first for the home page: "Intelinside.ai | Local LLM Benchmarks on Intel Hardware". */
export function pageTitle(title?: string, brandFirst = false): string {
  if (!title) return TITLE_BRAND
  return brandFirst ? `${TITLE_BRAND}${TITLE_SEPARATOR}${title}` : `${title}${TITLE_SEPARATOR}${TITLE_BRAND}`
}

/** The site-wide description, used wherever a page has nothing more specific to say. */
export const SITE_DESCRIPTION =
  'Local LLM speed on Intel hardware: real decode tok/s by model, quant, and runtime on Arc GPUs, Core Ultra chips, and Xeon boxes, posted by the community. Add your rig.'

export type PageSeo = { path: string; title: string; description: string; brandFirst?: boolean }

export const PAGE_SEO = {
  home: {
    path: '/',
    title: 'Local LLM Benchmarks on Intel Hardware',
    description: SITE_DESCRIPTION,
    brandFirst: true,
  },
  models: {
    path: '/models',
    title: 'Models',
    description:
      'Decode tok/s for Qwen3, Llama 3.1, Gemma 3, and more on Intel Arc, Core Ultra, and Xeon hardware, ranked by rig and by part at every quantization.',
  },
  hardware: {
    path: '/hardware',
    title: 'Hardware',
    description:
      'Intel hardware for local AI: Arc and Arc Pro GPUs, Core Ultra CPUs and NPUs, Xeon, and Gaudi, each with real LLM tok/s results and the rigs that ran them.',
  },
  rigs: {
    path: '/rigs',
    title: 'Rigs',
    description:
      'Real machines running local AI on Intel hardware, parts and all. See each rig’s components, photo, and best decode tok/s, or register yours and submit results.',
  },
} as const satisfies Record<string, PageSeo>

/** The SEO entry for a pathname the middleware serves statically, or undefined. */
export function staticPageSeo(pathname: string): PageSeo | undefined {
  const path = pathname.replace(/\/+$/, '') || '/'
  return Object.values(PAGE_SEO).find((page) => page.path === path)
}

// The card assets as files bundled into the edge function. Vercel includes files referenced with
// `new URL('./relative', import.meta.url)` in the function's bundle, so they load even when the deployment sits
// behind Vercel Authentication, where a fetch of the site's own /og/ URL would hit the login wall.
// Each path must be a string literal for the bundler to see it.
export const BUNDLED_OG_ASSETS: Record<string, URL> = {
  'fonts/red-hat-display-latin-600-normal.woff': new URL('../../public/og/fonts/red-hat-display-latin-600-normal.woff', import.meta.url),
  'fonts/red-hat-display-latin-700-normal.woff': new URL('../../public/og/fonts/red-hat-display-latin-700-normal.woff', import.meta.url),
  'fonts/red-hat-text-latin-400-normal.woff': new URL('../../public/og/fonts/red-hat-text-latin-400-normal.woff', import.meta.url),
  'fonts/red-hat-text-latin-500-normal.woff': new URL('../../public/og/fonts/red-hat-text-latin-500-normal.woff', import.meta.url),
  'fonts/red-hat-mono-latin-500-normal.woff': new URL('../../public/og/fonts/red-hat-mono-latin-500-normal.woff', import.meta.url),
  'fonts/red-hat-mono-latin-600-normal.woff': new URL('../../public/og/fonts/red-hat-mono-latin-600-normal.woff', import.meta.url),
  'dots-result.svg': new URL('../../public/og/dots-result.svg', import.meta.url),
  'dots-side.svg': new URL('../../public/og/dots-side.svg', import.meta.url),
  'mark.svg': new URL('../../public/og/mark.svg', import.meta.url),
  'runtimes/cascadia.svg': new URL('../../public/og/runtimes/cascadia.svg', import.meta.url),
}

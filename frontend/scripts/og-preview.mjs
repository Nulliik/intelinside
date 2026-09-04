// Bundles scripts/og-preview.entry.tsx with esbuild (shipped with Vite) and runs it. `npm run og:preview [outDir]`.
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { build } from 'esbuild'

const outfile = path.resolve('.og-preview', 'entry.mjs')
await build({
  entryPoints: [path.resolve('scripts', 'og-preview.entry.tsx')],
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node22',
  jsx: 'automatic',
  outfile,
  external: ['satori', '@resvg/resvg-js', 'react', 'react/jsx-runtime'],
  logLevel: 'warning',
})
await import(pathToFileURL(outfile).href)

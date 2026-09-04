// Fonts and images for the card renderer. Satori takes fonts as bytes and images as data URLs, so everything is
// fetched once and inlined. The source is the deployment's own /og/ folder at the edge, or the public folder on disk
// for the preview script.

export type AssetSource = {
  binary: (path: string) => Promise<ArrayBuffer>
  text: (path: string) => Promise<string>
}

export type FontSpec = { name: string; data: ArrayBuffer; weight: 400 | 500 | 600; style: 'normal' }

export type CardAssets = {
  /** The dot matrix for this layout, as a data URL. */
  background: string
  lockup: string
  /** The rig photo, already fetched and inlined; absent when there is none or it could not be read. */
  photo?: string
  /** The owner's avatar, inlined; absent falls back to initials. */
  avatar?: string
}

const FONTS: [FontSpec['name'], FontSpec['weight'], string][] = [
  ['Red Hat Display', 600, 'red-hat-display-latin-600-normal.woff'],
  ['Red Hat Text', 400, 'red-hat-text-latin-400-normal.woff'],
  ['Red Hat Text', 500, 'red-hat-text-latin-500-normal.woff'],
  ['Red Hat Mono', 500, 'red-hat-mono-latin-500-normal.woff'],
  ['Red Hat Mono', 600, 'red-hat-mono-latin-600-normal.woff'],
]

export function base64(bytes: ArrayBuffer): string {
  const view = new Uint8Array(bytes)
  let binary = ''
  for (let i = 0; i < view.length; i += 0x8000) binary += String.fromCharCode(...view.subarray(i, i + 0x8000))
  return btoa(binary)
}

export const svgDataUrl = (svg: string) => `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`

/** Serves /og/* over HTTP from the deployment that is rendering. Blocked by Vercel Authentication, so only a fallback. */
export function httpAssets(origin: string): AssetSource {
  const get = async (path: string) => {
    const response = await fetch(`${origin}/og/${path}`)
    if (!response.ok) throw new Error(`Asset ${path} returned ${response.status}`)
    return response
  }
  return {
    binary: (path) => get(path).then((r) => r.arrayBuffer()),
    text: (path) => get(path).then((r) => r.text()),
  }
}

/** Reads the files bundled into the edge function; falls back to `fallback` for anything not bundled or unreadable. */
export function bundledAssets(bundled: Record<string, URL>, fallback: AssetSource): AssetSource {
  const get = async (path: string) => {
    const url = bundled[path]
    if (!url) throw new Error(`Asset ${path} is not bundled`)
    const response = await fetch(url)
    if (!response.ok) throw new Error(`Asset ${path} returned ${response.status}`)
    return response
  }
  return {
    binary: (path) => get(path).then((r) => r.arrayBuffer()).catch(() => fallback.binary(path)),
    text: (path) => get(path).then((r) => r.text()).catch(() => fallback.text(path)),
  }
}

const fontCache = new Map<string, Promise<FontSpec[]>>()

export function loadFonts(source: AssetSource, cacheKey = 'default'): Promise<FontSpec[]> {
  let pending = fontCache.get(cacheKey)
  if (!pending) {
    pending = Promise.all(FONTS.map(async ([name, weight, file]) => ({ name, weight, style: 'normal' as const, data: await source.binary(`fonts/${file}`) })))
    fontCache.set(cacheKey, pending)
  }
  return pending
}

const IMAGE_TYPES = new Set(['image/png', 'image/jpeg', 'image/jpg'])
const MAX_IMAGE_BYTES = 4 * 1024 * 1024

/** A remote PNG or JPEG as a data URL, or undefined when it is missing, too large, or another format. */
export async function fetchImageDataUrl(url: string | undefined): Promise<string | undefined> {
  if (!url) return undefined
  try {
    const response = await fetch(url, { headers: { accept: 'image/png,image/jpeg' } })
    if (!response.ok) return undefined
    const type = (response.headers.get('content-type') ?? '').split(';')[0].trim().toLowerCase()
    if (!IMAGE_TYPES.has(type)) return undefined
    const bytes = await response.arrayBuffer()
    if (bytes.byteLength > MAX_IMAGE_BYTES) return undefined
    return `data:${type === 'image/jpg' ? 'image/jpeg' : type};base64,${base64(bytes)}`
  } catch {
    return undefined
  }
}

export async function loadCardAssets(
  source: AssetSource,
  background: 'dots-result.svg' | 'dots-side.svg',
  images: { photo?: string; avatar?: string } = {},
): Promise<CardAssets> {
  const [dots, lockup, photo, avatar] = await Promise.all([
    source.text(background),
    source.text('lockup.svg'),
    fetchImageDataUrl(images.photo),
    fetchImageDataUrl(images.avatar),
  ])
  return { background: svgDataUrl(dots), lockup: svgDataUrl(lockup), photo, avatar }
}

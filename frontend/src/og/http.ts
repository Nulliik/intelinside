/** The card id: `?id=10` on the function's own path, or the last segment of a pretty `/api/og/rigs/10.png` URL. */
export function cardId(url: URL): string {
  const raw = url.searchParams.get('id') ?? url.pathname.split('/').pop() ?? ''
  return raw.replace(/\.png$/i, '')
}

/** Cards are cached at the edge for a day; the `?v=updatedAt` in every link busts it after an edit. */
export const CARD_HEADERS = {
  'cache-control': 'public, max-age=300, s-maxage=86400, stale-while-revalidate=604800',
}

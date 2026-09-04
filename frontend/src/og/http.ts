/** The id from `/api/og/results/1042.png`, whether Vercel passes it as a query param or leaves it in the path. */
export function cardId(url: URL): string {
  const raw = url.searchParams.get('id') ?? url.pathname.split('/').pop() ?? ''
  return raw.replace(/\.png$/i, '')
}

/** Cards are cached at the edge for a day; the `?v=updatedAt` in every link busts it after an edit. */
export const CARD_HEADERS = {
  'cache-control': 'public, max-age=300, s-maxage=86400, stale-while-revalidate=604800',
}

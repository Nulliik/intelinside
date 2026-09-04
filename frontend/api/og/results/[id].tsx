// GET /api/og/results/:id.png — the 1200×630 card for a result, rendered at the edge from the public data.
import { ImageResponse } from '@vercel/og'
import { bundledAssets, httpAssets, loadCardAssets, loadFonts } from '../../../src/og/assets'
import { BUNDLED_OG_ASSETS } from '../../../src/og/bundled'
import { ResultCardImage } from '../../../src/og/cards'
import { loadResultCard, ogEnv } from '../../../src/og/data'
import { cardId, CARD_HEADERS } from '../../../src/og/http'

export const config = { runtime: 'edge' }

export default async function handler(request: Request): Promise<Response> {
  const url = new URL(request.url)
  const id = cardId(url)
  const started = Date.now()
  const env = ogEnv()
  if (!env) {
    console.error(`og result ${id}: Supabase env missing`)
    return new Response('Card rendering is not configured.', { status: 500 })
  }
  try {
    const data = await loadResultCard(id, env)
    if (!data) {
      console.log(`og result ${id}: not found`)
      return new Response('Not found', { status: 404, headers: { 'cache-control': 'public, max-age=60' } })
    }
    const source = bundledAssets(BUNDLED_OG_ASSETS, httpAssets(url.origin))
    const [fonts, assets] = await Promise.all([loadFonts(source), loadCardAssets(source, 'dots-result.svg', { avatar: data.owner.avatarUrl })])
    const response = new ImageResponse(<ResultCardImage data={data} assets={assets} />, { width: 1200, height: 630, fonts, headers: CARD_HEADERS })
    console.log(`og result ${id}: rendered in ${Date.now() - started} ms`)
    return response
  } catch (error) {
    console.error(`og result ${id}: ${error instanceof Error ? error.stack ?? error.message : String(error)}`)
    return new Response('Card rendering failed.', { status: 500 })
  }
}

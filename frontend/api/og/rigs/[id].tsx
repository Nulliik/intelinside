// GET /api/og/rigs/:id.png — the 1200×630 card for a rig; falls back to the no-photo layout when the photo is missing.
import { ImageResponse } from '@vercel/og'
import { bundledAssets, httpAssets, loadCardAssets, loadFonts } from '../../../src/og/assets'
import { BUNDLED_OG_ASSETS } from '../../../src/og/bundled'
import { RigCardImage } from '../../../src/og/cards'
import { loadRigCard, ogEnv } from '../../../src/og/data'
import { cardId, CARD_HEADERS } from '../../../src/og/http'

// A named GET export is the Web-standard signature on Vercel's Node runtime; a default export would be handed the
// legacy (req, res) pair instead of a Request.
export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url)
  const id = cardId(url)
  const started = Date.now()
  const env = ogEnv()
  if (!env) {
    console.error(`og rig ${id}: Supabase env missing`)
    return new Response('Card rendering is not configured.', { status: 500 })
  }
  try {
    const data = await loadRigCard(id, env)
    if (!data) {
      console.log(`og rig ${id}: not found`)
      return new Response('Not found', { status: 404, headers: { 'cache-control': 'public, max-age=60' } })
    }
    const source = bundledAssets(BUNDLED_OG_ASSETS, httpAssets(url.origin))
    const [fonts, assets] = await Promise.all([loadFonts(source), loadCardAssets(source, 'dots-side.svg', { photo: data.photoUrl, avatar: data.owner.avatarUrl })])
    const response = new ImageResponse(<RigCardImage data={data} assets={assets} />, { width: 1200, height: 630, fonts, headers: CARD_HEADERS })
    console.log(`og rig ${id}: rendered in ${Date.now() - started} ms${assets.photo ? ' with photo' : ''}`)
    return response
  } catch (error) {
    console.error(`og rig ${id}: ${error instanceof Error ? error.stack ?? error.message : String(error)}`)
    return new Response('Card rendering failed.', { status: 500 })
  }
}

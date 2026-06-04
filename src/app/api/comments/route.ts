import { NextRequest, NextResponse } from 'next/server'

// Extract media ID from an Instagram post URL
function extractMediaId(url: string): string | null {
  // Match /p/CODE/ or /reel/CODE/
  const match = url.match(/\/(p|reel|tv)\/([A-Za-z0-9_-]+)/)
  return match ? match[2] : null
}

// Convert shortcode to numeric media ID via oEmbed (no token needed)
async function getMediaIdFromShortcode(shortcode: string): Promise<string | null> {
  try {
    const oembedUrl = `https://graph.facebook.com/v19.0/instagram_oembed?url=https://www.instagram.com/p/${shortcode}/&access_token=${process.env.INSTAGRAM_TOKEN}`
    const res = await fetch(oembedUrl)
    const data = await res.json()
    // oEmbed doesn't return numeric ID; use search by URL approach instead
    if (data.error) return null
    return data.media_id ?? null
  } catch {
    return null
  }
}

async function fetchAllComments(mediaId: string, token: string) {
  const comments: Array<{ username: string; text: string; timestamp: string }> = []
  let url = `https://graph.facebook.com/v19.0/${mediaId}/comments?fields=username,text,timestamp&limit=100&access_token=${token}`

  while (url) {
    const res = await fetch(url)
    const data = await res.json()
    if (data.error) throw new Error(data.error.message)
    if (data.data) comments.push(...data.data)
    url = data.paging?.next ?? null
  }

  return comments
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const postUrl = searchParams.get('url')

  if (!postUrl) {
    return NextResponse.json({ error: 'URL del post requerida' }, { status: 400 })
  }

  const token = process.env.INSTAGRAM_TOKEN
  if (!token) {
    return NextResponse.json(
      { error: 'Token de Instagram no configurado. Configura INSTAGRAM_TOKEN en las variables de entorno de Vercel.' },
      { status: 503 }
    )
  }

  const shortcode = extractMediaId(postUrl)
  if (!shortcode) {
    return NextResponse.json({ error: 'No se pudo extraer el ID del post desde la URL' }, { status: 400 })
  }

  try {
    // First get the numeric media ID from the shortcode
    // We use the Business Discovery API: find media by permalink
    const igUserId = process.env.INSTAGRAM_USER_ID
    if (!igUserId) {
      return NextResponse.json(
        { error: 'INSTAGRAM_USER_ID no configurado en variables de entorno' },
        { status: 503 }
      )
    }

    // Search own media to find the post by shortcode
    const mediaSearchUrl = `https://graph.facebook.com/v19.0/${igUserId}/media?fields=id,shortcode,permalink&limit=50&access_token=${token}`
    const mediaRes = await fetch(mediaSearchUrl)
    const mediaData = await mediaRes.json()

    if (mediaData.error) {
      return NextResponse.json({ error: `Error de API: ${mediaData.error.message}` }, { status: 400 })
    }

    let mediaId: string | null = null

    // Try to find in first page
    for (const item of mediaData.data ?? []) {
      if (item.shortcode === shortcode || item.permalink?.includes(shortcode)) {
        mediaId = item.id
        break
      }
    }

    // If not found in first page, try next pages
    if (!mediaId) {
      let nextUrl = mediaData.paging?.next
      while (nextUrl && !mediaId) {
        const r = await fetch(nextUrl)
        const d = await r.json()
        for (const item of d.data ?? []) {
          if (item.shortcode === shortcode || item.permalink?.includes(shortcode)) {
            mediaId = item.id
            break
          }
        }
        nextUrl = d.paging?.next
      }
    }

    if (!mediaId) {
      return NextResponse.json(
        { error: 'Post no encontrado. Asegúrate de que el post pertenece a tu cuenta de Instagram Business.' },
        { status: 404 }
      )
    }

    const comments = await fetchAllComments(mediaId, token)

    return NextResponse.json({
      count: comments.length,
      comments: comments.map(c => ({
        username: c.username,
        text: c.text,
        timestamp: c.timestamp,
      })),
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error desconocido'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

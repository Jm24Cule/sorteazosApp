import { NextRequest, NextResponse } from 'next/server'

function extractShortcode(url: string): string | null {
  const match = url.match(/\/(p|reel|tv)\/([A-Za-z0-9_-]+)/)
  return match ? match[2] : null
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
  const userToken = searchParams.get('token')
  const userId = searchParams.get('user_id')

  if (!postUrl) {
    return NextResponse.json({ error: 'URL del post requerida' }, { status: 400 })
  }

  // Use user's token if provided, otherwise fall back to server token
  const token = userToken || process.env.INSTAGRAM_TOKEN
  const igUserId = userId || process.env.INSTAGRAM_USER_ID

  if (!token || token === 'pending') {
    return NextResponse.json(
      { error: 'No hay sesión activa. Conecta tu cuenta de Instagram primero.' },
      { status: 401 }
    )
  }

  const shortcode = extractShortcode(postUrl)
  if (!shortcode) {
    return NextResponse.json({ error: 'URL de post no válida' }, { status: 400 })
  }

  try {
    // Search user's media for the post
    const mediaSearchUrl = `https://graph.facebook.com/v19.0/${igUserId}/media?fields=id,shortcode,permalink&limit=50&access_token=${token}`
    const mediaRes = await fetch(mediaSearchUrl)
    const mediaData = await mediaRes.json()

    if (mediaData.error) {
      return NextResponse.json({ error: `Error de API: ${mediaData.error.message}` }, { status: 400 })
    }

    let mediaId: string | null = null

    for (const item of mediaData.data ?? []) {
      if (item.shortcode === shortcode || item.permalink?.includes(shortcode)) {
        mediaId = item.id
        break
      }
    }

    // Paginate if not found
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
        { error: 'Post no encontrado. Asegúrate de que el post pertenece a tu cuenta.' },
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

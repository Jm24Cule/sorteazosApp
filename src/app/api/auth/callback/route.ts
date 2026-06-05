import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const baseUrl = process.env.NEXT_PUBLIC_URL || 'https://sorteazos-app.vercel.app'
  const redirectUri = `${baseUrl}/api/auth/callback`

  const { searchParams } = new URL(req.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')

  if (error || !code) {
    return NextResponse.redirect(`${baseUrl}/sorteo?auth_error=cancelled`)
  }

  const appId = process.env.META_APP_ID
  const appSecret = process.env.META_APP_SECRET

  if (!appId || !appSecret) {
    return NextResponse.redirect(`${baseUrl}/sorteo?auth_error=config`)
  }

  try {
    // 1. Exchange code for short-lived token
    const tokenRes = await fetch('https://graph.facebook.com/v19.0/oauth/access_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: appId,
        client_secret: appSecret,
        redirect_uri: redirectUri,
        code,
      }),
    })
    const tokenData = await tokenRes.json()
    if (tokenData.error) throw new Error(tokenData.error.message)
    const shortToken = tokenData.access_token

    // 2. Exchange for long-lived token (60 days)
    const longRes = await fetch(
      `https://graph.facebook.com/v19.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${shortToken}`
    )
    const longData = await longRes.json()
    const longToken = longData.access_token || shortToken

    // 3. Get Facebook pages to find linked Instagram account
    const pagesRes = await fetch(
      `https://graph.facebook.com/v19.0/me/accounts?fields=id,name,instagram_business_account&access_token=${longToken}`
    )
    const pagesData = await pagesRes.json()

    let igUserId = ''
    let igToken = longToken

    if (pagesData.data && pagesData.data.length > 0) {
      for (const page of pagesData.data) {
        if (page.instagram_business_account) {
          igUserId = page.instagram_business_account.id
          const pageTokenRes = await fetch(
            `https://graph.facebook.com/v19.0/${page.id}?fields=access_token&access_token=${longToken}`
          )
          const pageTokenData = await pageTokenRes.json()
          if (pageTokenData.access_token) igToken = pageTokenData.access_token
          break
        }
      }
    }

    if (!igUserId) {
      const meRes = await fetch(
        `https://graph.facebook.com/v19.0/me?fields=id,name&access_token=${longToken}`
      )
      const meData = await meRes.json()
      igUserId = meData.id
    }

    // 4. Get Instagram profile info
    const profileRes = await fetch(
      `https://graph.facebook.com/v19.0/${igUserId}?fields=id,name,username,profile_picture_url&access_token=${igToken}`
    )
    const profile = await profileRes.json()

    // 5. Redirect to app with token and profile
    const params = new URLSearchParams({
      token: igToken,
      user_id: igUserId,
      username: profile.username || profile.name || 'usuario',
      name: profile.name || profile.username || 'Usuario',
      avatar: profile.profile_picture_url || '',
    })

    return NextResponse.redirect(`${baseUrl}/sorteo?${params.toString()}`)
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error desconocido'
    return NextResponse.redirect(`${baseUrl}/sorteo?auth_error=${encodeURIComponent(msg)}`)
  }
}

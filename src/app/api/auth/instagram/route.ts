import { NextResponse } from 'next/server'

export async function GET() {
  const appId = process.env.META_APP_ID
  const baseUrl = process.env.NEXT_PUBLIC_URL || 'https://sorteazos-app.vercel.app'
  const redirectUri = `${baseUrl}/api/auth/callback`

  if (!appId) {
    return NextResponse.json({ error: 'META_APP_ID no configurado' }, { status: 503 })
  }

  const scope = ['public_profile', 'email'].join(',')

  const url = new URL('https://www.facebook.com/v19.0/dialog/oauth')
  url.searchParams.set('client_id', appId)
  url.searchParams.set('redirect_uri', redirectUri)
  url.searchParams.set('scope', scope)
  url.searchParams.set('response_type', 'code')
  url.searchParams.set('state', 'sorteazos')

  return NextResponse.redirect(url.toString())
}

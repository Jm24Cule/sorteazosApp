import { NextResponse } from 'next/server'

export async function GET() {
  const appId = process.env.META_APP_ID
  const redirectUri = process.env.NEXT_PUBLIC_URL
    ? `${process.env.NEXT_PUBLIC_URL}/auth/callback`
    : 'https://sorteazos-app.vercel.app/auth/callback'

  if (!appId) {
    return NextResponse.json({ error: 'META_APP_ID no configurado' }, { status: 503 })
  }

  const scope = [
    'instagram_basic',
    'instagram_manage_comments',
    'pages_show_list',
    'pages_read_engagement',
  ].join(',')

  const url = new URL('https://www.facebook.com/v19.0/dialog/oauth')
  url.searchParams.set('client_id', appId)
  url.searchParams.set('redirect_uri', redirectUri)
  url.searchParams.set('scope', scope)
  url.searchParams.set('response_type', 'code')
  url.searchParams.set('state', 'sorteazos')

  return NextResponse.redirect(url.toString())
}

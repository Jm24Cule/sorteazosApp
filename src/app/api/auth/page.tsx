'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function CallbackHandler() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    // Forward all params to our API callback handler
    const code = searchParams.get('code')
    const error = searchParams.get('error')

    if (code) {
      // Redirect to API route with code
      window.location.href = `/api/auth/callback?code=${code}&state=${searchParams.get('state') || ''}`
    } else if (error) {
      router.replace('/sorteo?auth_error=cancelled')
    } else {
      router.replace('/sorteo')
    }
  }, [searchParams, router])

  return (
    <div style={{
      minHeight: '100vh',
      background: '#1c1c1e',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column',
      gap: '16px',
      fontFamily: 'Syne, sans-serif',
    }}>
      <div style={{
        width: 48, height: 48, borderRadius: '50%',
        border: '3px solid #f97316',
        borderTopColor: 'transparent',
        animation: 'spin 0.8s linear infinite',
      }} />
      <p style={{ color: '#71717a', fontSize: 14 }}>Conectando con Instagram...</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', background: '#1c1c1e' }} />
    }>
      <CallbackHandler />
    </Suspense>
  )
}

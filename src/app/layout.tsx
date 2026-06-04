import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Sorteazos — Sorteos de Instagram gratis',
  description: 'Herramienta gratuita para hacer sorteos en Instagram. Sin registro, sin límites, sin suscripción.',
  icons: {
    icon: '/logo.svg',
    apple: '/logo.svg',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  )
}

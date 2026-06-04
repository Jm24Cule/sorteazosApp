import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Sorteazos',
  description: 'Sorteazos — Herramienta de sorteos para Instagram de La Ñañá de Nala',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  )
}

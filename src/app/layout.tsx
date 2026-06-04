import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Sorteo Instagram',
  description: 'Herramienta de sorteos para Instagram — La Ñañá de Nala',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  )
}

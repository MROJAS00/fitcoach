import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'FitCoach',
  description: 'Gestión de entrenamiento personal',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="h-full">
      <body className="min-h-full bg-[#0f0f0f] text-[#f0f0f0]">{children}</body>
    </html>
  )
}

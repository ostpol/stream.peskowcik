import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Pěskowčik – Stream Now!',
  description: 'Sorbischsprachige Sandmännchen-Folgen streamen',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="de">
      <body>{children}</body>
    </html>
  )
}


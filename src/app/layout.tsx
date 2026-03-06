import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Converse AI — Experience Shop',
  description: 'Per-intent AI routing for banking IVR',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}

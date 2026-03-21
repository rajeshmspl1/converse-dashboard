import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'AI IVR for E-Commerce — AiIVRs | Orders, Returns, Refunds by AI',
  description: 'Order tracking in 5 seconds. Returns and refunds automated. Scales during sales peaks. 80% containment. PCI DSS ready. $0.006/intent.',
  alternates: { canonical: '/industries/ecommerce' },
  openGraph: {
    title: 'AI IVR for E-Commerce — AiIVRs',
    description: 'Order tracking, returns, refunds by AI. 80% containment. Scales during sales. $0.006/intent.',
    url: 'https://aiivrs.com/industries/ecommerce',
    type: 'website',
  },
  twitter: { card: 'summary', title: 'AI IVR for E-Commerce — AiIVRs', description: 'E-commerce calls resolved by AI. Scales infinitely.' },
}

export default function EcommerceLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

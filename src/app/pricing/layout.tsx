import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Pricing — AiIVRs | Per-Intent AI IVR Pricing from $0.006',
  description: 'Pay per resolved intent, not per minute. 4 journey pricing models from $0.006. Disconnects cost zero. Free migration + 3-month pilot. No minimums.',
  alternates: { canonical: '/pricing' },
  openGraph: {
    title: 'Pricing — AiIVRs | Per-Intent AI IVR from $0.006',
    description: '4 pricing models from $0.006/intent. Disconnects free. Sales leads free. Commission only on conversions.',
    url: 'https://aiivrs.com/pricing',
    type: 'website',
  },
  twitter: { card: 'summary', title: 'AiIVRs Pricing', description: 'Per-intent AI IVR pricing from $0.006. 4 journey models.' },
}

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

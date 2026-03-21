import type { Metadata } from 'next'
export const metadata: Metadata = {
  title: 'AiIVRs vs PolyAI — 17 Minutes vs 3-6 Months | Voice AI Comparison 2026',
  description: 'PolyAI: $150K+/year, 3-6 month deployment, custom contracts. AiIVRs: $0.006/intent, 17 minutes, no minimum. Compare features, pricing, compliance.',
  alternates: { canonical: '/compare/polyai' },
  openGraph: { title: 'AiIVRs vs PolyAI — Full Comparison', description: '$0.006/intent vs $150K+/year. 17 minutes vs 3-6 months. Complete comparison.', url: 'https://aiivrs.com/compare/polyai', type: 'website' },
  twitter: { card: 'summary', title: 'AiIVRs vs PolyAI', description: '17 minutes vs 3-6 months. Complete comparison.' },
}
export default function PolyaiLayout({ children }: { children: React.ReactNode }) { return <>{children}</> }

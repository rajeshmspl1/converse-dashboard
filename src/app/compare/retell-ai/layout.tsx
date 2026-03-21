import type { Metadata } from 'next'
export const metadata: Metadata = {
  title: 'AiIVRs vs Retell AI — Per-Intent vs Per-Minute Voice AI Comparison 2026',
  description: 'Retell AI charges $0.07/min. AiIVRs charges $0.006/intent. Compare pricing, features, setup time, CRM routing, frustration detection, and Indian language support.',
  alternates: { canonical: '/compare/retell-ai' },
  openGraph: { title: 'AiIVRs vs Retell AI — Full Comparison', description: 'Per-intent ($0.006) vs per-minute ($0.07). 17 minutes vs days. CRM routing vs not available.', url: 'https://aiivrs.com/compare/retell-ai', type: 'website' },
  twitter: { card: 'summary', title: 'AiIVRs vs Retell AI', description: 'Per-intent pricing vs per-minute. Complete comparison.' },
}
export default function RetellLayout({ children }: { children: React.ReactNode }) { return <>{children}</> }

import type { Metadata } from 'next'
export const metadata: Metadata = {
  title: 'Compare — AiIVRs vs Retell AI, VAPI, PolyAI | Honest Voice AI Comparison',
  description: 'Transparent comparison of AiIVRs vs Retell AI, VAPI, and PolyAI. Per-intent pricing vs per-minute. 17-minute setup vs months. See where we win and where they are strong.',
  alternates: { canonical: '/compare' },
  openGraph: { title: 'Compare Voice AI Platforms — AiIVRs', description: 'AiIVRs vs Retell AI, VAPI, PolyAI. Honest, transparent comparison.', url: 'https://aiivrs.com/compare', type: 'website' },
  twitter: { card: 'summary', title: 'Compare — AiIVRs vs Competitors', description: 'Honest voice AI platform comparison.' },
}
export default function CompareLayout({ children }: { children: React.ReactNode }) { return <>{children}</> }

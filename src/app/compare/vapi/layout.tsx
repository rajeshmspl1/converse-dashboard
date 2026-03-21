import type { Metadata } from 'next'
export const metadata: Metadata = {
  title: 'AiIVRs vs VAPI — Zero Integration vs API-First Voice AI 2026',
  description: 'VAPI charges $0.05-$0.33/min plus STT fees plus platform fees. AiIVRs includes everything in $0.006/intent. No API needed. 17 minutes to production.',
  alternates: { canonical: '/compare/vapi' },
  openGraph: { title: 'AiIVRs vs VAPI — Full Comparison', description: 'All-inclusive $0.006/intent vs $0.05-$0.33/min + hidden fees. Zero code vs API-first.', url: 'https://aiivrs.com/compare/vapi', type: 'website' },
  twitter: { card: 'summary', title: 'AiIVRs vs VAPI', description: 'Zero integration vs API-first. Complete comparison.' },
}
export default function VapiLayout({ children }: { children: React.ReactNode }) { return <>{children}</> }

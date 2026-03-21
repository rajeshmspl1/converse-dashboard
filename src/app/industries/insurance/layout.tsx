import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'AI IVR for Insurance — AiIVRs | Claims, Renewals, Quotes by AI',
  description: 'AI handles claim status, policy renewals, premium payments, new quotes. 78% containment. IRDAI compliant. Per-intent from $0.006. 17 min to go live.',
  alternates: { canonical: '/industries/insurance' },
  openGraph: {
    title: 'AI IVR for Insurance — AiIVRs',
    description: 'Claims, renewals, quotes resolved by AI. 78% containment. IRDAI compliant. $0.006/intent.',
    url: 'https://aiivrs.com/industries/insurance',
    type: 'website',
  },
  twitter: { card: 'summary', title: 'AI IVR for Insurance — AiIVRs', description: 'Insurance claims and renewals resolved by AI.' },
}

export default function InsuranceLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

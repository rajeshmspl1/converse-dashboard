import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'AI IVR for Telecom — AiIVRs | Plans, Billing, SIM at Scale',
  description: 'Handle millions of telecom calls with AI. Plan upgrades, billing, SIM replacement, recharges. 85% containment. $0.006/intent. Scales infinitely.',
  alternates: { canonical: '/industries/telecom' },
  openGraph: {
    title: 'AI IVR for Telecom — AiIVRs',
    description: 'Millions of calls. 85% containment. Plan upgrades, billing, SIM. $0.006/intent. Infinite scale.',
    url: 'https://aiivrs.com/industries/telecom',
    type: 'website',
  },
  twitter: { card: 'summary', title: 'AI IVR for Telecom — AiIVRs', description: 'Telecom IVR replaced by AI. 85% containment at scale.' },
}

export default function TelecomLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

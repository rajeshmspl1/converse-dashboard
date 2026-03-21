import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'AI IVR for Banking — AiIVRs | Balance, Card Block, Loan EMI in 5 Seconds',
  description: 'Replace your banking IVR with AI. Balance checks in 5 seconds. Card blocking instant. 82% containment. RBI compliant. Per-intent from $0.006. 17 min setup.',
  alternates: { canonical: '/industries/banking' },
  openGraph: {
    title: 'AI IVR for Banking — AiIVRs',
    description: 'Balance checks in 5 seconds. Card blocking instant. 82% containment. RBI compliant. $0.006/intent.',
    url: 'https://aiivrs.com/industries/banking',
    type: 'website',
  },
  twitter: { card: 'summary', title: 'AI IVR for Banking — AiIVRs', description: 'Banking IVR replaced by AI. 5-second resolution. $0.006/intent.' },
}

export default function BankingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

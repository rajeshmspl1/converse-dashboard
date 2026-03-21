import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'FAQ — AiIVRs | 44 Questions About AI IVR Migration Answered',
  description: 'How does AiIVRs convert your IVR in 17 minutes? What is per-intent pricing? Do I need IT? 44 questions answered for CX managers, CFOs, and IT heads.',
  alternates: { canonical: '/faq' },
  openGraph: {
    title: 'FAQ — AiIVRs | AI IVR Migration Questions Answered',
    description: 'How does AiIVRs convert your IVR in 17 minutes? What is per-intent pricing? 44 questions answered.',
    url: 'https://aiivrs.com/faq',
    type: 'website',
  },
  twitter: { card: 'summary', title: 'FAQ — AiIVRs', description: '44 questions about AI IVR migration answered.' },
}

export default function FaqLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

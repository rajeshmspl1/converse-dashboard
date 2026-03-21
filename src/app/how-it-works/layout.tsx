import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'How It Works — AiIVRs | IVR to AI IVR in 17 Minutes',
  description: 'Step-by-step: share your IVR number, hear AI live in 5 minutes, validate flows, go live at 17 minutes. Zero integration. No IT team needed.',
  alternates: { canonical: '/how-it-works' },
  openGraph: {
    title: 'How AiIVRs Works — IVR to AI in 17 Minutes',
    description: 'Share your IVR number. Hear AI in 5 min. Go live at 17 min. No integration. No IT.',
    url: 'https://aiivrs.com/how-it-works',
    type: 'website',
  },
  twitter: { card: 'summary', title: 'How AiIVRs Works', description: 'IVR to AI IVR in 17 minutes. Zero integration.' },
}

export default function HowItWorksLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

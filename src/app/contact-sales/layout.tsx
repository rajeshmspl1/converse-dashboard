import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Contact Sales — AiIVRs | Book a 15-Minute AI IVR Demo',
  description: 'Book a 15-minute demo. We show AiIVRs live on YOUR IVR number. No slides. No prep. Just a real AI call handling real customer intents.',
  alternates: { canonical: '/contact-sales' },
  openGraph: {
    title: 'Book a Demo — AiIVRs | 15-Minute Live AI IVR Demo',
    description: 'Live demo on your IVR number. 15 minutes. No slides. No prep.',
    url: 'https://aiivrs.com/contact-sales',
    type: 'website',
  },
  twitter: { card: 'summary', title: 'Book a Demo — AiIVRs', description: 'Live AI IVR demo on your own number. 15 minutes.' },
}

export default function ContactSalesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

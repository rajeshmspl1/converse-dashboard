import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'AI IVR for Hospitality — AiIVRs | Bookings, Room Service, Concierge',
  description: 'Room bookings, check-in, room service, concierge — all by AI. 59 languages for international guests. 76% containment. GDPR compliant. $0.006/intent.',
  alternates: { canonical: '/industries/hospitality' },
  openGraph: {
    title: 'AI IVR for Hospitality — AiIVRs',
    description: 'Bookings, room service, concierge by AI. 59 languages. GDPR compliant. $0.006/intent.',
    url: 'https://aiivrs.com/industries/hospitality',
    type: 'website',
  },
  twitter: { card: 'summary', title: 'AI IVR for Hospitality — AiIVRs', description: 'Hotel guest calls handled by AI. 59 languages.' },
}

export default function HospitalityLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

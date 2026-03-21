import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'AI IVR for Healthcare — AiIVRs | Appointments, Prescriptions, Lab Results',
  description: 'HIPAA compliant AI IVR. Appointment booking in 10 seconds. Prescription refills. Lab results. 75% containment. Frustration detection. 59 languages.',
  alternates: { canonical: '/industries/healthcare' },
  openGraph: {
    title: 'AI IVR for Healthcare — AiIVRs',
    description: 'HIPAA compliant. Appointments in 10 seconds. 75% containment. Frustration detection. $0.006/intent.',
    url: 'https://aiivrs.com/industries/healthcare',
    type: 'website',
  },
  twitter: { card: 'summary', title: 'AI IVR for Healthcare — AiIVRs', description: 'HIPAA compliant AI IVR for patient calls.' },
}

export default function HealthcareLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

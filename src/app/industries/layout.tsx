import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Industries — AiIVRs | AI IVR for Banking, Insurance, Healthcare, Telecom',
  description: 'AI IVR solutions for 6 industries. Banking, insurance, healthcare, telecom, e-commerce, hospitality. Per-intent pricing. 59 languages. Live demos.',
  alternates: { canonical: '/industries' },
  openGraph: {
    title: 'Industries — AiIVRs | AI IVR by Industry',
    description: 'AI IVR for banking, insurance, healthcare, telecom, e-commerce, hospitality. Live demos available.',
    url: 'https://aiivrs.com/industries',
    type: 'website',
  },
  twitter: { card: 'summary', title: 'AiIVRs Industries', description: 'AI IVR solutions for 6 industries.' },
}

export default function IndustriesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

import type { Metadata, Viewport } from 'next'
import './globals.css'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#080D18',
}

export const metadata: Metadata = {
  title: 'AiIVRs — Transform your IVR to AI IVR in 17 minutes',
  description: 'Transform your IVR to AI IVR in 17 minutes. No IT team. No integration. No data needed. Per-intent pricing from $0.006. Free migration with 3-month production pilot.',

  // Canonical
  metadataBase: new URL('https://aiivrs.com'),
  alternates: { canonical: '/' },

  // Robots
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-snippet': -1, 'max-image-preview': 'large' as const },
  },

  // Open Graph
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://aiivrs.com',
    siteName: 'AiIVRs',
    title: 'AiIVRs — Transform your IVR to AI IVR in 17 minutes. No IT.',
    description: 'No IT team. No approval. No integration. Per-intent pricing from $0.006. Free migration. 3-month production pilot in your environment. 59 languages. Zero vendor lock-in.',
    images: [{
      url: '/aiivrs-logo-dark.svg',
      width: 200,
      height: 65,
      alt: 'AiIVRs — Zero Integration AI IVR Platform',
    }],
  },

  // Twitter Card
  twitter: {
    card: 'summary_large_image',
    title: 'AiIVRs — Transform your IVR to AI IVR in 17 minutes',
    description: 'No IT. No integration. Per-intent pricing from $0.006. Free migration. 3-month pilot.',
    images: ['/aiivrs-logo-dark.svg'],
  },

  // Icons
  icons: {
    icon: '/logo.svg',
    shortcut: '/logo.svg',
    apple: '/logo.svg',
  },

  // Keywords (minor SEO signal but helps GEO)
  keywords: [
    'AI IVR', 'voice AI platform', 'IVR replacement', 'AI contact center',
    'per-intent pricing', 'zero integration IVR', 'conversational IVR',
    'AI voice agent', 'IVR migration', 'AI customer service voice',
    'replace IVR with AI', 'voice AI for banking', 'voice AI for insurance',
    'multilingual AI IVR', 'CRM voice routing', 'frustration detection AI',
  ],

  // App identity
  applicationName: 'AiIVRs',
  category: 'technology',
  creator: 'AiIVRs',
  publisher: 'AiIVRs',
}

// JSON-LD Schemas for GEO (ChatGPT, Perplexity, Google AI Overview)
const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'AiIVRs',
  url: 'https://aiivrs.com',
  logo: 'https://aiivrs.com/aiivrs-logo-dark.svg',
  description: 'AiIVRs is an AI-powered IVR replacement platform that lets contact centers go live in 17 minutes with zero integration, per-intent pricing starting at $0.006, and 59 language support.',
  sameAs: [],
  contactPoint: {
    '@type': 'ContactPoint',
    contactType: 'sales',
    url: 'https://aiivrs.com/contact-sales',
  },
}

const productSchema = {
  '@context': 'https://schema.org',
  '@type': 'Product',
  name: 'AiIVRs AI IVR Platform',
  description: 'Transform your IVR to AI IVR in 17 minutes. No IT team. No integration. Per-intent pricing. 59 languages. Zero vendor lock-in.',
  brand: { '@type': 'Brand', name: 'AiIVRs' },
  url: 'https://aiivrs.com',
  image: 'https://aiivrs.com/aiivrs-logo-dark.svg',
  offers: {
    '@type': 'AggregateOffer',
    priceCurrency: 'USD',
    lowPrice: '0.006',
    highPrice: '0.045',
    offerCount: 5,
    offers: [
      { '@type': 'Offer', name: 'Essential', price: '0.006', priceCurrency: 'USD', description: 'Azure STT + GPT-4o-mini + Azure TTS. ~900ms latency.' },
      { '@type': 'Offer', name: 'Sarvam', price: '0.006', priceCurrency: 'USD', description: 'Sarvam + GPT-4o-mini + Sarvam. Optimized for Indian languages. ~800ms.' },
      { '@type': 'Offer', name: 'Gemini', price: '0.013', priceCurrency: 'USD', description: 'Gemini 2.5 Flash end-to-end. Best value. ~300ms.' },
      { '@type': 'Offer', name: 'Conversational', price: '0.018', priceCurrency: 'USD', description: 'GPT-4o Realtime end-to-end. Natural conversation. ~300ms.' },
      { '@type': 'Offer', name: 'Ultra', price: '0.045', priceCurrency: 'USD', description: 'ElevenLabs + GPT-4o-mini + Azure STT. Human-like warmth. ~700ms.' },
    ],
  },
}

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    { '@type': 'Question', name: 'How does AiIVRs convert my IVR in 17 minutes?', acceptedAnswer: { '@type': 'Answer', text: 'AiIVRs uses proprietary overlay technology. You provide your IVR phone number — no data extraction, no integration, no IT team needed. AI goes live on real customer calls in 17 minutes.' } },
    { '@type': 'Question', name: 'What is per-intent pricing?', acceptedAnswer: { '@type': 'Answer', text: 'You pay $0.006–$0.045 per resolved customer intent. A customer who disconnects early or whose intent is not resolved costs zero. Traditional IVR bills $0.07–$0.10/min regardless.' } },
    { '@type': 'Question', name: 'Do I need my IT team?', acceptedAnswer: { '@type': 'Answer', text: 'No. AiIVRs requires zero integration, zero API changes, and zero IT involvement. Your CX team manages everything — no developers needed.' } },
    { '@type': 'Question', name: 'How many languages does AiIVRs support?', acceptedAnswer: { '@type': 'Answer', text: '59 languages globally, including 10 Indian languages. Language is auto-detected per call — no configuration needed.' } },
    { '@type': 'Question', name: 'Does my existing IVR stay live?', acceptedAnswer: { '@type': 'Answer', text: 'Yes. AiIVRs operates alongside your existing IVR. Zero downtime. Roll back instantly anytime with one click.' } },
    { '@type': 'Question', name: 'What is Sales Discovery?', acceptedAnswer: { '@type': 'Answer', text: 'After resolving the customer support intent, AiIVRs surfaces one contextual offer from your CRM. Same per-intent price. Sales leads are free. AiIVRs earns commission only when a lead converts.' } },
    { '@type': 'Question', name: 'How does frustration detection work?', acceptedAnswer: { '@type': 'Answer', text: 'AI analyzes voice tone, speech patterns, and language cues in real-time. When frustration is detected, the AI switches to a more empathetic model within 3 seconds — no transfer, no hold music.' } },
    { '@type': 'Question', name: 'Where is my data stored?', acceptedAnswer: { '@type': 'Answer', text: 'You choose: shared cloud, dedicated cloud, or on-premise. Available regions: India, UAE, EU, US, Singapore. Voice data never leaves your chosen region.' } },
  ],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* Preconnect for performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />

        {/* JSON-LD Schemas — GEO: ChatGPT, Perplexity, Google AI Overview */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
      </head>
      <body>{children}</body>
    </html>
  )
}

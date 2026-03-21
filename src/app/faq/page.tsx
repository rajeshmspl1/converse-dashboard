'use client'
import StaticPageShell from '@/components/layout/StaticPageShell'

const FAQS: { cat: string; qs: { q: string; a: string }[] }[] = [
  {
    cat: 'How is this possible?',
    qs: [
      { q: 'How do you convert my IVR with just a phone number?', a: 'This is our proprietary technology. Book a 15-minute demo and we\'ll show you live on your own IVR number. No prep needed.' },
      { q: 'How does AiIVRs work without any integration?', a: 'Contact us — book a 15-min demo. We\'ll demonstrate the zero-integration approach live on your IVR.' },
      { q: 'How do you handle my IVR tree without access to my systems?', a: 'Our proprietary overlay technology handles this. Book a demo to see it in action on your own number.' },
      { q: 'How is 17 minutes possible when other vendors take months?', a: 'Our architecture eliminates the integration phase entirely. Book a 15-min demo — we\'ll prove it live.' },
      { q: 'What\'s the secret behind zero-integration migration?', a: 'This is proprietary. The best way to understand it is to see it. Book a 15-minute demo.' },
    ],
  },
  {
    cat: 'Pricing & billing',
    qs: [
      { q: 'What counts as a resolved intent?', a: 'A customer asks for something (balance check, card block, etc.) and the AI successfully completes it. If the AI can\'t resolve, you\'re credited back.' },
      { q: 'What if the customer disconnects early?', a: 'Zero cost. You only pay for resolved intents. Hang-ups, idle time, hold time — all free.' },
      { q: 'How much does it cost per intent?', a: '$0.006 to $0.018 depending on the journey and AI tier. Lower Cost is $0.006, Value Routing ranges from $0.006 (Bronze) to $0.018 (Gold).' },
      { q: 'Is there a minimum commitment?', a: 'No. Start with 1 IVR number. Scale when ready. Cancel anytime. No contracts.' },
      { q: 'What\'s included in the per-intent price?', a: 'Everything: speech-to-text, LLM processing, text-to-speech, infrastructure, recording, analytics. No hidden fees.' },
      { q: 'How does billing work?', a: 'Pay-as-you-go. Billed per resolved intent. Monthly invoice. No upfront fees.' },
      { q: 'How does Sales Discovery pricing work?', a: 'Sales Discovery is free to activate. Same per-intent pricing as AI IVR. AiIVRs earns a commission only when a lead converts to an actual sale. Zero risk to you.' },
      { q: 'What commission does AiIVRs take on Sales Discovery?', a: 'Commission rates are customized per deployment. Typically 5-15% of the sale value, only on confirmed conversions.' },
      { q: 'Can I start with AI IVR and add Sales Discovery later?', a: 'Yes. Activate Sales Discovery anytime with one click. No migration needed.' },
    ],
  },
  {
    cat: 'CSAT & customer experience',
    qs: [
      { q: 'How does AiIVRs improve CSAT from 3.0 to 4.5?', a: 'Three things: faster resolution (5 seconds vs 2.5 min), frustration detection with instant recovery, and personalized interactions via CRM. Measurable per call.' },
      { q: 'How does frustration detection work?', a: 'AI analyzes voice tone, speech patterns, and language cues in real-time. When frustration is detected, the AI switches to a more empathetic model within 3 seconds.' },
      { q: 'Won\'t upselling during support annoy my customers?', a: 'AiIVRs resolves the support intent FIRST, always. Then surfaces ONE contextual offer. Customer declines = AI never pushes.' },
      { q: 'Can I measure CSAT per call?', a: 'Yes. Every call gets a CSAT score based on resolution speed, sentiment analysis, containment, and optional post-call feedback.' },
      { q: 'What is the containment rate?', a: 'Industry average is 25-30%. AiIVRs targets 80%+ containment — meaning 80% of callers resolve without a human agent.' },
      { q: 'Does the AI sound robotic?', a: 'No. Ultra tier uses ElevenLabs for human-like warmth. Gemini uses native voice. You choose the quality tier.' },
    ],
  },
  {
    cat: 'Languages',
    qs: [
      { q: 'How many languages does AiIVRs support?', a: '59 languages globally, including 10 Indian languages: Hindi, Tamil, Telugu, Kannada, Bengali, Marathi, Gujarati, Malayalam, Punjabi, and Odia.' },
      { q: 'How does language detection work?', a: 'Auto-detected per call. The caller speaks — AI detects within the first few words and responds in the same language.' },
      { q: 'Can the AI handle code-mixing (Hinglish, Tanglish)?', a: 'Yes. Sarvam models handle code-mixed speech natively.' },
      { q: 'Do I pay more for non-English languages?', a: 'No. Same per-intent pricing across all 59 languages.' },
    ],
  },
  {
    cat: 'Data sovereignty & security',
    qs: [
      { q: 'Where is my customer data stored?', a: 'You choose: shared cloud, dedicated cloud, or on-premise. Available regions: India, UAE, EU, US, Singapore.' },
      { q: 'Is AiIVRs HIPAA compliant?', a: 'Yes. Dedicated and on-premise tiers support HIPAA, SOC2, and ISO 27001 compliance.' },
      { q: 'Can I run AiIVRs on my own servers?', a: 'Yes. On-premise deployment available. Your data center, your hardware. AiIVRs runs as Docker containers.' },
      { q: 'Who owns the call recordings?', a: 'You do. All recordings, transcripts, and analytics data belong to you. Exportable anytime.' },
    ],
  },
  {
    cat: 'Setup & migration',
    qs: [
      { q: 'How long does it really take to go live?', a: '17 minutes from IVR number to live AI. Not a POC — live on real calls.' },
      { q: 'Does my existing IVR stay live during migration?', a: 'Yes. Your IVR runs unchanged. AiIVRs operates alongside it. Roll back instantly anytime.' },
      { q: 'Do I need my IT team?', a: 'No. Your CX team manages everything. No developers, no IT tickets, no approval cycles.' },
      { q: 'What do I need to provide?', a: 'Your IVR phone number. That\'s it.' },
      { q: 'Can I run a pilot before going fully live?', a: 'Yes. Free pilot for up to 3 months. Full monitoring and analytics before scaling.' },
    ],
  },
  {
    cat: 'Technical / IT',
    qs: [
      { q: 'Can I bring my own carrier?', a: 'Yes. BYO carrier, cloud, LLM, CCaaS, CRM, and telephony. No vendor lock-in.' },
      { q: 'Can I bring my own LLM?', a: 'Yes. OpenAI, Anthropic, Google, Sarvam, or any LLM with an API. Switch models per intent.' },
      { q: 'What is the latency?', a: 'Essential: ~900ms. Gemini: ~300ms. Conversational: ~300ms. Ultra: ~700ms.' },
      { q: 'Is there an API?', a: 'Yes. Full REST API for intent management, analytics, call logs. WebSocket for real-time events.' },
      { q: 'How does agent handoff work?', a: 'AI confidence drops below threshold → call transfers with full context. Zero dead air.' },
    ],
  },
  {
    cat: 'Sales Discovery',
    qs: [
      { q: 'What is Sales Discovery?', a: 'After resolving support, AiIVRs surfaces one contextual upsell offer from your CRM. Resolve first, offer second — always.' },
      { q: 'How does it use my CRM data?', a: 'Reads your CRM in real-time during the call. Your data stays in your CRM — nothing extracted.' },
      { q: 'What if the customer declines?', a: 'AI never pushes. One offer, one chance. Customer says no = conversation ends naturally.' },
      { q: 'What CRMs are supported?', a: 'Salesforce, HubSpot, Zoho, and any CRM with a REST API.' },
      { q: 'Can I control which products are offered?', a: 'Yes. Configure offer rules in the dashboard: products, segments, intents, blackout periods.' },
    ],
  },
]

export default function FAQPage() {
  const allQs = FAQS.flatMap(cat => cat.qs)

  return (
    <StaticPageShell>
      {/* Hero */}
      <section className="text-center px-4 sm:px-6 pt-16 pb-8">
        <div className="text-[11px] font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--tx3, #6b84a8)' }}>
          {allQs.length} questions answered
        </div>
        <h1 className="text-[28px] sm:text-[40px] font-black tracking-tight mb-3" style={{ letterSpacing: '-1px' }}>
          Frequently asked questions
        </h1>
        <p className="text-[14px] sm:text-[16px] mx-auto leading-relaxed" style={{ color: 'var(--tx2, #7a90b5)', maxWidth: 560 }}>
          Everything CX managers, CFOs, and IT heads ask about AiIVRs — answered.
        </p>
      </section>

      {/* Questions */}
      <div className="max-w-[800px] mx-auto px-4 sm:px-6 pb-16">
        {FAQS.map((cat, ci) => (
          <section key={ci} className="mb-10">
            <h2 className="text-[16px] sm:text-[18px] font-bold mb-4 pb-2 border-b" style={{ borderColor: 'var(--b1, #1c2d45)' }}>
              {cat.cat}
            </h2>
            {cat.qs.map((faq, qi) => (
              <div key={qi} className="py-3.5 border-b" style={{ borderColor: 'rgba(28,45,69,.4)' }}>
                <h3 className="text-[12px] sm:text-[13px] font-bold mb-1.5">{faq.q}</h3>
                <p className="text-[10px] sm:text-[11px] leading-relaxed" style={{ color: 'var(--tx3, #6b84a8)' }}>{faq.a}</p>
              </div>
            ))}
          </section>
        ))}

        {/* CTA */}
        <div className="text-center p-8 sm:p-10 rounded-2xl border mt-8"
          style={{ background: 'linear-gradient(135deg, rgba(59,130,246,.06), rgba(6,182,212,.04))', borderColor: 'rgba(59,130,246,.1)' }}>
          <h2 className="text-[18px] sm:text-[22px] font-bold mb-2">Still have questions?</h2>
          <p className="text-[12px] sm:text-[13px] mb-5" style={{ color: 'var(--tx3)' }}>Book a 15-minute demo. We&apos;ll answer everything live on your own IVR number.</p>
          <a href="/contact-sales" className="inline-block px-8 py-3 rounded-[10px] text-[14px] font-bold no-underline" style={{ background: '#00c9b1', color: '#000' }}>
            Book a Demo →
          </a>
        </div>
      </div>

      {/* JSON-LD */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org', '@type': 'FAQPage',
        mainEntity: allQs.map(faq => ({ '@type': 'Question', name: faq.q, acceptedAnswer: { '@type': 'Answer', text: faq.a } })),
      })}} />
    </StaticPageShell>
  )
}

import CompareTemplate from '@/components/compare/CompareTemplate'
export default function PolyaiPage() {
  return <CompareTemplate
    competitor="PolyAI" logo="P" tagline="Enterprise managed service · Custom contracts"
    headline="AiIVRs vs PolyAI — 17 minutes vs 3-6 months"
    subheadline="PolyAI takes 3-6 months and $150K+ per year with opaque pricing. AiIVRs goes live in 17 minutes at $0.006/intent. No contracts. No minimums. Cancel anytime."
    comparison={[
      { feature: 'Deployment time', aiivrs: '17 minutes', them: '3-6 months', winner: 'aiivrs' },
      { feature: 'Pricing model', aiivrs: 'Per intent ($0.006), transparent', them: 'Custom contract, opaque', winner: 'aiivrs' },
      { feature: 'Annual cost', aiivrs: 'Pay-as-you-go from $72/year', them: '$150,000+/year', winner: 'aiivrs' },
      { feature: 'Pricing transparency', aiivrs: 'Public, on website', them: 'Requires sales conversation', winner: 'aiivrs' },
      { feature: 'Integration', aiivrs: 'Zero — no code needed', them: 'Deep backend integration required', winner: 'aiivrs' },
      { feature: 'Technical requirement', aiivrs: '100% non-developer, non-technical', them: 'Project team + vendor team required', winner: 'aiivrs' },
      { feature: 'Minimum commitment', aiivrs: 'None — cancel anytime', them: 'Annual contract required', winner: 'aiivrs' },
      { feature: 'Sales Discovery', aiivrs: '$0.006/intent + commission only on conversion', them: 'Not available', winner: 'aiivrs' },
      { feature: 'CRM value routing', aiivrs: '4 automatic journey modes', them: 'Custom built per deployment', winner: 'aiivrs' },
      { feature: 'Frustration detection', aiivrs: 'Real-time + 3-second AI hot-swap', them: 'Basic sentiment analysis', winner: 'aiivrs' },
      { feature: 'Languages', aiivrs: '59 auto-detected per call', them: 'Custom multilingual build required', winner: 'aiivrs' },
      { feature: 'Existing IVR stays live', aiivrs: 'Yes — zero downtime, instant rollback', them: 'Full migration required', winner: 'aiivrs' },
      { feature: 'Self-service', aiivrs: 'CX managers run everything', them: 'Vendor-managed only', winner: 'aiivrs' },
    ]}
    pricing={[
      { label: 'Annual minimum', aiivrs: 'None', them: '$150,000+ estimated' },
      { label: 'Per-intent cost', aiivrs: '$0.006/intent', them: 'Custom (undisclosed)' },
      { label: 'Journey 1: Lower Cost', aiivrs: '$0.006/intent flat', them: 'Custom quote' },
      { label: 'Journey 2: Sales Discovery', aiivrs: '$0.006 + commission on conversion only', them: 'Not available' },
      { label: 'Journey 3: Frustration Recovery', aiivrs: '$0.006 → $0.018 on escalation', them: 'Custom quote' },
      { label: 'Journey 4: Value Routing', aiivrs: '$0.006–$0.018 CRM-driven', them: 'Custom development cost' },
      { label: '100K intents/month', aiivrs: '$600/month', them: 'Custom quote required' },
      { label: 'Setup/onboarding', aiivrs: '$0 (17 min self-service)', them: '3-6 month project cost' },
    ]}
    advantages={[
      '17 minutes vs 3-6 months — orders of magnitude faster to production',
      'Transparent per-intent pricing vs opaque contracts requiring sales calls',
      'No minimum commitment — start with 1 IVR, scale when ready, cancel anytime',
      '100% non-technical — CX managers deploy without IT teams or vendor project managers',
      '4 journey models: Lower Cost, Sales Discovery (zero-risk revenue), Frustration Recovery, Value Routing — all built-in',
      'Sales Discovery: same $0.006/intent, free leads, commission only on conversions — not available on PolyAI at any price',
      'CRM-driven value routing built-in — PolyAI requires custom development per deployment',
      '59 languages auto-detected per call — no custom multilingual build needed',
      'Your existing IVR stays live — zero-risk parallel deployment with instant rollback',
      'Self-service platform — no dependency on vendor team for changes or scaling',
    ]}
    theirStrengths={[
      'Managed service model for organizations that prefer vendor-led implementation',
      'Omnichannel deployment across voice, chat, and SMS channels',
    ]}
    verdict="PolyAI is a managed enterprise service with 3-6 month timelines, $150K+ annual contracts, and opaque pricing. AiIVRs is for CX managers who want transparent per-intent pricing, 4 journey models including zero-risk Sales Discovery, 17-minute deployment, and complete self-service control — no vendor dependency, no contracts, no minimums."
  />
}

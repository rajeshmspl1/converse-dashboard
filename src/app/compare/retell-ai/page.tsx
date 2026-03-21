import CompareTemplate from '@/components/compare/CompareTemplate'
export default function RetellPage() {
  return <CompareTemplate
    competitor="Retell AI" logo="R" tagline="Per-minute voice AI platform"
    headline="AiIVRs vs Retell AI — per-intent vs per-minute"
    subheadline="Retell charges $0.07/minute. AiIVRs charges $0.006/intent. A 3-minute call resolving 2 intents costs $0.21 on Retell vs $0.012 on AiIVRs — 94% less."
    comparison={[
      { feature: 'Pricing model', aiivrs: 'Per intent ($0.006)', them: 'Per minute ($0.07)', winner: 'aiivrs' },
      { feature: 'Setup time', aiivrs: '17 minutes', them: 'Hours to days', winner: 'aiivrs' },
      { feature: 'Integration required', aiivrs: 'Zero — no SIP, no API', them: 'SIP trunking or API', winner: 'aiivrs' },
      { feature: 'Technical requirement', aiivrs: '100% non-developer, non-technical', them: 'Developer required', winner: 'aiivrs' },
      { feature: 'Disconnects cost', aiivrs: '$0.00', them: 'Billed per minute used', winner: 'aiivrs' },
      { feature: 'Hold time cost', aiivrs: '$0.00', them: 'Billed per minute', winner: 'aiivrs' },
      { feature: 'CRM value routing', aiivrs: 'Built-in (4 journey modes)', them: 'Not available', winner: 'aiivrs' },
      { feature: 'Frustration detection', aiivrs: 'Real-time + 3s auto-escalation', them: 'Not available', winner: 'aiivrs' },
      { feature: 'Sales Discovery', aiivrs: '$0.006/intent + commission only on conversion', them: 'Not available', winner: 'aiivrs' },
      { feature: 'Languages', aiivrs: '59 auto-detected', them: '30+ (via providers)', winner: 'aiivrs' },
      { feature: 'Concurrent calls', aiivrs: 'Unlimited', them: '20 base', winner: 'aiivrs' },
      { feature: 'Existing IVR stays live', aiivrs: 'Yes — zero downtime, instant rollback', them: 'Requires migration', winner: 'aiivrs' },
      { feature: 'Contract', aiivrs: 'None — cancel anytime', them: 'Usage commitment', winner: 'aiivrs' },
    ]}
    pricing={[
      { label: 'Base rate', aiivrs: '$0.006/intent', them: '$0.07/min' },
      { label: 'Journey 1: Lower Cost', aiivrs: '$0.006/intent flat', them: 'N/A — per minute only' },
      { label: 'Journey 2: Sales Discovery', aiivrs: '$0.006 + commission on conversion only', them: 'Not available' },
      { label: 'Journey 3: Frustration Recovery', aiivrs: '$0.006 → $0.018 on escalation', them: 'Not available' },
      { label: 'Journey 4: Value Routing', aiivrs: '$0.006–$0.018 CRM-driven', them: 'Not available' },
      { label: '100 resolved intents', aiivrs: '$0.60', them: '$11.67 (100 min est.)' },
      { label: '100,000 intents/month', aiivrs: '$600', them: '$11,667' },
      { label: 'Setup fee', aiivrs: '$0', them: '$0' },
    ]}
    advantages={[
      'Per-intent pricing — pay only for resolved outcomes, not idle time, hold music, or disconnects',
      '17 minutes to production vs hours/days of SIP trunking and API integration',
      '100% non-technical — CX managers run everything, zero developer involvement at any stage',
      '4 journey pricing models: Lower Cost ($0.006), Sales Discovery ($0.006 + commission), Frustration Recovery ($0.006→$0.018), Value Routing ($0.006–$0.018)',
      'Sales Discovery: same per-intent price, free leads, commission only when leads convert — zero risk revenue',
      'Frustration detection with 3-second AI hot-swap recovery — no transfer, no hold music',
      'CRM-driven value routing — Gold/Silver/Bronze customers get matched AI automatically',
      '59 languages auto-detected per call — no separate configuration per language',
      'Your existing IVR stays live — zero downtime parallel deployment with instant rollback',
    ]}
    theirStrengths={[
      'Batch outbound calling capability for proactive campaigns',
      'Branded caller ID for improved answer rates on outbound',
    ]}
    verdict="Retell AI is a developer platform with per-minute billing. AiIVRs is built for CX managers — 100% non-technical, per-intent pricing, 4 journey models including Sales Discovery at zero risk, frustration detection, and CRM routing. Live in 17 minutes, no integration, no IT team."
  />
}

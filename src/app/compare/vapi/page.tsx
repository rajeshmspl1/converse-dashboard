import CompareTemplate from '@/components/compare/CompareTemplate'
export default function VapiPage() {
  return <CompareTemplate
    competitor="VAPI" logo="V" tagline="API-first voice AI platform"
    headline="AiIVRs vs VAPI — zero integration vs API-first"
    subheadline="VAPI charges $0.05–$0.33/min plus platform fees plus STT fees. AiIVRs includes everything — STT, LLM, TTS, infrastructure — in $0.006/intent."
    comparison={[
      { feature: 'Pricing model', aiivrs: 'Per intent ($0.006), all-inclusive', them: 'Per minute ($0.05-$0.33) + add-on fees', winner: 'aiivrs' },
      { feature: 'Hidden fees', aiivrs: 'None — one price includes everything', them: 'STT $0.01/min, platform fee, compliance extra', winner: 'aiivrs' },
      { feature: 'Setup time', aiivrs: '17 minutes', them: 'Days to weeks', winner: 'aiivrs' },
      { feature: 'Technical requirement', aiivrs: '100% non-developer, non-technical', them: 'Engineer required (API-first)', winner: 'aiivrs' },
      { feature: 'Integration', aiivrs: 'Zero — no code, no API needed', them: 'Deep API integration required', winner: 'aiivrs' },
      { feature: 'CRM value routing', aiivrs: 'Built-in (4 journey modes)', them: 'Build yourself via API', winner: 'aiivrs' },
      { feature: 'Frustration detection', aiivrs: 'Real-time + 3s auto-escalation', them: 'Not built-in', winner: 'aiivrs' },
      { feature: 'Sales Discovery', aiivrs: '$0.006/intent + commission only on conversion', them: 'Not available', winner: 'aiivrs' },
      { feature: 'HIPAA compliance', aiivrs: 'Included', them: '$1,000/month extra', winner: 'aiivrs' },
      { feature: 'Support', aiivrs: 'Included', them: 'Slack support $5,000/month extra', winner: 'aiivrs' },
      { feature: 'Existing IVR stays live', aiivrs: 'Yes — zero downtime, instant rollback', them: 'Requires migration', winner: 'aiivrs' },
      { feature: 'Disconnects cost', aiivrs: '$0.00', them: 'Billed per minute used', winner: 'aiivrs' },
    ]}
    pricing={[
      { label: 'Voice agent cost', aiivrs: '$0.006/intent (all-in)', them: '$0.05–$0.33/min + fees' },
      { label: 'Journey 1: Lower Cost', aiivrs: '$0.006/intent flat', them: 'N/A — per minute only' },
      { label: 'Journey 2: Sales Discovery', aiivrs: '$0.006 + commission on conversion only', them: 'Not available' },
      { label: 'Journey 3: Frustration Recovery', aiivrs: '$0.006 → $0.018 on escalation', them: 'Not available' },
      { label: 'Journey 4: Value Routing', aiivrs: '$0.006–$0.018 CRM-driven', them: 'Not available' },
      { label: 'STT cost', aiivrs: 'Included', them: '$0.01/min extra' },
      { label: 'HIPAA compliance', aiivrs: 'Included', them: '$1,000/month extra' },
      { label: 'Slack support', aiivrs: 'Included', them: '$5,000/month extra' },
    ]}
    advantages={[
      'All-inclusive pricing — no hidden STT fees, platform fees, or compliance surcharges',
      '100% non-technical — CX managers deploy without any engineering involvement at any stage',
      '17 minutes to production — not days of API integration and testing',
      '4 journey pricing models: Lower Cost, Sales Discovery (zero-risk revenue), Frustration Recovery, Value Routing',
      'Sales Discovery: resolve support first, one CRM offer second — commission only on actual conversions',
      'HIPAA compliance included — VAPI charges $1,000/month extra for the same',
      'Support included — VAPI charges $5,000/month for Slack support',
      'Per-intent means disconnects, hold time, and idle calls are always free',
      '59 languages auto-detected — no configuration needed per language',
      'Your existing IVR stays live throughout — zero risk deployment with instant rollback',
    ]}
    theirStrengths={[
      'Extensive API customization for teams with dedicated engineering resources',
      'Wide range of hosting and deployment configuration options',
    ]}
    verdict="VAPI is an API-first platform for developer teams comfortable paying per-minute plus add-on fees for STT, compliance, and support. AiIVRs is for CX managers — 100% non-technical, all-inclusive per-intent pricing, 4 journey models including zero-risk Sales Discovery, HIPAA included, live in 17 minutes."
  />
}

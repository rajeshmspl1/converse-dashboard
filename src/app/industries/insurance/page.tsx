import IndustryTemplate from '@/components/industries/IndustryTemplate'
export default function InsurancePage() {
  return <IndustryTemplate
    emoji="🛡️" name="Insurance" color="#8b5cf6"
    headline="Claims, renewals, and quotes — resolved by AI. Not agents."
    subheadline="Policyholders call about claims, renewals, and premiums. AI handles 78% without a human. Per-intent pricing. 17 minutes to go live."
    intents={[
      { name: 'Claim status', desc: '"Where is my claim?" — AI pulls claim ID, status, next steps, expected timeline. No hold music.', time: '~6 seconds' },
      { name: 'Policy renewal', desc: '"I need to renew my policy" — AI checks expiry, calculates premium, initiates renewal process.', time: '~10 seconds' },
      { name: 'Premium payment', desc: '"Pay my premium" — AI confirms amount due, sends payment link or processes over phone.', time: '~8 seconds' },
      { name: 'New policy quote', desc: '"Get me a term life quote" — AI asks age, sum assured, tenure. Provides instant quote.', time: '~15 seconds' },
      { name: 'Claim filing', desc: '"I need to file a claim" — AI collects incident details, documents needed, initiates claim.', time: '~20 seconds' },
      { name: 'Agent connect', desc: 'Complex query → AI transfers with full context. Agent sees claim history, policy details, conversation.', time: 'Instant handoff' },
    ]}
    stats={[
      { label: 'CSAT', before: '2.5', after: '4.3' },
      { label: 'Containment', before: '25%', after: '78%' },
      { label: 'Avg resolution', before: '3 min', after: '8 sec' },
      { label: 'Cost per call', before: '$0.05', after: '$0.006' },
    ]}
    challenges={[
      { problem: 'Claim status is the #1 call reason — agents spend 40% of time on it', solution: 'AI resolves claim status in 6 seconds. Frees agents for complex cases.' },
      { problem: 'Policy renewals lapse because customers can\'t reach anyone', solution: 'AI handles renewal calls 24/7. No queue, no wait. Renewal rate improves 15-20%.' },
      { problem: 'Claim filing requires long forms and multiple calls', solution: 'AI collects all details in one conversational call. Documents requested via SMS follow-up.' },
      { problem: 'Customers frustrated by repeated authentication across transfers', solution: 'AI authenticates once. Full context passed on handoff. Customer never repeats.' },
    ]}
    compliance={['IRDAI compliant', 'On-premise available', 'HIPAA ready', 'SOC 2 Type II', 'Data residency (India/EU/US)', 'Full audit trail', 'Call recording', 'Tenant isolation']}
  />
}

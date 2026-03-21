import IndustryTemplate from '@/components/industries/IndustryTemplate'
export default function TelecomPage() {
  return <IndustryTemplate
    emoji="📱" name="Telecom" color="#f5a623"
    headline="Plan upgrades, bill payments, SIM replacements — AI handles it all."
    subheadline="Telecom IVRs handle millions of calls monthly. Most are routine. AI resolves 85% without an agent. Per-intent pricing means you only pay for resolutions."
    intents={[
      { name: 'Plan upgrade', desc: '"I want to upgrade my plan" — AI shows available plans, compares pricing, processes upgrade.', time: '~12 seconds' },
      { name: 'Data usage', desc: '"How much data have I used?" — AI pulls real-time usage, remaining balance, renewal date.', time: '~4 seconds' },
      { name: 'SIM replacement', desc: '"I lost my SIM" — AI verifies identity, initiates SIM replacement, provides pickup/delivery options.', time: '~15 seconds' },
      { name: 'Bill payment', desc: '"Pay my bill" — AI shows amount due, sends payment link, confirms payment.', time: '~8 seconds' },
      { name: 'Roaming activation', desc: '"Activate roaming for my US trip" — AI checks plan, activates roaming pack, confirms rates.', time: '~10 seconds' },
      { name: 'Recharge', desc: '"Recharge ₹299 plan" — AI confirms plan, processes recharge, sends confirmation.', time: '~6 seconds' },
    ]}
    stats={[
      { label: 'CSAT', before: '2.4', after: '4.2' },
      { label: 'Containment', before: '30%', after: '85%' },
      { label: 'Avg resolution', before: '2 min', after: '6 sec' },
      { label: 'Cost per call', before: '$0.04', after: '$0.006' },
    ]}
    challenges={[
      { problem: 'Millions of monthly calls — most are routine balance/usage checks', solution: 'AI handles routine intents at $0.006 each. Agents focus on complex issues only.' },
      { problem: 'Churn prevention requires proactive offers — IVR can\'t do this', solution: 'Sales Discovery detects churn signals mid-call, surfaces retention offers from CRM.' },
      { problem: 'Regional language support requires separate IVR trees', solution: 'One AI, 59 languages. Auto-detected. No separate trees. No extra cost.' },
      { problem: 'Peak hours (bill due dates) overwhelm agent capacity', solution: 'AI scales infinitely. No queue. Bill payment resolved in 8 seconds at any volume.' },
    ]}
    compliance={['TRAI compliant', 'Data localization', 'SOC 2 Type II', 'On-premise available', 'Number portability support', 'Call recording', 'Full audit trail', 'Tenant isolation']}
  />
}

import IndustryTemplate from '@/components/industries/IndustryTemplate'
export default function BankingPage() {
  return <IndustryTemplate
    emoji="🏦" name="Banking & Finance" color="#3370E8"
    headline="Your banking IVR, powered by AI. In 17 minutes."
    subheadline="Balance checks in 5 seconds. Card blocking instant. Loan queries resolved — not transferred. 59 languages. Per-intent pricing. Zero integration with your core banking."
    intents={[
      { name: 'Account balance', desc: 'Customer says "check my balance" — AI authenticates and responds with exact amount, account type, last transaction.', time: '~5 seconds' },
      { name: 'Card blocking', desc: '"Block my card" — AI confirms card details, blocks immediately, confirms via SMS. No agent needed.', time: '~8 seconds' },
      { name: 'Loan EMI inquiry', desc: '"What is my EMI?" — AI pulls loan details, calculates next EMI, due date, outstanding balance.', time: '~6 seconds' },
      { name: 'Mini statement', desc: '"Show my last 5 transactions" — AI reads last 5 debits/credits with amounts, merchants, dates.', time: '~10 seconds' },
      { name: 'FD rates', desc: '"What are your FD rates?" — AI provides current rates by tenure. Can initiate FD booking.', time: '~7 seconds' },
      { name: 'Fund transfer', desc: '"Transfer ₹5000 to Rajesh" — AI confirms beneficiary, amount, authenticates, completes transfer.', time: '~15 seconds' },
    ]}
    stats={[
      { label: 'CSAT', before: '2.8', after: '4.5' },
      { label: 'Containment', before: '28%', after: '82%' },
      { label: 'Avg resolution', before: '2.5 min', after: '5 sec' },
      { label: 'Cost per call', before: '$0.04', after: '$0.006' },
    ]}
    challenges={[
      { problem: 'Customers wait 3+ minutes navigating IVR menus for a simple balance check', solution: 'AI resolves balance in 5 seconds. No menu tree. Customer speaks, AI answers.' },
      { problem: 'Card blocking requires agent transfer — 8-minute average wait', solution: 'AI blocks the card instantly. Confirms via SMS. Zero agent involvement.' },
      { problem: 'HNI customers get the same experience as routine callers', solution: 'CRM-driven routing: Gold customers get premium AI (Exp 2). Routine stays cost-efficient (Exp 5). Automatic.' },
      { problem: 'Regional language callers can\'t navigate English IVR', solution: '10 Indian languages + 49 global. Auto-detected per call. Hindi, Tamil, Telugu — native voice, not translation.' },
    ]}
    compliance={['RBI data localization', 'On-premise deployment', 'PCI DSS ready', 'SOC 2 Type II', 'Tenant isolation', 'Call recording + audit trail', 'India data residency', 'GDPR compliant']}
  />
}

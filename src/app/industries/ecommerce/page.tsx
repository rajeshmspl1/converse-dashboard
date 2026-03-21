import IndustryTemplate from '@/components/industries/IndustryTemplate'
export default function EcommercePage() {
  return <IndustryTemplate
    emoji="🛒" name="E-Commerce" color="#00de7a"
    headline="Order tracking, returns, refunds — resolved before the customer finishes asking."
    subheadline="E-commerce call volumes spike during sales. AI handles 80% of calls at $0.006/intent. Scale infinitely. No hiring."
    intents={[
      { name: 'Order tracking', desc: '"Where is my order?" — AI pulls order ID, carrier, tracking status, expected delivery.', time: '~5 seconds' },
      { name: 'Return request', desc: '"I want to return this item" — AI checks return eligibility, initiates return, sends shipping label.', time: '~12 seconds' },
      { name: 'Refund status', desc: '"When will I get my refund?" — AI checks refund status, expected date, payment method.', time: '~6 seconds' },
      { name: 'Delivery update', desc: '"Change my delivery address" — AI checks if order is shipped, updates address if possible.', time: '~8 seconds' },
      { name: 'Product info', desc: '"Is this available in size L?" — AI checks real-time inventory, alternatives if out of stock.', time: '~5 seconds' },
      { name: 'Complaint', desc: '"I received a damaged item" — AI logs complaint, initiates replacement, offers compensation.', time: '~15 seconds' },
    ]}
    stats={[
      { label: 'CSAT', before: '2.7', after: '4.4' },
      { label: 'Containment', before: '26%', after: '80%' },
      { label: 'Avg resolution', before: '3 min', after: '7 sec' },
      { label: 'Cost per call', before: '$0.05', after: '$0.006' },
    ]}
    challenges={[
      { problem: 'Sale days generate 10x call volume — agents can\'t scale', solution: 'AI scales infinitely. Same $0.006/intent whether it\'s 1,000 or 1,000,000 calls.' },
      { problem: '"Where is my order?" is 60% of all calls — agents do copy-paste from tracking', solution: 'AI resolves WISMO in 5 seconds. Agents freed for complex issues only.' },
      { problem: 'Return/refund calls create negative experience — customers already frustrated', solution: 'Frustration detection triggers empathetic AI. Returns processed conversationally, not through menus.' },
      { problem: 'Upsell opportunity lost — support calls end without any offer', solution: 'Sales Discovery: after resolving support, AI surfaces one relevant product recommendation.' },
    ]}
    compliance={['PCI DSS ready', 'SOC 2 Type II', 'GDPR compliant', 'On-premise available', 'Data residency options', 'Call recording', 'Full audit trail', 'API integration']}
  />
}

import IndustryTemplate from '@/components/industries/IndustryTemplate'
export default function HospitalityPage() {
  return <IndustryTemplate
    emoji="🏨" name="Hospitality" color="#00c9b1"
    headline="Reservations, room service, concierge — AI that sounds like your best front desk."
    subheadline="Guests expect instant service. AI handles booking, check-in, room service, and concierge — in 59 languages, 24/7, with the warmth of your best staff."
    intents={[
      { name: 'Room booking', desc: '"Book a room for March 15-17" — AI checks availability, room types, rates. Confirms booking instantly.', time: '~12 seconds' },
      { name: 'Check-in', desc: '"I\'m arriving at 2pm, can I check in early?" — AI checks availability, confirms early check-in, sends room details.', time: '~8 seconds' },
      { name: 'Room service', desc: '"Send a club sandwich to room 412" — AI takes order, confirms items, estimated delivery time.', time: '~10 seconds' },
      { name: 'Spa reservation', desc: '"Book a massage for tomorrow 3pm" — AI checks spa availability, books slot, confirms.', time: '~8 seconds' },
      { name: 'Late checkout', desc: '"Can I check out at 2pm instead of noon?" — AI checks availability, approves or offers alternatives.', time: '~6 seconds' },
      { name: 'Concierge', desc: '"Book a table at a good Italian restaurant nearby" — AI recommends, books, sends confirmation.', time: '~15 seconds' },
    ]}
    stats={[
      { label: 'Guest satisfaction', before: '3.0', after: '4.7' },
      { label: 'Containment', before: '20%', after: '76%' },
      { label: 'Response time', before: '2 min', after: '5 sec' },
      { label: 'Cost per call', before: '$0.06', after: '$0.006' },
    ]}
    challenges={[
      { problem: 'Front desk overwhelmed during peak check-in/check-out hours', solution: 'AI handles phone inquiries. Front desk focuses on in-person guests.' },
      { problem: 'International guests can\'t communicate needs in English', solution: '59 languages auto-detected. Arabic, Mandarin, Japanese, French — native voices.' },
      { problem: 'Room service orders get lost or delayed during busy periods', solution: 'AI takes orders accurately, sends to kitchen system directly. No transcription errors.' },
      { problem: 'Upsell opportunities missed — guests don\'t know about spa, dining, tours', solution: 'Sales Discovery: after resolving request, AI mentions one relevant upgrade or service.' },
    ]}
    compliance={['GDPR compliant', 'PCI DSS ready', 'Multi-property support', 'On-premise available', 'Data residency (EU/US/UAE)', 'Call recording', 'Guest data privacy', 'API integration']}
  />
}

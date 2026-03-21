import IndustryTemplate from '@/components/industries/IndustryTemplate'
export default function HealthcarePage() {
  return <IndustryTemplate
    emoji="🏥" name="Healthcare" color="#f03060"
    headline="Patient calls handled with empathy and speed. By AI."
    subheadline="Appointments, prescriptions, lab results, billing — resolved in seconds. HIPAA compliant. Frustration detection built in. 59 languages."
    intents={[
      { name: 'Appointment booking', desc: '"I need to see Dr. Sharma" — AI checks availability, books slot, sends confirmation SMS.', time: '~10 seconds' },
      { name: 'Prescription refill', desc: '"Refill my blood pressure medication" — AI verifies prescription, checks refill eligibility, processes.', time: '~8 seconds' },
      { name: 'Lab results', desc: '"Are my blood test results ready?" — AI checks status, reads results if authorized, or schedules callback.', time: '~6 seconds' },
      { name: 'Doctor availability', desc: '"Is Dr. Patel available this week?" — AI shows open slots across days, specialties, locations.', time: '~5 seconds' },
      { name: 'Billing inquiry', desc: '"What do I owe?" — AI pulls outstanding balance, itemized charges, payment options.', time: '~7 seconds' },
      { name: 'Insurance verification', desc: '"Is my procedure covered?" — AI checks plan details, coverage, co-pay estimate.', time: '~12 seconds' },
    ]}
    stats={[
      { label: 'CSAT', before: '2.9', after: '4.6' },
      { label: 'Containment', before: '22%', after: '75%' },
      { label: 'No-show reduction', before: '18%', after: '8%' },
      { label: 'Cost per call', before: '$0.06', after: '$0.006' },
    ]}
    challenges={[
      { problem: 'Patients wait 10+ minutes to book a simple appointment', solution: 'AI books in 10 seconds. Sends SMS confirmation. No-show reminders automated.' },
      { problem: 'After-hours calls go to voicemail — patients feel unheard', solution: 'AI handles calls 24/7. Urgent cases flagged and escalated immediately.' },
      { problem: 'Anxious patients need empathy, not a phone tree', solution: 'Frustration detection triggers empathetic AI within 3 seconds. Voice tone adapts.' },
      { problem: 'Multilingual patient population can\'t navigate English IVR', solution: '59 languages auto-detected. Hindi, Tamil, Spanish, Arabic — native voices.' },
    ]}
    compliance={['HIPAA compliant', 'On-premise deployment', 'SOC 2 Type II', 'ISO 27001', 'Patient data encryption', 'Full audit trail', 'GDPR compliant', 'BAA available']}
  />
}

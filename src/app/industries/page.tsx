'use client'
import { useRouter } from 'next/navigation'
import StaticPageShell from '@/components/layout/StaticPageShell'

const INDUSTRIES = [
  { slug: 'banking', emoji: '🏦', name: 'Banking & Finance', intents: 'Account balance · Card blocking · Loan EMI · Mini statement · FD rates · Cheque book · Fund transfer · Debit card PIN', calls: '500K–5M/month typical', csat: '2.8 → 4.5', containment: '82%', color: '#3370E8' },
  { slug: 'insurance', emoji: '🛡️', name: 'Insurance', intents: 'Claim status · Policy renewal · Premium payment · New policy quote · Agent connect · Document upload · Claim filing', calls: '100K–1M/month typical', csat: '2.5 → 4.3', containment: '78%', color: '#8b5cf6' },
  { slug: 'healthcare', emoji: '🏥', name: 'Healthcare', intents: 'Appointments · Prescriptions · Lab results · Doctor availability · Billing · Insurance verification · Referrals', calls: '50K–500K/month typical', csat: '2.9 → 4.6', containment: '75%', color: '#f03060' },
  { slug: 'telecom', emoji: '📱', name: 'Telecom', intents: 'Plan upgrade · Data usage · SIM replacement · Bill payment · Roaming activation · Number portability · Recharge', calls: '1M–10M/month typical', csat: '2.4 → 4.2', containment: '85%', color: '#f5a623' },
  { slug: 'ecommerce', emoji: '🛒', name: 'E-Commerce', intents: 'Order tracking · Return request · Refund status · Delivery update · Product info · Store locator · Complaint', calls: '200K–2M/month typical', csat: '2.7 → 4.4', containment: '80%', color: '#00de7a' },
  { slug: 'hospitality', emoji: '🏨', name: 'Hospitality', intents: 'Room booking · Check-in · Room service · Spa reservation · Late checkout · Concierge · Airport transfer', calls: '50K–300K/month typical', csat: '3.0 → 4.7', containment: '76%', color: '#00c9b1' },
]

export default function IndustriesPage() {
  const router = useRouter()
  return (
    <StaticPageShell>
      <section className="text-center px-4 sm:px-6 pt-16 pb-8">
        <div className="text-[11px] font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--tx3)' }}>6 industries · Live demos</div>
        <h1 className="text-[28px] sm:text-[40px] font-black tracking-tight mb-3" style={{ letterSpacing: '-1px' }}>Hear AI handle your industry&apos;s intents</h1>
        <p className="text-[14px] sm:text-[16px] mx-auto leading-relaxed" style={{ color: 'var(--tx2)', maxWidth: 580 }}>
          Each industry page shows real intents, real resolution flows, and real pricing — for your sector. Click to explore or try a live demo call.
        </p>
      </section>
      <section className="max-w-[1000px] mx-auto px-4 sm:px-6 pb-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {INDUSTRIES.map((ind) => (
            <div key={ind.slug} className="p-5 sm:p-6 rounded-xl border cursor-pointer transition-all hover:-translate-y-1 hover:border-[#00c9b1]"
              onClick={() => router.push(`/industries/${ind.slug}`)}
              style={{ background: 'var(--s1)', borderColor: 'var(--b1)' }}>
              <div className="text-[28px] mb-2">{ind.emoji}</div>
              <h2 className="text-[16px] font-bold mb-1">{ind.name}</h2>
              <p className="text-[10px] leading-relaxed mb-3" style={{ color: 'var(--tx3)' }}>{ind.intents}</p>
              <div className="grid grid-cols-3 gap-2 mb-3">
                <div className="text-center p-2 rounded-lg" style={{ background: 'var(--s2)' }}>
                  <div className="text-[12px] font-bold" style={{ color: ind.color }}>{ind.containment}</div>
                  <div className="text-[8px]" style={{ color: 'var(--tx3)' }}>Containment</div>
                </div>
                <div className="text-center p-2 rounded-lg" style={{ background: 'var(--s2)' }}>
                  <div className="text-[12px] font-bold" style={{ color: '#00de7a' }}>{ind.csat}</div>
                  <div className="text-[8px]" style={{ color: 'var(--tx3)' }}>CSAT</div>
                </div>
                <div className="text-center p-2 rounded-lg" style={{ background: 'var(--s2)' }}>
                  <div className="text-[10px] font-bold" style={{ color: 'var(--tx2)' }}>$0.005</div>
                  <div className="text-[8px]" style={{ color: 'var(--tx3)' }}>From/intent</div>
                </div>
              </div>
              <div className="text-[10px] font-semibold" style={{ color: '#00c9b1' }}>Explore {ind.name} →</div>
            </div>
          ))}
        </div>
      </section>
    </StaticPageShell>
  )
}

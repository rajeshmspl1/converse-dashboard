'use client'
import { useState } from 'react'
import StaticPageShell from '@/components/layout/StaticPageShell'

export default function ContactSalesPage() {
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
  }

  return (
    <StaticPageShell>
      <section className="max-w-[900px] mx-auto px-4 sm:px-6 pt-16 pb-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 sm:gap-12">

          {/* Left — Info */}
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--tx3, #6b84a8)' }}>
              Talk to us
            </div>
            <h1 className="text-[28px] sm:text-[36px] font-black tracking-tight mb-3" style={{ letterSpacing: '-1px' }}>
              Book a 15-minute demo
            </h1>
            <p className="text-[14px] leading-relaxed mb-6" style={{ color: 'var(--tx2, #7a90b5)' }}>
              We&apos;ll show you AiIVRs live on your own IVR number. No prep needed. No slides. Just a real AI call handling your real customer intents.
            </p>

            <div className="flex flex-col gap-3 mb-6">
              {[
                { icon: '📞', label: 'Live demo on YOUR IVR number', sub: 'Not a recording. Not a simulation. Your actual IVR.' },
                { icon: '⏱️', label: '15 minutes, not 60', sub: 'We respect your time. You\'ll see everything in 15 minutes.' },
                { icon: '🚫', label: 'No sales pitch', sub: 'Just the product. You decide if it fits.' },
                { icon: '💰', label: 'Custom pricing for volume', sub: 'Enterprise pricing, on-premise deployment, SLA agreements.' },
              ].map((item, i) => (
                <div key={i} className="flex gap-3 p-3 rounded-lg" style={{ background: 'var(--s1)', border: '1px solid var(--b1)' }}>
                  <div className="text-[18px] flex-shrink-0">{item.icon}</div>
                  <div>
                    <div className="text-[12px] font-bold">{item.label}</div>
                    <div className="text-[10px]" style={{ color: 'var(--tx3)' }}>{item.sub}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 rounded-xl" style={{ background: 'var(--s1)', border: '1px solid var(--b1)' }}>
              <div className="text-[11px] font-bold mb-2" style={{ color: '#00c9b1' }}>Or try the demo yourself — right now</div>
              <div className="text-[10px] mb-2" style={{ color: 'var(--tx3)' }}>No form, no wait. Click below, make a call, hear AI resolve intents live.</div>
              <a href="/" className="inline-block px-5 py-2 rounded-lg text-[11px] font-bold no-underline" style={{ background: '#00c9b1', color: '#000' }}>
                ▶ Try Live Demo
              </a>
            </div>
          </div>

          {/* Right — Form */}
          <div className="p-5 sm:p-6 rounded-xl border" style={{ background: 'var(--s1, #0d1526)', borderColor: 'var(--b1, #1c2d45)' }}>
            {submitted ? (
              <div className="text-center py-12">
                <div className="text-[32px] mb-3">✅</div>
                <div className="text-[18px] font-bold mb-2">We&apos;ll be in touch within 24 hours.</div>
                <div className="text-[12px]" style={{ color: 'var(--tx3)' }}>Check your email for a calendar link. Or try the live demo now.</div>
                <a href="/" className="inline-block mt-4 px-6 py-2.5 rounded-lg text-[12px] font-bold no-underline" style={{ background: '#00c9b1', color: '#000' }}>
                  ▶ Try Live Demo
                </a>
              </div>
            ) : (
              <div>
                <div className="text-[16px] font-bold mb-4">Get in touch</div>
                <div className="flex flex-col gap-3" role="form">
                  {[
                    { label: 'Full name', type: 'text', placeholder: 'Jane Smith' },
                    { label: 'Work email', type: 'email', placeholder: 'jane@company.com' },
                    { label: 'Company', type: 'text', placeholder: 'Company name' },
                    { label: 'Phone', type: 'tel', placeholder: '+1 (555) 000-0000' },
                  ].map((field, i) => (
                    <div key={i}>
                      <label className="block text-[11px] font-semibold mb-1" style={{ color: 'var(--tx2)' }}>{field.label}</label>
                      <input type={field.type} placeholder={field.placeholder}
                        className="w-full px-3 py-2.5 rounded-lg text-[12px] outline-none transition-colors"
                        style={{ background: 'var(--s2, #111d30)', border: '1px solid var(--b1)', color: 'var(--tx)' }} />
                    </div>
                  ))}
                  <div>
                    <label className="block text-[11px] font-semibold mb-1" style={{ color: 'var(--tx2)' }}>Industry</label>
                    <select className="w-full px-3 py-2.5 rounded-lg text-[12px] outline-none"
                      style={{ background: 'var(--s2, #111d30)', border: '1px solid var(--b1)', color: 'var(--tx)' }}>
                      <option value="">Select industry</option>
                      <option>Banking & Finance</option>
                      <option>Insurance</option>
                      <option>Healthcare</option>
                      <option>Telecom</option>
                      <option>E-Commerce</option>
                      <option>Hospitality</option>
                      <option>Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold mb-1" style={{ color: 'var(--tx2)' }}>Monthly call volume</label>
                    <select className="w-full px-3 py-2.5 rounded-lg text-[12px] outline-none"
                      style={{ background: 'var(--s2, #111d30)', border: '1px solid var(--b1)', color: 'var(--tx)' }}>
                      <option value="">Select volume</option>
                      <option>Under 10,000</option>
                      <option>10,000 – 50,000</option>
                      <option>50,000 – 200,000</option>
                      <option>200,000 – 1,000,000</option>
                      <option>Over 1,000,000</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold mb-1" style={{ color: 'var(--tx2)' }}>Message (optional)</label>
                    <textarea rows={3} placeholder="Tell us about your IVR setup or what you'd like to see in the demo..."
                      className="w-full px-3 py-2.5 rounded-lg text-[12px] outline-none resize-none"
                      style={{ background: 'var(--s2, #111d30)', border: '1px solid var(--b1)', color: 'var(--tx)' }} />
                  </div>
                  <button onClick={handleSubmit}
                    className="w-full py-3 rounded-lg text-[13px] font-bold cursor-pointer border-none mt-1"
                    style={{ background: '#00c9b1', color: '#000' }}>
                    Book My Demo →
                  </button>
                  <div className="text-[9px] text-center" style={{ color: 'var(--tx3)' }}>No commitment. No credit card. We&apos;ll reply within 24 hours.</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </StaticPageShell>
  )
}

'use client'
import { useRouter } from 'next/navigation'
import StaticPageShell from '@/components/layout/StaticPageShell'

export default function HowItWorksPage() {
  const router = useRouter()

  return (
    <StaticPageShell>
      {/* Hero */}
      <section className="text-center px-4 sm:px-6 pt-16 pb-8">
        <div className="text-[11px] font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--tx3, #6b84a8)' }}>
          From IVR number to production
        </div>
        <h1 className="text-[28px] sm:text-[40px] font-black tracking-tight mb-3" style={{ letterSpacing: '-1px' }}>
          17 minutes. Here&apos;s how.
        </h1>
        <p className="text-[14px] sm:text-[16px] mx-auto leading-relaxed" style={{ color: 'var(--tx2, #7a90b5)', maxWidth: 580 }}>
          You give us the phone number. We handle everything else. No data extraction, no training, no integration, no IT team. Here&apos;s what happens in those 17 minutes.
        </p>
      </section>

      {/* ═══ TIMELINE ═══ */}
      <section className="max-w-[900px] mx-auto px-4 sm:px-6 pb-10">
        <div className="flex flex-col gap-4">
          {[
            { min: '0:00', dur: '0 min', icon: '📞', title: 'Share your IVR number', desc: 'Just the phone number your customers call today. No IVR tree documents, no VoiceXML, no recordings, no system access. One number — that\'s all.', color: '#00c9b1', what: 'What you do: paste or type the number.', we: 'What we do: our proprietary overlay technology maps your IVR — without touching it.' },
            { min: '0:00', dur: '5 min', icon: '🎧', title: 'Hear AI on your calls', desc: 'Within 5 minutes, AI answers your industry\'s real customer intents — balance check, card block, claim status, plan upgrade — live, on a real call. You hear it yourself.', color: '#3370E8', what: 'What you do: make a test call and listen.', we: 'What we do: deploy AI agents with your intent map, language support, and greeting.' },
            { min: '5:00', dur: '5 min', icon: '🔬', title: 'Validate every customer journey', desc: 'Run simulated calls through every flow — multiple intents, multiple languages, edge cases. Confirm every intent resolves correctly. Watch real-time analytics.', color: '#f5a623', what: 'What you do: test your scenarios, verify resolution.', we: 'What we do: provide real-time dashboard with intent analytics, transcripts, recordings.' },
            { min: '10:00', dur: '5 min', icon: '📊', title: 'Review analytics + configure', desc: 'See containment rate, CSAT scores, cost per intent, language distribution. Configure routing mode — lower cost, sales discovery, frustration recovery, or value-based.', color: '#8b5cf6', what: 'What you do: pick your journey model + review metrics.', we: 'What we do: activate your chosen routing mode with CRM integration if needed.' },
            { min: '15:00', dur: '2 min', icon: '✅', title: 'Go live on real customer calls', desc: 'Flip the switch. Real customers. Real calls. Full dashboards, compliance logs, multilingual support, agent handoff — all running. Your existing IVR stays live as fallback.', color: '#00de7a', what: 'What you do: approve go-live.', we: 'What we do: activate production, monitoring, alerting, and rollback safety net.' },
          ].map((step, i) => (
            <div key={i} className="flex gap-4 sm:gap-6">
              {/* Timeline dot + line */}
              <div className="flex flex-col items-center flex-shrink-0" style={{ width: 40 }}>
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-[16px]" style={{ background: step.color }}>{step.icon}</div>
                {i < 4 && <div className="w-0.5 flex-1 mt-1" style={{ background: 'var(--b1, #1c2d45)' }} />}
              </div>
              {/* Content */}
              <div className="pb-6 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded" style={{ background: `${step.color}20`, color: step.color }}>{step.dur}</span>
                  <span className="text-[14px] sm:text-[16px] font-bold">{step.title}</span>
                </div>
                <p className="text-[11px] sm:text-[12px] leading-relaxed mb-3" style={{ color: 'var(--tx2)' }}>{step.desc}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="p-3 rounded-lg text-[10px]" style={{ background: 'var(--s1)', border: '1px solid var(--b1)' }}>
                    <span className="font-bold" style={{ color: '#00c9b1' }}>You:</span> <span style={{ color: 'var(--tx3)' }}>{step.what}</span>
                  </div>
                  <div className="p-3 rounded-lg text-[10px]" style={{ background: 'var(--s1)', border: '1px solid var(--b1)' }}>
                    <span className="font-bold" style={{ color: '#3370E8' }}>AiIVRs:</span> <span style={{ color: 'var(--tx3)' }}>{step.we}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ WHAT YOU DON'T NEED ═══ */}
      <section className="max-w-[900px] mx-auto px-4 sm:px-6 py-10" style={{ borderTop: '1px solid var(--b1, #1c2d45)' }}>
        <h2 className="text-center text-[22px] sm:text-[28px] font-bold mb-6">What you don&apos;t need</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { icon: '🚫', label: 'No data extraction', sub: 'No training sets, no IVR tree docs' },
            { icon: '🚫', label: 'No integration', sub: 'No SIP, no API, no code changes' },
            { icon: '🚫', label: 'No IT team', sub: 'CXOs run it themselves' },
            { icon: '🚫', label: 'No contracts', sub: 'Cancel anytime, no lock-in' },
            { icon: '🚫', label: 'No upfront cost', sub: 'Free pilot for 3 months' },
            { icon: '🚫', label: 'No vendor lock-in', sub: 'BYO carrier, cloud, LLM, CRM' },
            { icon: '🚫', label: 'No minimum volume', sub: 'Start with 1 IVR number' },
            { icon: '🚫', label: 'No downtime', sub: 'Your IVR stays live throughout' },
          ].map((item, i) => (
            <div key={i} className="p-3 rounded-lg text-center" style={{ background: 'var(--s1)', border: '1px solid var(--b1)' }}>
              <div className="text-[18px] mb-1">{item.icon}</div>
              <div className="text-[11px] font-bold mb-0.5" style={{ color: '#00c9b1' }}>{item.label}</div>
              <div className="text-[9px]" style={{ color: 'var(--tx3)' }}>{item.sub}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ AFTER GO-LIVE ═══ */}
      <section className="max-w-[900px] mx-auto px-4 sm:px-6 py-10" style={{ borderTop: '1px solid var(--b1)' }}>
        <h2 className="text-center text-[22px] sm:text-[28px] font-bold mb-2">After go-live</h2>
        <p className="text-center text-[13px] sm:text-[14px] mb-8 mx-auto" style={{ color: 'var(--tx2)', maxWidth: 560 }}>Everything runs. You monitor. Scale when ready.</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { icon: '📊', title: 'Real-time dashboard', desc: 'Intent analytics, CSAT scores, containment rate, cost per intent, language distribution — all live.' },
            { icon: '🎙️', title: 'Every call recorded', desc: 'Full audio recordings, transcripts, intent tagging, sentiment analysis. QA built in from day one.' },
            { icon: '🔄', title: 'Instant rollback', desc: 'One click to revert to your original IVR. No downtime, no data loss. Your safety net is always on.' },
          ].map((item, i) => (
            <div key={i} className="p-5 rounded-xl border" style={{ background: 'var(--s1)', borderColor: 'var(--b1)' }}>
              <div className="text-[20px] mb-2">{item.icon}</div>
              <div className="text-[13px] font-bold mb-1">{item.title}</div>
              <div className="text-[11px] leading-relaxed" style={{ color: 'var(--tx3)' }}>{item.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ CTA ═══ */}
      <section className="max-w-[900px] mx-auto px-4 sm:px-6 py-10 pb-16">
        <div className="text-center p-8 sm:p-10 rounded-2xl border"
          style={{ background: 'linear-gradient(135deg, rgba(59,130,246,.06), rgba(6,182,212,.04))', borderColor: 'rgba(59,130,246,.1)' }}>
          <h2 className="text-[18px] sm:text-[22px] font-bold mb-2">See it happen — live, on a real call.</h2>
          <p className="text-[12px] sm:text-[13px] mb-5" style={{ color: 'var(--tx3)' }}>Try the demo. Watch AI resolve intents in real-time. 17 minutes from now, you could be live.</p>
          <button onClick={() => router.push('/')} className="px-8 py-3 rounded-[10px] text-[14px] font-bold border-none cursor-pointer" style={{ background: '#00c9b1', color: '#000' }}>
            ▶ Try Live Demo →
          </button>
        </div>
      </section>

      {/* JSON-LD */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org', '@type': 'HowTo', name: 'How to migrate your IVR to AI IVR in 17 minutes',
        description: 'Step-by-step: share your IVR number, hear AI live, validate, configure, go live. No integration needed.',
        totalTime: 'PT17M',
        step: [
          { '@type': 'HowToStep', name: 'Share your IVR number', text: 'Provide your IVR phone number. No data extraction or system access needed.' },
          { '@type': 'HowToStep', name: 'Hear AI on your calls', text: 'Within 5 minutes, AI handles real customer intents live.' },
          { '@type': 'HowToStep', name: 'Validate every journey', text: 'Run simulated calls, verify intent resolution, review analytics.' },
          { '@type': 'HowToStep', name: 'Configure routing', text: 'Choose your pricing model: lower cost, sales discovery, frustration recovery, or value routing.' },
          { '@type': 'HowToStep', name: 'Go live', text: 'Real customers, real calls. Full dashboards, compliance, multilingual, agent handoff.' },
        ],
      })}} />
    </StaticPageShell>
  )
}

'use client'
import { useRouter } from 'next/navigation'
import StaticPageShell from '@/components/layout/StaticPageShell'

export default function PricingPage() {
  const router = useRouter()

  const goJourney = (step: number) => {
    router.push(`/?journey=${step}`)
  }

  return (
    <StaticPageShell>
      {/* Hero */}
      <section className="text-center px-4 sm:px-6 pt-16 pb-8">
        <div className="text-[11px] font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--tx3, #6b84a8)' }}>
          Per-intent pricing · Pay for outcomes, not time
        </div>
        <h1 className="text-[28px] sm:text-[40px] font-black tracking-tight mb-3" style={{ letterSpacing: '-1px' }}>
          You pay when the AI resolves. Nothing else.
        </h1>
        <p className="text-[14px] sm:text-[16px] mx-auto leading-relaxed" style={{ color: 'var(--tx2, #7a90b5)', maxWidth: 580 }}>
          Traditional IVR bills $0.07–$0.10 per minute — even hold time, even silence, even disconnects. AiIVRs charges per intent resolved. One customer question answered = one intent = one charge.
        </p>
      </section>

      {/* ═══ ALL 4 JOURNEYS ═══ */}
      <section className="max-w-[1000px] mx-auto px-4 sm:px-6 pb-10">
        <div className="text-center mb-6 text-[11px] font-semibold uppercase tracking-widest" style={{ color: 'var(--tx3)' }}>
          4 pricing models — one for every use case
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">

          {/* Journey 1: Lower Cost */}
          <div className="p-4 sm:p-5 rounded-xl border flex flex-col" style={{ background: 'var(--s1, #0d1526)', borderColor: 'rgba(0,201,177,.3)' }}>
            <div className="flex items-center gap-2 mb-3">
              <span className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold" style={{ background: '#00c9b1', color: '#000' }}>1</span>
              <span className="text-[12px] font-bold">Lower Cost</span>
            </div>
            <div className="text-[24px] sm:text-[28px] font-extrabold mb-0.5" style={{ fontFamily: "'JetBrains Mono', monospace", color: '#00c9b1' }}>$0.006</div>
            <div className="text-[10px] mb-3" style={{ color: 'var(--tx3)' }}>per intent · ~35s avg</div>
            <div className="text-[10px] leading-relaxed mb-3 flex-1" style={{ color: 'var(--tx2)' }}>
              Flat rate. Every resolved intent costs $0.006. Disconnects = $0. Hold = $0. Uses Exp 5 (Azure STT + GPT-4o-mini + Azure TTS).
            </div>
            <div className="p-2.5 rounded-lg text-[9px] mb-3" style={{ background: 'var(--s2, #111d30)' }}>
              <div className="flex justify-between mb-1"><span style={{ color: 'var(--tx3)' }}>Traditional (35s)</span><span style={{ color: '#f03060' }}>$0.04</span></div>
              <div className="flex justify-between"><span style={{ color: 'var(--tx3)' }}>AiIVRs</span><span className="font-bold" style={{ color: '#00c9b1' }}>$0.006</span></div>
              <div className="mt-1 font-bold" style={{ color: '#00de7a' }}>85% savings</div>
            </div>
            <button onClick={() => goJourney(0)} className="w-full py-2.5 rounded-lg text-[11px] font-bold cursor-pointer border-none"
              style={{ background: '#00c9b1', color: '#000' }}>▶ Try Lower Cost Demo</button>
          </div>

          {/* Journey 2: Sales Discovery */}
          <div className="p-4 sm:p-5 rounded-xl border flex flex-col" style={{ background: 'var(--s1, #0d1526)', borderColor: 'rgba(0,222,122,.3)' }}>
            <div className="flex items-center gap-2 mb-3">
              <span className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold" style={{ background: '#00de7a', color: '#000' }}>2</span>
              <span className="text-[12px] font-bold">Service → Revenue</span>
            </div>
            <div className="text-[24px] sm:text-[28px] font-extrabold mb-0.5" style={{ fontFamily: "'JetBrains Mono', monospace", color: '#00de7a' }}>$0.006</div>
            <div className="text-[10px] mb-3" style={{ color: 'var(--tx3)' }}>same price + commission on conversions</div>
            <div className="text-[10px] leading-relaxed mb-3 flex-1" style={{ color: 'var(--tx2)' }}>
              Same $0.006/intent. After resolving, AI surfaces ONE CRM offer. Sales leads = free. Commission only on conversions. ~40–50s avg.
            </div>
            <div className="p-2.5 rounded-lg text-[9px] mb-3" style={{ background: 'var(--s2, #111d30)' }}>
              <div className="flex justify-between mb-1"><span style={{ color: 'var(--tx3)' }}>Per-intent</span><span className="font-bold" style={{ color: '#00c9b1' }}>$0.006</span></div>
              <div className="flex justify-between mb-1"><span style={{ color: 'var(--tx3)' }}>Sales leads</span><span className="font-bold" style={{ color: '#00de7a' }}>FREE</span></div>
              <div className="flex justify-between"><span style={{ color: 'var(--tx3)' }}>Commission</span><span className="font-bold" style={{ color: '#f5a623' }}>On conversion only</span></div>
            </div>
            <button onClick={() => goJourney(1)} className="w-full py-2.5 rounded-lg text-[11px] font-bold cursor-pointer border-none"
              style={{ background: '#00de7a', color: '#000' }}>▶ Try Sales Discovery Demo</button>
          </div>

          {/* Journey 3: Frustration Recovery */}
          <div className="p-4 sm:p-5 rounded-xl border flex flex-col" style={{ background: 'var(--s1, #0d1526)', borderColor: 'rgba(240,48,96,.3)' }}>
            <div className="flex items-center gap-2 mb-3">
              <span className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold" style={{ background: '#f03060', color: '#fff' }}>3</span>
              <span className="text-[12px] font-bold">Recover Frustrated</span>
            </div>
            <div className="text-[20px] sm:text-[24px] font-extrabold mb-0.5" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              <span style={{ color: '#00c9b1' }}>$0.006</span>
              <span className="text-[14px]" style={{ color: 'var(--tx3)' }}> → </span>
              <span style={{ color: '#f03060' }}>$0.018</span>
            </div>
            <div className="text-[10px] mb-3" style={{ color: 'var(--tx3)' }}>auto-escalates on frustration · ~35–45s</div>
            <div className="text-[10px] leading-relaxed mb-3 flex-1" style={{ color: 'var(--tx2)' }}>
              Starts at $0.006. Frustration detected → hot-swap to empathetic AI ($0.018). No transfer. Recovery in 3 seconds. 80% of calls stay at base.
            </div>
            <div className="p-2.5 rounded-lg text-[9px] mb-3" style={{ background: 'var(--s2, #111d30)' }}>
              <div className="flex justify-between mb-1"><span style={{ color: 'var(--tx3)' }}>Normal call</span><span className="font-bold" style={{ color: '#00c9b1' }}>$0.006</span></div>
              <div className="flex justify-between mb-1"><span style={{ color: 'var(--tx3)' }}>Escalated call</span><span className="font-bold" style={{ color: '#f03060' }}>$0.018</span></div>
              <div className="flex justify-between"><span style={{ color: 'var(--tx3)' }}>Blended avg</span><span className="font-bold" style={{ color: '#f5a623' }}>~$0.008</span></div>
            </div>
            <button onClick={() => goJourney(2)} className="w-full py-2.5 rounded-lg text-[11px] font-bold cursor-pointer border-none"
              style={{ background: '#f03060', color: '#fff' }}>▶ Try Frustration Demo</button>
          </div>

          {/* Journey 4: Value Routing */}
          <div className="p-4 sm:p-5 rounded-xl border flex flex-col" style={{ background: 'var(--s1, #0d1526)', borderColor: 'rgba(245,166,35,.3)' }}>
            <div className="flex items-center gap-2 mb-3">
              <span className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold" style={{ background: '#f5a623', color: '#000' }}>4</span>
              <span className="text-[12px] font-bold">Route by Value</span>
            </div>
            <div className="text-[20px] sm:text-[24px] font-extrabold mb-0.5" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              <span style={{ color: '#cd7f32' }}>$0.006</span>
              <span className="text-[14px]" style={{ color: 'var(--tx3)' }}> – </span>
              <span style={{ color: '#f5a623' }}>$0.018</span>
            </div>
            <div className="text-[10px] mb-3" style={{ color: 'var(--tx3)' }}>CRM-driven · auto per call · ~35s</div>
            <div className="text-[10px] leading-relaxed mb-3 flex-1" style={{ color: 'var(--tx2)' }}>
              AI tier per caller based on CRM value. Premium gets premium AI. Routine stays cost-efficient. Automatic — no rules to configure.
            </div>
            <div className="p-2.5 rounded-lg text-[9px] mb-3" style={{ background: 'var(--s2, #111d30)' }}>
              <div className="flex justify-between mb-1"><span style={{ color: '#f5a623' }}>🥇 Gold (HNI)</span><span className="font-bold" style={{ color: '#f5a623' }}>$0.018</span></div>
              <div className="flex justify-between mb-1"><span style={{ color: '#c0c0c0' }}>🥈 Silver (Mid)</span><span className="font-bold" style={{ color: 'var(--tx2)' }}>$0.013</span></div>
              <div className="flex justify-between"><span style={{ color: '#cd7f32' }}>🥉 Bronze (Routine)</span><span className="font-bold" style={{ color: 'var(--tx2)' }}>$0.006</span></div>
            </div>
            <button onClick={() => goJourney(3)} className="w-full py-2.5 rounded-lg text-[11px] font-bold cursor-pointer border-none"
              style={{ background: '#f5a623', color: '#000' }}>▶ Try Value Routing Demo</button>
          </div>
        </div>
      </section>

      {/* ═══ WHAT'S INCLUDED ═══ */}
      <section className="max-w-[1000px] mx-auto px-4 sm:px-6 py-10" style={{ borderTop: '1px solid var(--b1, #1c2d45)' }}>
        <h2 className="text-center text-[22px] sm:text-[28px] font-bold mb-6">Every intent includes</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { icon: '🎧', label: 'Speech-to-text', sub: 'Azure, Sarvam, or Whisper' },
            { icon: '🧠', label: 'LLM processing', sub: 'GPT-4o, Gemini, or Sarvam' },
            { icon: '🔊', label: 'Text-to-speech', sub: 'Azure, ElevenLabs, or Sarvam' },
            { icon: '☁️', label: 'Infrastructure', sub: 'Compute, storage, networking' },
            { icon: '🎙️', label: 'Call recording', sub: 'Full audio + transcript' },
            { icon: '📊', label: 'Analytics', sub: 'Intent success, CSAT, containment' },
            { icon: '🌐', label: '59 languages', sub: 'Auto-detected per call' },
            { icon: '🤝', label: 'Agent handoff', sub: 'Full context transfer' },
          ].map((item, i) => (
            <div key={i} className="p-3 sm:p-4 rounded-lg text-center" style={{ background: 'var(--s1)', border: '1px solid var(--b1)' }}>
              <div className="text-[18px] mb-1">{item.icon}</div>
              <div className="text-[11px] font-bold mb-0.5">{item.label}</div>
              <div className="text-[9px]" style={{ color: 'var(--tx3)' }}>{item.sub}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ HOW PER-INTENT WORKS ═══ */}
      <section className="max-w-[1000px] mx-auto px-4 sm:px-6 py-10" style={{ borderTop: '1px solid var(--b1)' }}>
        <h2 className="text-center text-[22px] sm:text-[28px] font-bold mb-2">You pay for outcomes. Everything else is free.</h2>
        <p className="text-center text-[13px] sm:text-[14px] mb-8 mx-auto" style={{ color: 'var(--tx2)', maxWidth: 560 }}>Four scenarios. Only one costs you anything.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { scenario: 'Customer asks "check my balance"', time: '~5 seconds', cost: '$0.006', color: '#00c9b1', free: false },
            { scenario: 'Customer disconnects after 10s', time: '10 seconds', cost: '$0.00', color: '#00de7a', free: true },
            { scenario: 'Customer on hold waiting', time: '3 minutes', cost: '$0.00', color: '#f5a623', free: true },
            { scenario: 'AI can\'t resolve, transfers to agent', time: '45 seconds', cost: '$0.00', color: '#3370E8', free: true },
          ].map((s, i) => (
            <div key={i} className="p-4 rounded-xl border text-center" style={{ background: 'var(--s1)', borderColor: 'var(--b1)' }}>
              <div className="text-[10px] leading-relaxed mb-2 min-h-[32px]" style={{ color: 'var(--tx2)' }}>{s.scenario}</div>
              <div className="text-[9px] mb-2" style={{ color: 'var(--tx3)' }}>{s.time}</div>
              <div className="text-[20px] font-extrabold" style={{ fontFamily: "'JetBrains Mono', monospace", color: s.color }}>{s.cost}</div>
              <div className="text-[9px] mt-1" style={{ color: s.free ? 'var(--tx3)' : '#00c9b1' }}>{s.free ? 'Not resolved — free' : 'Resolved ✓'}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ VS TRADITIONAL ═══ */}
      <section className="max-w-[1000px] mx-auto px-4 sm:px-6 py-10" style={{ borderTop: '1px solid var(--b1)' }}>
        <h2 className="text-center text-[22px] sm:text-[28px] font-bold mb-6">AiIVRs vs Traditional IVR</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-5 rounded-xl border" style={{ background: 'var(--s1)', borderColor: 'rgba(240,48,96,.2)' }}>
            <div className="text-[14px] font-bold mb-3" style={{ color: '#f03060' }}>Traditional IVR</div>
            {['Bills per minute ($0.07–$0.10/min)', 'Hold time costs you', 'Disconnects cost you', 'Silence costs you', 'Transfer to agent still costs you', '25–30% containment rate', 'CSAT: 2.5–3.0', 'Setup: weeks to months'].map((item, i) => (
              <div key={i} className="text-[11px] py-1.5 border-b flex items-center gap-2" style={{ color: 'var(--tx3)', borderColor: 'rgba(28,45,69,.3)' }}>
                <span style={{ color: '#f03060' }}>✗</span> {item}
              </div>
            ))}
          </div>
          <div className="p-5 rounded-xl border" style={{ background: 'var(--s1)', borderColor: 'rgba(0,201,177,.2)' }}>
            <div className="text-[14px] font-bold mb-3" style={{ color: '#00c9b1' }}>AiIVRs</div>
            {['Bills per intent ($0.006–$0.018)', 'Hold time is free', 'Disconnects are free', 'Silence is free', 'Unresolved intents are free', '80%+ containment rate', 'CSAT: 4.0–4.5', 'Setup: 17 minutes'].map((item, i) => (
              <div key={i} className="text-[11px] py-1.5 border-b flex items-center gap-2" style={{ color: 'var(--tx2)', borderColor: 'rgba(28,45,69,.3)' }}>
                <span style={{ color: '#00c9b1' }}>✓</span> {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ CTA ═══ */}
      <section className="max-w-[1000px] mx-auto px-4 sm:px-6 py-10 pb-16">
        <div className="text-center p-8 sm:p-10 rounded-2xl border"
          style={{ background: 'linear-gradient(135deg, rgba(59,130,246,.06), rgba(6,182,212,.04))', borderColor: 'rgba(59,130,246,.1)' }}>
          <h2 className="text-[18px] sm:text-[22px] font-bold mb-2">See the pricing live — on a real call.</h2>
          <p className="text-[12px] sm:text-[13px] mb-5" style={{ color: 'var(--tx3)' }}>Try each journey. Watch the per-intent cost calculate in real-time. Free, no credit card.</p>
          <button onClick={() => router.push('/')} className="px-8 py-3 rounded-[10px] text-[14px] font-bold border-none cursor-pointer" style={{ background: '#00c9b1', color: '#000' }}>
            ▶ Try Live Demo →
          </button>
          <div className="flex gap-3 sm:gap-4 justify-center mt-3.5 flex-wrap text-[10px] sm:text-[11px]" style={{ color: 'var(--tx3)' }}>
            <span>✓ No credit card</span><span>✓ Free 3 months</span><span>✓ Your IVR stays live</span><span>✓ Cancel anytime</span>
          </div>
        </div>
      </section>

      {/* JSON-LD */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org', '@type': 'Product', name: 'AiIVRs AI IVR Platform',
        description: 'Per-intent AI IVR pricing. 4 journey models from $0.006/intent.',
        brand: { '@type': 'Brand', name: 'AiIVRs' },
        offers: { '@type': 'AggregateOffer', priceCurrency: 'USD', lowPrice: '0.006', highPrice: '0.018', offerCount: 4 },
      })}} />
    </StaticPageShell>
  )
}

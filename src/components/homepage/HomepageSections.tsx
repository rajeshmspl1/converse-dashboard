'use client'

interface Props {
  onStartCall: () => void
  onToggleIVRBar: () => void
  onSignUp?: () => void
  onNavigateJourney?: (step: number) => void
}

export default function HomepageSections({ onStartCall, onToggleIVRBar, onSignUp, onNavigateJourney }: Props) {

  const startJourney = (step: number) => {
    onNavigateJourney?.(step)
    onStartCall()
  }
  return (
    <div className="overflow-y-auto flex-1" style={{ background: 'var(--bg)' }}>
      <style>{`
        @keyframes gradPulse { 0%,100% { opacity:1; filter:brightness(1); } 50% { opacity:.85; filter:brightness(1.3); } }
        @keyframes ctaGlow { 0%,100% { box-shadow:0 4px 20px rgba(59,130,246,.3); } 50% { box-shadow:0 4px 32px rgba(59,130,246,.6),0 0 60px rgba(59,130,246,.15); } }
      `}</style>

      {/* ═══ HERO ═══ */}
      <section className="text-center px-4 sm:px-6 pt-12 sm:pt-16 pb-10 sm:pb-12">
        <h1 className="font-black leading-[1.08] mb-3 tracking-tight" style={{ fontSize: 'clamp(28px, 5vw, 52px)', letterSpacing: '-1.5px' }}>
          Transform your IVR to AI IVR.<br />
          <span style={{ background: 'linear-gradient(90deg, #60a5fa, #34d399, #a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', animation: 'gradPulse 3s ease-in-out infinite' }}>
            In 17 minutes. No IT.
          </span>
        </h1>
        <p className="text-[14px] sm:text-[16px] mb-5 mx-auto leading-relaxed" style={{ color: 'rgba(255,255,255,.45)', maxWidth: 560 }}>
          No IT team. No approval. No integration. Free migration. 3-month production pilot in your environment.
        </p>
        <div className="flex justify-center">
          <button onClick={onStartCall}
            className="px-8 sm:px-10 py-3 sm:py-3.5 rounded-[10px] text-[15px] sm:text-[16px] font-bold border-none cursor-pointer transition-all hover:-translate-y-0.5"
            style={{ background: '#3b82f6', color: '#fff', animation: 'ctaGlow 2.5s ease-in-out infinite' }}>
            ▶ Try Live Demo
          </button>
        </div>
      </section>

      {/* ═══ 4 JOURNEY STAT CARDS ═══ */}
      <div className="mx-auto px-4 -mt-4 relative z-[2]" style={{ maxWidth: 820 }}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-px rounded-[14px] overflow-hidden" style={{ background: 'var(--b1)' }}>
          {[
            { icon: '⚡', num: '90%', numColor: '#00c9b1', title: 'Lower per-intent cost', sub: 'Pay per resolution. Not per minute.', tryColor: '#00c9b1', journey: 0 },
            { icon: '💰', num: '$0 risk', numColor: '#00de7a', title: 'Free sales leads from your customers', sub: 'Same price + free leads. We earn only when leads convert.', tryColor: '#00de7a', journey: 1 },
            { icon: '🔥', num: '3.0→4.5', numColor: '#f03060', title: 'Improve IVR CSAT', sub: 'Detect frustration. Recover in 3 seconds.', tryColor: '#f03060', journey: 2 },
            { icon: '🎯', num: 'AI $', numColor: '#f5a623', title: 'Customer value-based routing', sub: 'Premium AI for premium customers. Auto.', tryColor: '#f5a623', journey: 3 },
          ].map((s, i) => (
            <div key={i} onClick={() => startJourney(s.journey)} className="p-4 sm:p-5 text-center cursor-pointer transition-all hover:-translate-y-0.5" style={{ background: 'var(--s1, #0d1526)' }}>
              <div className="text-[18px] sm:text-[20px] mb-1">{s.icon}</div>
              <div className="text-[18px] sm:text-[22px] font-extrabold mb-0.5" style={{ fontFamily: "'JetBrains Mono', monospace", color: s.numColor, letterSpacing: '-1px' }}>{s.num}</div>
              <div className="text-[10px] sm:text-[11px] font-bold mb-1 leading-tight">{s.title}</div>
              <div className="text-[8px] sm:text-[9px] leading-tight mb-1.5" style={{ color: 'var(--tx3, #6b84a8)' }}>{s.sub}</div>
              <div className="text-[9px] font-bold opacity-50 hover:opacity-100 transition-opacity" style={{ color: s.tryColor }}>Try demo →</div>
            </div>
          ))}
        </div>
      </div>

      {/* ═══ WHAT YOU DON'T NEED ═══ */}
      <section className="mx-auto px-4 sm:px-6 py-8 sm:py-10" style={{ maxWidth: 1040 }}>
        <div className="text-center mb-4 text-[11px] font-semibold uppercase tracking-widest" style={{ color: 'var(--tx3, #6b84a8)' }}>
          What you don&apos;t need to get started
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
          {[
            { emoji: '🚫', tt: 'No Data', ts: 'No extraction. No training sets.' },
            { emoji: '🚫', tt: 'No Integration', ts: 'No SIP. No API. No code.' },
            { emoji: '🚫', tt: 'No IT Team', ts: 'CXOs run it themselves.' },
            { emoji: '🚫', tt: 'No Contracts', ts: 'Cancel anytime. No lock-in.' },
            { emoji: '🚫', tt: 'No Upfront Cost', ts: 'Free pre-pilot. 3 months.*' },
            { emoji: '🚫', tt: 'No Vendor Lock-In', ts: 'BYO carrier, cloud, LLM, CCaaS, CRM & more.' },
            { emoji: '🚫', tt: 'No Minimum', ts: 'Start with 1 IVR. Scale later.' },
          ].map((t, i) => (
            <div key={i} className="px-2 py-3 sm:py-4 rounded-[10px] text-center border transition-all hover:-translate-y-0.5 hover:border-[#00c9b1]"
              style={{ background: 'var(--s1, #0d1526)', borderColor: 'var(--b1, #1c2d45)' }}>
              <div className="text-[18px] sm:text-[22px] mb-1">{t.emoji}</div>
              <div className="text-[10px] sm:text-[11px] font-bold mb-0.5" style={{ color: '#00c9b1' }}>{t.tt}</div>
              <div className="text-[8px] sm:text-[9px] leading-tight" style={{ color: 'var(--tx3, #6b84a8)' }}>{t.ts}</div>
            </div>
          ))}
        </div>
        <div className="text-right text-[8px] mt-1" style={{ color: 'var(--tx3)' }}>*conditions apply</div>
      </section>

      <hr style={{ border: 'none', height: 1, background: 'var(--b1, #1c2d45)', margin: 0 }} />

      {/* ═══ 17-MINUTE TIMELINE ═══ */}
      <section className="mx-auto px-4 sm:px-6 py-10 sm:py-14" style={{ maxWidth: 940 }}>
        <div className="text-center mb-2 text-[11px] font-semibold uppercase tracking-widest" style={{ color: 'var(--tx3)' }}>From IVR number to production</div>
        <h2 className="text-center text-[22px] sm:text-[28px] font-bold mb-2">How 17 minutes works.</h2>
        <p className="text-center text-[13px] sm:text-[14px] mb-8 mx-auto leading-relaxed" style={{ color: 'var(--tx2, #7a90b5)', maxWidth: 560 }}>
          You give us the phone number. We handle everything else.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { icon: '📞', time: '0 min', title: 'Share your IVR number', desc: 'Just the number. We handle the rest.', color: '#00c9b1' },
            { icon: '🎧', time: '5 min', title: 'Hear AI on your calls', desc: 'AI answers real intents — balance, claims, plans.', color: '#3370E8' },
            { icon: '🔬', time: '10 min', title: 'Validate on real flows', desc: 'Run every customer journey end-to-end.', color: '#f5a623' },
            { icon: '✅', time: '17 min', title: 'Go live', desc: 'Dashboards, compliance, multilingual — all active.', color: '#00de7a' },
          ].map((step, i) => (
            <div key={i} className="text-center">
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-[16px] mx-auto mb-2" style={{ background: step.color }}>{step.icon}</div>
              <div className="text-[9px] font-semibold mb-0.5" style={{ color: step.color }}>{step.time}</div>
              <div className="text-[11px] sm:text-[12px] font-bold mb-1">{step.title}</div>
              <div className="text-[9px] sm:text-[10px] px-1 leading-snug" style={{ color: 'var(--tx3)' }}>{step.desc}</div>
            </div>
          ))}
        </div>
        <div className="text-center mt-5">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border text-[11px] font-semibold"
            style={{ borderColor: 'rgba(0,222,122,.2)', background: 'rgba(0,222,122,.04)', color: '#00de7a' }}>
            🆓 Free at every stage for up to 3 months
          </div>
        </div>
        <div className="text-center mt-6">
          <button onClick={onStartCall} className="px-8 py-3 text-[14px] rounded-[10px] border-none font-bold cursor-pointer"
            style={{ background: '#00c9b1', color: '#000', boxShadow: '0 4px 16px rgba(0,201,177,.3)' }}>▶ Try Live Demo</button>
        </div>
      </section>

      <hr style={{ border: 'none', height: 1, background: 'var(--b1)', margin: 0 }} />

      {/* ═══ 5 INDUSTRY FIRSTS ═══ */}
      <section className="mx-auto px-4 sm:px-6 py-10 sm:py-14" style={{ maxWidth: 940 }}>
        <div className="text-center mb-2 text-[11px] font-semibold uppercase tracking-widest" style={{ color: 'var(--tx3)' }}>5 Industry Firsts — no other IVR vendor offers these</div>
        <h2 className="text-center text-[22px] sm:text-[28px] font-bold mb-2">Experience each one — live.</h2>
        <p className="text-center text-[13px] sm:text-[14px] mb-8 mx-auto leading-relaxed" style={{ color: 'var(--tx2)', maxWidth: 560 }}>
          Each journey demonstrates a capability no other IVR vendor has. Try them all in under 5 minutes.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {([
            { icon: '⚡', name: 'Pay per resolution, not per minute', desc: 'Resolve intents in under 5 seconds. Disconnects cost zero. $0.006/intent.', border: 'rgba(0,201,177,.2)', cta: '#00c9b1', full: false, journey: 0 },
            { icon: '🎯', name: 'AI spend follows customer value', desc: 'Premium customers get premium AI ($0.018). Routine stays cost-efficient ($0.006). Auto.', border: 'rgba(245,166,35,.2)', cta: '#f5a623', full: false, journey: 3 },
            { icon: '🔥', name: 'Recover frustrated callers in 3 seconds', desc: 'Detect frustration mid-call. Switch to empathetic AI instantly. No transfer.', border: 'rgba(240,48,96,.2)', cta: '#f03060', full: false, journey: 2 },
            { icon: '💰', name: 'Turn service calls into revenue — at zero risk', desc: 'Resolve first. One CRM-driven offer. Same price. Free leads. Commission only on conversions.', border: 'rgba(0,222,122,.2)', cta: '#00de7a', full: false, journey: 1 },
            { icon: '🔧', name: 'BYO everything', desc: 'Carrier · cloud · LLM · CCaaS · CRM · telephony & more. No vendor lock-in.', border: 'rgba(139,92,246,.2)', cta: '#8b5cf6', full: true, journey: 0 },
          ] as const).map((j, i) => (
            <div key={i} onClick={() => startJourney(j.journey)}
              className={`p-4 sm:p-5 rounded-xl cursor-pointer transition-all hover:-translate-y-0.5 ${j.full ? 'sm:col-span-2' : ''}`}
              style={{ background: 'var(--s1)', border: `1px solid ${j.border}` }}>
              <div className="text-[18px] sm:text-[20px] mb-1">{j.icon}</div>
              <div className="text-[13px] sm:text-[14px] font-bold mb-1">{j.name}</div>
              <div className="text-[10px] sm:text-[11px] leading-relaxed mb-2" style={{ color: 'var(--tx3)' }}>{j.desc}</div>
              <div className="text-[10px] font-semibold" style={{ color: j.cta }}>Try demo →</div>
            </div>
          ))}
        </div>
      </section>

      <hr style={{ border: 'none', height: 1, background: 'var(--b1)', margin: 0 }} />

      {/* ═══ CSAT SECTION ═══ */}
      <section className="mx-auto px-4 sm:px-6 py-10 sm:py-14" style={{ maxWidth: 940 }}>
        <div className="text-center mb-2 text-[11px] font-semibold uppercase tracking-widest" style={{ color: 'var(--tx3)' }}>Measurable impact — per call, per intent</div>
        <h2 className="text-center text-[22px] sm:text-[28px] font-bold mb-2">Improve your IVR CSAT from 3.0 to 4.5</h2>
        <p className="text-center text-[13px] sm:text-[14px] mb-8 mx-auto leading-relaxed" style={{ color: 'var(--tx2)', maxWidth: 560 }}>
          Three capabilities that move the CSAT needle. Measurable, auditable, on every single call.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { num: '4x', numColor: '#00c9b1', label: 'Faster resolution', pct: 85, barColor: '#00c9b1', desc: 'Under 5 seconds vs 2.5 min IVR average. Customer talks, AI answers.' },
            { num: '3s', numColor: '#f03060', label: 'Frustration recovery', pct: 70, barColor: '#f03060', desc: 'Detect frustration mid-call. Switch to empathetic AI in 3 seconds.' },
            { num: '80%', numColor: '#f5a623', label: 'Containment rate', pct: 80, barColor: '#f5a623', desc: 'vs 25–30% industry avg. 80% resolved without a human agent.' },
          ].map((c, i) => (
            <div key={i} className="p-5 rounded-xl border text-center" style={{ background: 'var(--s1)', borderColor: 'var(--b1)' }}>
              <div className="text-[28px] sm:text-[32px] font-extrabold" style={{ fontFamily: "'JetBrains Mono', monospace", color: c.numColor }}>{c.num}</div>
              <div className="text-[11px] font-bold mb-1">{c.label}</div>
              <div className="h-[6px] rounded-full overflow-hidden my-3" style={{ background: 'var(--b1)' }}>
                <div className="h-full rounded-full" style={{ width: `${c.pct}%`, background: c.barColor }} />
              </div>
              <div className="text-[10px] sm:text-[11px] leading-relaxed" style={{ color: 'var(--tx3)' }}>{c.desc}</div>
            </div>
          ))}
        </div>
      </section>

      <hr style={{ border: 'none', height: 1, background: 'var(--b1)', margin: 0 }} />

      {/* ═══ INDUSTRIES ═══ */}
      <section className="mx-auto px-4 sm:px-6 py-10 sm:py-14" style={{ maxWidth: 940 }}>
        <div className="text-center mb-2 text-[11px] font-semibold uppercase tracking-widest" style={{ color: 'var(--tx3)' }}>Choose your context</div>
        <h2 className="text-center text-[22px] sm:text-[28px] font-bold mb-2">Hear it in your industry</h2>
        <p className="text-center text-[13px] sm:text-[14px] mb-8 mx-auto leading-relaxed" style={{ color: 'var(--tx2)', maxWidth: 560 }}>
          Click an industry — hear a live AI call handling your sector&apos;s real customer intents.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[
            { emoji: '🏦', name: 'Banking & Finance', intents: 'Account balance · Card blocking · Loan EMI · Cheque book' },
            { emoji: '🛡️', name: 'Insurance', intents: 'Claim status · Policy renewal · Premium payment' },
            { emoji: '🏥', name: 'Healthcare', intents: 'Appointments · Prescriptions · Lab results' },
            { emoji: '📱', name: 'Telecom', intents: 'Plan upgrade · Data usage · SIM replacement' },
            { emoji: '🛒', name: 'E-Commerce', intents: 'Order tracking · Return request · Refund status' },
            { emoji: '🏨', name: 'Hospitality', intents: 'Room booking · Room service · Concierge' },
          ].map((ind, i) => (
            <div key={i} onClick={onStartCall}
              className="p-5 sm:p-6 rounded-xl border text-center cursor-pointer transition-all hover:-translate-y-1 hover:border-[#00c9b1]"
              style={{ background: 'var(--s1)', borderColor: 'var(--b1)' }}>
              <div className="text-[24px] sm:text-[28px] mb-2">{ind.emoji}</div>
              <h4 className="text-[13px] sm:text-[14px] font-bold mb-1">{ind.name}</h4>
              <p className="text-[9px] sm:text-[10px] mb-2.5 leading-relaxed" style={{ color: 'var(--tx3)' }}>{ind.intents}</p>
              <span className="px-3 py-1.5 rounded-md text-[10px] font-semibold" style={{ background: 'rgba(0,201,177,.1)', color: '#00c9b1' }}>Try Live Demo →</span>
            </div>
          ))}
        </div>
      </section>

      <hr style={{ border: 'none', height: 1, background: 'var(--b1)', margin: 0 }} />

      {/* ═══ CX CHECKLIST ═══ */}
      <section className="mx-auto px-4 sm:px-6 py-10 sm:py-14" style={{ maxWidth: 940 }}>
        <div className="text-center mb-2 text-[11px] font-semibold uppercase tracking-widest" style={{ color: 'var(--tx3)' }}>Built for regulated industries</div>
        <h2 className="text-center text-[22px] sm:text-[28px] font-bold mb-2">Your CX team&apos;s checklist. Answered.</h2>
        <p className="text-center text-[13px] sm:text-[14px] mb-8 mx-auto leading-relaxed" style={{ color: 'var(--tx2)', maxWidth: 560 }}>
          Every question your compliance and IT team will ask — already handled.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[
            { icon: '🛡️', title: 'Data stays in your jurisdiction', desc: 'Shared, dedicated, or on-premise. Voice data never leaves your region.', tags: ['Shared', 'Dedicated', 'On-Prem', 'India · UAE · EU · US'] },
            { icon: '🎙️', title: 'Every call recorded and scored', desc: 'Full recordings, transcripts, intent success, containment rate. QA built in.', tags: ['Recordings', 'Transcripts', 'Intent analytics', 'CSAT'] },
            { icon: '🤝', title: 'Seamless agent handoff', desc: 'AI confidence drops → call transfers with full context. Zero dead air.', tags: ['Clean transfer', 'Full context', 'Configurable'] },
            { icon: '🔄', title: 'Your IVR stays live — untouched', desc: 'We operate alongside your existing IVR. Roll back instantly anytime.', tags: ['IVR untouched', 'Instant rollback', 'Run parallel'] },
            { icon: '📊', title: 'Per-intent pricing — industry first', desc: '$0.006–$0.045 per resolved intent. Disconnects cost zero.', tags: ['$0.006 Essential', '$0.045 Ultra'], hl: true },
            { icon: '🌐', title: '59 languages — no extra setup', desc: 'Hindi, Tamil, Spanish, Arabic, Mandarin + 54 more. Auto-detected.', tags: ['Auto detect', '59 languages', 'No config'] },
            { icon: '🔧', title: 'BYO everything', desc: 'Your carrier, cloud, LLMs, CCaaS, CRM & more. Plug and play.', tags: ['BYO Carrier', 'BYO Cloud', 'BYO LLM', 'BYO CCaaS', 'BYO CRM'] },
            { icon: '📈', title: 'CSAT 3.0 → 4.5 — measurable', desc: 'Per-call CSAT scoring. Faster resolution + frustration recovery.', tags: ['3.0 → 4.5', 'Per call', 'Auditable'], hl: true },
          ].map((cx, i) => (
            <div key={i} className="p-4 sm:p-5 rounded-xl border" style={{ background: 'var(--s1)', borderColor: 'var(--b1)' }}>
              <div className="text-[18px] sm:text-[20px] mb-2">{cx.icon}</div>
              <h4 className="text-[12px] sm:text-[13px] font-bold mb-1">{cx.title}</h4>
              <p className="text-[10px] sm:text-[11px] leading-relaxed mb-2" style={{ color: 'var(--tx3)' }}>{cx.desc}</p>
              <div className="flex gap-1 flex-wrap">
                {cx.tags.map((tag, ti) => (
                  <span key={ti} className="px-2 py-0.5 rounded text-[8px]"
                    style={{ background: cx.hl ? 'rgba(0,201,177,.1)' : 'var(--s2, #111d30)', color: cx.hl ? '#00c9b1' : 'var(--tx3)' }}>{tag}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <hr style={{ border: 'none', height: 1, background: 'var(--b1)', margin: 0 }} />

      {/* ═══ PRICING TABLE ═══ */}
      <section className="mx-auto px-4 sm:px-6 py-10 sm:py-14" style={{ maxWidth: 940 }}>
        <div className="text-center mb-2 text-[11px] font-semibold uppercase tracking-widest" style={{ color: 'var(--tx3)' }}>Transparent · No surprises</div>
        <h2 className="text-center text-[22px] sm:text-[28px] font-bold mb-2">Pay per intent resolved. Not per minute.</h2>
        <p className="text-center text-[13px] sm:text-[14px] mb-8 mx-auto leading-relaxed" style={{ color: 'var(--tx2)', maxWidth: 560 }}>
          Traditional IVR ports bill $0.07–$0.10/min regardless. With AiIVRs, idle calls cost zero.
        </p>
        {/* Mobile cards */}
        <div className="sm:hidden flex flex-col gap-2">
          {[
            { name: 'Ultra', sub: 'Premium', stack: 'ElevenLabs · GPT-4o-mini', price: '$0.045', latency: '~700ms', color: '#f03060' },
            { name: 'Conversational', sub: 'NRI', stack: 'GPT-4o Realtime', price: '$0.018', latency: '~300ms', color: '#f5a623' },
            { name: 'Gemini', sub: 'Popular', stack: 'Gemini 2.5 Flash', price: '$0.013', latency: '~300ms', color: '#00de7a', pop: true },
            { name: 'Sarvam', sub: 'Indic', stack: 'Sarvam · GPT-4o-mini', price: '$0.006', latency: '~800ms', color: '#3d85e0' },
            { name: 'Essential', sub: 'Functional', stack: 'Azure STT · GPT-4o-mini', price: '$0.006', latency: '~900ms', color: '#8b5cf6' },
          ].map((r, i) => (
            <div key={i} className="p-4 rounded-xl border" style={{ background: r.pop ? 'rgba(0,201,177,.03)' : 'var(--s1)', borderColor: 'var(--b1)' }}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[14px] font-bold" style={{ color: r.color }}>{r.name} <span className="text-[9px] font-normal" style={{ color: r.pop ? '#00c9b1' : 'var(--tx3)' }}>{r.sub}</span></span>
                <span className="text-[16px] font-bold" style={{ fontFamily: "'JetBrains Mono', monospace", color: r.pop ? '#00c9b1' : 'var(--tx2)' }}>{r.price}</span>
              </div>
              <div className="text-[10px]" style={{ color: 'var(--tx3)' }}>{r.stack} · {r.latency}</div>
            </div>
          ))}
        </div>
        {/* Desktop table */}
        <div className="hidden sm:block rounded-xl border overflow-hidden" style={{ borderColor: 'var(--b1)' }}>
          <table className="w-full" style={{ borderCollapse: 'collapse' }}>
            <thead><tr style={{ background: 'var(--s1)' }}>
              {['#', 'Experience', 'AI Stack', 'Price/intent', 'Latency'].map((h, i) => (
                <th key={i} className={`px-4 py-3 text-[10px] font-semibold uppercase tracking-wide ${i >= 3 ? 'text-right' : 'text-left'}`}
                  style={{ color: 'var(--tx3)', borderBottom: '1px solid var(--b1)' }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {[
                { n: 1, name: 'Ultra', sub: 'Premium', stack: 'ElevenLabs · GPT-4o-mini · Azure STT', price: '$0.045', latency: '~700ms', color: '#f03060' },
                { n: 2, name: 'Conversational', sub: 'NRI', stack: 'GPT-4o Realtime (end-to-end)', price: '$0.018', latency: '~300ms', color: '#f5a623' },
                { n: 3, name: 'Gemini', sub: 'Popular', stack: 'Gemini 2.5 Flash (end-to-end)', price: '$0.013', latency: '~300ms', color: '#00de7a', pop: true },
                { n: 4, name: 'Sarvam', sub: 'Indic', stack: 'Sarvam · GPT-4o-mini · Sarvam', price: '$0.006', latency: '~800ms', color: '#3d85e0' },
                { n: 5, name: 'Essential', sub: 'Functional', stack: 'Azure STT · GPT-4o-mini · Azure TTS', price: '$0.006', latency: '~900ms', color: '#8b5cf6' },
              ].map((r) => (
                <tr key={r.n} style={{ background: r.pop ? 'rgba(0,201,177,.03)' : 'transparent' }}>
                  <td className="px-4 py-3.5 text-[12px]" style={{ borderBottom: '1px solid rgba(28,45,69,.4)', color: 'var(--tx2)' }}>{r.n}</td>
                  <td className="px-4 py-3.5 text-[13px] font-bold" style={{ borderBottom: '1px solid rgba(28,45,69,.4)', color: r.color }}>{r.name} <span className="text-[9px] font-normal" style={{ color: r.pop ? '#00c9b1' : 'var(--tx3)' }}>{r.sub}</span></td>
                  <td className="px-4 py-3.5 text-[12px]" style={{ borderBottom: '1px solid rgba(28,45,69,.4)', color: 'var(--tx2)' }}>{r.stack}</td>
                  <td className="px-4 py-3.5 text-right text-[12px] font-bold" style={{ borderBottom: '1px solid rgba(28,45,69,.4)', color: r.pop ? '#00c9b1' : 'var(--tx2)' }}>{r.price}</td>
                  <td className="px-4 py-3.5 text-right text-[12px]" style={{ borderBottom: '1px solid rgba(28,45,69,.4)', color: 'var(--tx2)' }}>{r.latency}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-4 py-2.5 text-[9px]" style={{ background: 'var(--s2)', color: 'var(--tx3)', borderTop: '1px solid var(--b1)' }}>All prices include STT + LLM + TTS + infrastructure. 35s avg/intent.</div>
        </div>
      </section>

      <hr style={{ border: 'none', height: 1, background: 'var(--b1)', margin: 0 }} />

      {/* ═══ CHOOSE YOUR MODEL (Option 4) ═══ */}
      <section className="mx-auto px-4 sm:px-6 py-10 sm:py-14" style={{ maxWidth: 940 }}>
        <div className="text-center mb-2 text-[11px] font-semibold uppercase tracking-widest" style={{ color: 'var(--tx3)' }}>Same savings. Free upside. Zero risk.</div>
        <h2 className="text-center text-[22px] sm:text-[28px] font-bold mb-2">Choose your model</h2>
        <p className="text-center text-[13px] sm:text-[14px] mb-8 mx-auto leading-relaxed" style={{ color: 'var(--tx2)', maxWidth: 560 }}>
          Both models give you 90% savings. Model B adds free sales leads — we earn only when they convert.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-5 sm:p-6 rounded-[14px] border relative" style={{ background: 'var(--s1)', borderColor: 'var(--b1)' }}>
            <div className="absolute -top-2.5 left-5 text-[9px] font-bold px-2.5 py-0.5 rounded" style={{ background: '#3370E8', color: '#fff' }}>Cost reduction</div>
            <div className="mt-2" />
            <div className="text-[16px] sm:text-[18px] font-bold mb-1" style={{ color: '#3370E8' }}>AI IVR</div>
            <div className="text-[22px] sm:text-[24px] font-extrabold mb-1" style={{ fontFamily: "'JetBrains Mono', monospace" }}>$0.006</div>
            <div className="text-[11px] mb-4" style={{ color: 'var(--tx3)' }}>per intent resolved</div>
            <ul className="space-y-2 mb-5">
              {['90% savings vs current IVR', 'Resolve in under 5 seconds', 'Predictable per-intent billing', 'No data or integration needed', 'Free migration + 3-month pilot', 'CSAT improvement 3.0 → 4.5'].map((li, i) => (
                <li key={i} className="text-[11px] sm:text-[12px] flex items-center gap-2 pb-2 border-b" style={{ color: 'var(--tx2)', borderColor: 'rgba(28,45,69,.3)' }}>
                  <span className="text-[11px] font-bold" style={{ color: '#00c9b1' }}>✓</span> {li}
                </li>
              ))}
            </ul>
            <button onClick={() => startJourney(0)} className="w-full py-3 rounded-lg text-[13px] font-bold cursor-pointer border-none" style={{ background: '#3370E8', color: '#fff' }}>Start with AI IVR →</button>
          </div>
          <div className="p-5 sm:p-6 rounded-[14px] border relative" style={{ background: 'var(--s1)', borderColor: '#00de7a' }}>
            <div className="absolute -top-2.5 left-5 text-[9px] font-bold px-2.5 py-0.5 rounded" style={{ background: '#00de7a', color: '#000' }}>Cost reduction + revenue</div>
            <div className="mt-2" />
            <div className="text-[16px] sm:text-[18px] font-bold mb-1" style={{ color: '#00de7a' }}>AI IVR + Sales Discovery</div>
            <div className="text-[22px] sm:text-[24px] font-extrabold mb-1" style={{ fontFamily: "'JetBrains Mono', monospace" }}>$0.006</div>
            <div className="text-[11px] mb-4" style={{ color: 'var(--tx3)' }}>same per-intent price + free sales leads</div>
            <ul className="space-y-2 mb-5">
              {['Same 90% savings as AI IVR', 'Sales leads at zero extra cost', 'From YOUR customers, YOUR CRM data', 'Commission only on conversions', 'No conversion = zero risk', 'Resolve first, one offer second', 'CSAT protected — always'].map((li, i) => (
                <li key={i} className="text-[11px] sm:text-[12px] flex items-center gap-2 pb-2 border-b" style={{ color: 'var(--tx2)', borderColor: 'rgba(28,45,69,.3)' }}>
                  <span className="text-[11px] font-bold" style={{ color: '#00c9b1' }}>✓</span> {li}
                </li>
              ))}
            </ul>
            <button onClick={() => startJourney(1)} className="w-full py-3 rounded-lg text-[13px] font-bold cursor-pointer border-none" style={{ background: '#00de7a', color: '#000' }}>Add Sales Discovery — free →</button>
          </div>
        </div>
        <div className="text-center mt-4 p-3 rounded-[10px]" style={{ border: '1px dashed rgba(0,222,122,.2)', background: 'rgba(0,222,122,.03)' }}>
          <div className="text-[12px] font-semibold mb-1" style={{ color: '#00de7a' }}>Why would I not pick Model B?</div>
          <div className="text-[10px] sm:text-[11px]" style={{ color: 'var(--tx3)' }}>Same price. Same savings. Free leads. Commission only on conversions. Zero downside.</div>
        </div>
      </section>

      <hr style={{ border: 'none', height: 1, background: 'var(--b1)', margin: 0 }} />

      {/* ═══ FAQ PREVIEW ═══ */}
      <section className="mx-auto px-4 sm:px-6 py-10 sm:py-14" style={{ maxWidth: 940 }}>
        <div className="text-center mb-2 text-[11px] font-semibold uppercase tracking-widest" style={{ color: 'var(--tx3)' }}>67 questions answered</div>
        <h2 className="text-center text-[22px] sm:text-[28px] font-bold mb-2">Frequently asked questions</h2>
        <p className="text-center text-[13px] sm:text-[14px] mb-8 mx-auto leading-relaxed" style={{ color: 'var(--tx2)', maxWidth: 560 }}>
          Everything CX managers, CFOs, and IT heads ask — answered.
        </p>
        <div className="max-w-[700px] mx-auto">
          {[
            { q: 'How do you convert my IVR with just a phone number?', a: 'This is our proprietary technology. Book a 15-minute demo and we\'ll show you live on your own IVR number.' },
            { q: 'What counts as a resolved intent?', a: 'A customer asks for something and the AI completes it. If the AI can\'t resolve, you\'re credited back.' },
            { q: 'What if the customer disconnects early?', a: 'Zero cost. You only pay for resolved intents. Hang-ups, idle time — all free.' },
            { q: 'Won\'t upselling during support annoy customers?', a: 'AiIVRs resolves the support intent first, then surfaces ONE contextual offer. Sales Discovery is free — commission only on conversions.' },
            { q: 'How long does it really take to go live?', a: '17 minutes from IVR number to live AI. Not a POC — live on real calls.' },
            { q: 'Do I need my IT team?', a: 'No. Your CX team manages everything. No developers, no IT tickets, no approval cycles.' },
          ].map((faq, i) => (
            <div key={i} className="py-3.5 border-b" style={{ borderColor: 'var(--b1)' }}>
              <div className="text-[12px] sm:text-[13px] font-bold mb-1">{faq.q}</div>
              <div className="text-[10px] sm:text-[11px] leading-relaxed" style={{ color: 'var(--tx3)' }}>{faq.a}</div>
            </div>
          ))}
          <div className="text-center mt-5">
            <a href="/faq" className="text-[13px] font-semibold" style={{ color: '#00c9b1' }}>See all 67 questions →</a>
          </div>
        </div>
      </section>

      <hr style={{ border: 'none', height: 1, background: 'var(--b1)', margin: 0 }} />

      {/* ═══ FINAL CTA ═══ */}
      <section className="mx-auto px-4 sm:px-6 pb-16" style={{ maxWidth: 940 }}>
        <div className="text-center p-8 sm:p-12 rounded-2xl border"
          style={{ background: 'linear-gradient(135deg, rgba(59,130,246,.06), rgba(6,182,212,.04))', borderColor: 'rgba(59,130,246,.1)' }}>
          <h2 className="text-[20px] sm:text-[24px] font-bold mb-2">Transform your IVR to AI IVR. In 17 minutes. No IT.</h2>
          <p className="text-[12px] sm:text-[13px] mb-5" style={{ color: 'var(--tx3)' }}>90% lower cost. Better CSAT. Free sales leads — we earn only when they convert.</p>
          <div className="flex justify-center">
            <button onClick={onStartCall} className="px-8 py-3.5 rounded-[10px] text-[14px] sm:text-[15px] font-bold border-none cursor-pointer"
              style={{ background: '#00c9b1', color: '#000', boxShadow: '0 4px 16px rgba(0,201,177,.3)' }}>▶ Try Live Demo</button>
          </div>
          <div className="flex gap-3 sm:gap-4 justify-center mt-3.5 flex-wrap text-[10px] sm:text-[11px]" style={{ color: 'var(--tx3)' }}>
            <span>✓ No credit card</span><span>✓ Free 3 months</span><span>✓ Your IVR stays live</span><span>✓ Cancel anytime</span>
          </div>
        </div>
      </section>

      <div className="h-16" />
    </div>
  )
}

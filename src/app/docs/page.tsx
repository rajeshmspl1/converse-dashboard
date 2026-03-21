'use client'
import Link from 'next/link'
import PageShell from '@/components/PageShell'

const LLM_STACK = [
  {
    label: 'Speech-to-Text (STT)', color: '#3370e8', title: 'Listens & transcribes',
    desc: 'Converts customer speech to text in real-time. Supports 10+ Indian languages.',
    providers: ['Azure Speech', 'Sarvam Saarika', 'Deepgram'],
  },
  {
    label: 'Language Model (LLM)', color: '#8a4ee8', title: 'Thinks & decides',
    desc: 'Understands intent, generates response, navigates IVR logic. Switchable mid-call.',
    providers: ['GPT-4o', 'GPT-4o Realtime', 'Gemini 2.5'],
  },
  {
    label: 'Text-to-Speech (TTS)', color: '#18c48a', title: 'Speaks back',
    desc: 'Converts AI response to natural speech. Multiple voices, languages, emotions.',
    providers: ['Azure TTS', 'Sarvam Bulbul', 'ElevenLabs'],
  },
]

const FIRSTS = [
  { icon: '⚡', title: 'Per-Intent Pricing', desc: 'Pay per resolved business action. Not per minute. Disconnects cost zero. Industry\'s first outcome-based IVR pricing.', color: '#18c48a', href: '/' },
  { icon: '🎯', title: 'CRM Value Routing', desc: 'Gold customers get Exp 2 (₹1.47). Bronze gets Exp 5 (₹0.47). AI quality adapts per call based on CRM tier — zero configuration.', color: '#e09820', href: '/' },
  { icon: '🔥', title: 'In-Call Escalation', desc: 'AI detects frustration mid-call and instantly upgrades the experience tier. No hold music, no transfer, no dead air. Hot-swap.', color: '#ef4444', href: '/' },
  { icon: '💰', title: 'Sales Discovery', desc: 'AI analyzes CRM and recent transactions during the call. Detects upsell opportunities. Creates leads. Commission per conversion.', color: '#22c55e', href: '/' },
]

const SECURITY = [
  { title: 'Data Sovereignty', desc: 'Choose shared, dedicated, or on-premise deployment. Data never leaves your chosen region. India, UAE, EU.' },
  { title: 'Tenant Isolation', desc: 'Each tenant gets a separate database. No data mixing. Full audit trail. Per-tenant encryption keys.' },
  { title: 'Compliance', desc: 'SEBI/RBI (banking), IRDAI (insurance), HIPAA-ready (healthcare). Full call recording and transcription.' },
]

const APIS = [
  { name: 'Session API', desc: 'Create sessions, track intents, get transcripts, manage recordings. RESTful. JSON responses.', endpoint: 'POST /api/v1/sessions/create' },
  { name: 'Analytics API', desc: 'Intent success rates, containment, cost tracking, CSAT proxy, call volume trends.', endpoint: 'GET /api/v1/analytics/dashboard' },
  { name: 'Recordings API', desc: 'Stream or download recordings, get transcripts, access intent-tagged segments.', endpoint: 'GET /api/v1/recordings/{session_id}' },
  { name: 'Webhook Events', desc: 'Real-time events for call start, intent detected, escalation, sales lead, call end.', endpoint: 'POST {your-url}/webhook' },
]

export default function DocsPage() {
  return (
    <PageShell>
      {/* Hero */}
      <div className="max-w-[940px] mx-auto px-6 pt-12 pb-8 text-center">
        <div className="text-[11px] font-semibold uppercase tracking-[2px] mb-2" style={{ color: 'var(--dim)' }}>
          How it works
        </div>
        <h1 className="text-[32px] font-bold mb-3" style={{ color: 'var(--bright)' }}>Everything you need to know</h1>
        <p className="text-[14px] max-w-[560px] mx-auto leading-relaxed" style={{ color: 'var(--text)' }}>
          Built for CX leaders, not engineers. No IT dependency. No integration project.
        </p>
      </div>

      {/* Multi-Modal LLM Stack */}
      <div className="max-w-[940px] mx-auto px-6 pb-14">
        <h2 className="text-[20px] font-bold mb-5 flex items-center gap-2" style={{ color: 'var(--bright)' }}>
          🧠 Multi-Modal LLM Stack
        </h2>
        <p className="text-[12px] leading-relaxed mb-6" style={{ color: 'var(--dim)' }}>
          Every call is powered by three AI components working together. You choose the combination — or let CRM Value Routing choose automatically per customer.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {LLM_STACK.map(s => (
            <div key={s.label} className="rounded-xl p-5 border" style={{ background: 'var(--card)', borderColor: 'var(--b1)' }}>
              <div className="text-[10px] font-bold uppercase tracking-[1px] mb-2" style={{ color: s.color }}>{s.label}</div>
              <div className="text-[14px] font-bold mb-2" style={{ color: 'var(--bright)' }}>{s.title}</div>
              <div className="text-[11px] leading-relaxed mb-3" style={{ color: 'var(--dim)' }}>{s.desc}</div>
              <div className="flex flex-wrap gap-1.5">
                {s.providers.map(p => (
                  <span key={p} className="px-2 py-0.5 rounded text-[8px]"
                    style={{ background: 'var(--card2)', color: 'var(--dim)' }}>{p}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4 Industry Firsts */}
      <div className="border-t" style={{ borderColor: 'var(--b1)' }}>
        <div className="max-w-[940px] mx-auto px-6 py-14">
          <h2 className="text-[20px] font-bold mb-5 flex items-center gap-2" style={{ color: 'var(--bright)' }}>
            🏆 Four Industry Firsts
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {FIRSTS.map(f => (
              <Link key={f.title} href={f.href}
                className="rounded-xl p-5 border no-underline transition-all hover:translate-y-[-2px]"
                style={{ background: 'var(--card)', borderColor: `${f.color}33` }}>
                <div className="text-[22px] mb-2">{f.icon}</div>
                <div className="text-[15px] font-bold mb-2" style={{ color: 'var(--bright)' }}>{f.title}</div>
                <div className="text-[11px] leading-relaxed" style={{ color: 'var(--dim)' }}>{f.desc}</div>
                <div className="mt-3 text-[10px] font-semibold" style={{ color: f.color }}>Try it →</div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Security & Compliance */}
      <div className="border-t" style={{ borderColor: 'var(--b1)' }}>
        <div className="max-w-[940px] mx-auto px-6 py-14">
          <h2 className="text-[20px] font-bold mb-5 flex items-center gap-2" style={{ color: 'var(--bright)' }}>
            🛡️ Security & Compliance
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {SECURITY.map(s => (
              <div key={s.title} className="rounded-xl p-5 border" style={{ background: 'var(--card)', borderColor: 'var(--b1)' }}>
                <div className="text-[13px] font-bold mb-2" style={{ color: 'var(--bright)' }}>{s.title}</div>
                <div className="text-[11px] leading-relaxed" style={{ color: 'var(--dim)' }}>{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Developer APIs */}
      <div className="border-t" style={{ borderColor: 'var(--b1)' }}>
        <div className="max-w-[940px] mx-auto px-6 py-14">
          <h2 className="text-[20px] font-bold mb-2 flex items-center gap-2" style={{ color: 'var(--bright)' }}>
            🔧 For Developers (Optional)
          </h2>
          <p className="text-[12px] leading-relaxed mb-6" style={{ color: 'var(--dim)' }}>
            Converse AI requires zero integration. But if your team wants deeper control, we expose REST APIs for everything.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {APIS.map(a => (
              <div key={a.name} className="rounded-xl p-5 border" style={{ background: 'var(--card2)', borderColor: 'var(--b1)' }}>
                <div className="text-[12px] font-bold mb-1" style={{ color: 'var(--green)' }}>{a.name}</div>
                <div className="text-[10px] leading-relaxed mb-2" style={{ color: 'var(--dim)' }}>{a.desc}</div>
                <div className="font-mono text-[9px]" style={{ color: 'var(--dim)' }}>{a.endpoint}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </PageShell>
  )
}

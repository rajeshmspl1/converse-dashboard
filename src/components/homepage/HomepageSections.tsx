'use client'
import { useState, useEffect, useRef } from 'react'

interface Props {
  onStartCall: () => void
  onToggleIVRBar: () => void
  onSignUp?: () => void
  onNavigateJourney?: (step: number) => void
}

const SERIF = "'DM Serif Display', serif"
const MONO = "'JetBrains Mono', monospace"
const PHONE = '+1-833-457-2629'

const BYO_CATEGORIES: { key: string; icon: string; name: string; logos: { code: string; name: string; sub: string; bg: string }[] }[] = [
  { key: 'cloud', icon: '☁️', name: 'Cloud', logos: [
    { code: 'AW', name: 'AWS', sub: 'EKS · EC2 · S3', bg: 'linear-gradient(135deg,#FF9900,#E68A00)' },
    { code: 'Az', name: 'Microsoft Azure', sub: 'AKS · VMs · Blob', bg: 'linear-gradient(135deg,#0078D4,#005A9E)' },
    { code: 'GC', name: 'Google Cloud', sub: 'GKE · Compute · GCS', bg: 'linear-gradient(135deg,#4285F4,#2B6DC9)' },
    { code: 'K8', name: 'Kubernetes', sub: 'Any K8s cluster', bg: 'linear-gradient(135deg,#326CE5,#1E56C8)' },
    { code: 'Hy', name: 'Hybrid', sub: 'Split data + compute', bg: 'linear-gradient(135deg,#00C9B1,#00A896)' },
    { code: 'OP', name: 'On-Premises', sub: 'Air-gapped · Private DC', bg: 'linear-gradient(135deg,#64748B,#475569)' },
    { code: 'Dk', name: 'Docker', sub: 'Containerized deploy', bg: 'linear-gradient(135deg,#2496ED,#1A7ACC)' },
    { code: 'Tf', name: 'Terraform', sub: 'IaC · Multi-cloud', bg: 'linear-gradient(135deg,#E34F26,#C4421F)' },
  ]},
  { key: 'crm', icon: '🗄️', name: 'CRM', logos: [
    { code: 'SF', name: 'Salesforce', sub: 'CRM · Service Cloud', bg: 'linear-gradient(135deg,#00A1E0,#1798C1)' },
    { code: 'HS', name: 'HubSpot', sub: 'CRM · Service Hub', bg: 'linear-gradient(135deg,#FF7A59,#FF5C35)' },
    { code: 'Zo', name: 'Zoho', sub: 'CRM · Desk', bg: 'linear-gradient(135deg,#D4382C,#B71C1C)' },
    { code: 'Dy', name: 'MS Dynamics', sub: '365 · Customer Service', bg: 'linear-gradient(135deg,#0078D4,#005A9E)' },
    { code: 'Fw', name: 'Freshworks', sub: 'Freshdesk · Freshsales', bg: 'linear-gradient(135deg,#1DBF73,#0D9B57)' },
    { code: 'SN', name: 'ServiceNow', sub: 'CSM · ITSM', bg: 'linear-gradient(135deg,#81B64C,#5D9434)' },
    { code: 'Zn', name: 'Zendesk', sub: 'Support · Sell', bg: 'linear-gradient(135deg,#03363D,#065F46)' },
    { code: 'Pp', name: 'Pipedrive', sub: 'Sales CRM', bg: 'linear-gradient(135deg,#7B68EE,#6C5CE7)' },
  ]},
  { key: 'ccaas', icon: '📞', name: 'CCaaS', logos: [
    { code: 'Gn', name: 'Genesys', sub: 'Cloud CX', bg: 'linear-gradient(135deg,#FF4F1F,#E63900)' },
    { code: 'Nc', name: 'NICE CXone', sub: 'Cloud Contact Center', bg: 'linear-gradient(135deg,#0055A6,#003D7A)' },
    { code: 'F9', name: 'Five9', sub: 'Intelligent CX', bg: 'linear-gradient(135deg,#F58220,#D96C0E)' },
    { code: 'Td', name: 'Talkdesk', sub: 'CX Cloud', bg: 'linear-gradient(135deg,#7B2FBE,#5B1FA0)' },
    { code: '8x', name: '8x8', sub: 'XCaaS', bg: 'linear-gradient(135deg,#0F4C81,#0A3660)' },
    { code: 'Av', name: 'Avaya', sub: 'Experience Platform', bg: 'linear-gradient(135deg,#DA291C,#B71C1C)' },
    { code: 'Cx', name: 'Cisco Webex', sub: 'Contact Center', bg: 'linear-gradient(135deg,#049FD9,#0379A8)' },
    { code: 'Am', name: 'Amazon Connect', sub: 'Cloud Contact Center', bg: 'linear-gradient(135deg,#00BFA5,#009688)' },
  ]},
  { key: 'cpaas', icon: '💬', name: 'CPaaS', logos: [
    { code: 'Tw', name: 'Twilio', sub: 'Voice · SIP Trunking', bg: 'linear-gradient(135deg,#F22F46,#CF1124)' },
    { code: 'Vg', name: 'Vonage', sub: 'SIP · Voice API', bg: 'linear-gradient(135deg,#6E1FFF,#4A00E0)' },
    { code: 'Sn', name: 'Sinch', sub: 'Voice · Messaging', bg: 'linear-gradient(135deg,#FF6B35,#E05520)' },
    { code: 'Pl', name: 'Plivo', sub: 'Voice API · SIP', bg: 'linear-gradient(135deg,#46C281,#33A06A)' },
    { code: 'Bw', name: 'Bandwidth', sub: 'Voice · Messaging', bg: 'linear-gradient(135deg,#00B386,#009973)' },
  ]},
  { key: 'telephony', icon: '📡', name: 'Telephony', logos: [
    { code: 'At', name: 'Airtel', sub: 'India · Cloud Telephony', bg: 'linear-gradient(135deg,#ED1C24,#C41219)' },
    { code: 'TC', name: 'Tata Comm', sub: 'India · SIP · Global Voice', bg: 'linear-gradient(135deg,#003C71,#00285A)' },
    { code: 'Ex', name: 'Exotel', sub: 'India · Cloud Telephony', bg: 'linear-gradient(135deg,#1A73E8,#1565C0)' },
    { code: 'Oz', name: 'Ozonetel', sub: 'India · Cloud Agent', bg: 'linear-gradient(135deg,#FF6D00,#E65100)' },
    { code: 'Kn', name: 'Knowlarity', sub: 'India · Virtual Numbers', bg: 'linear-gradient(135deg,#2196F3,#1976D2)' },
    { code: 'OE', name: 'OneEdge', sub: 'Global · SIP Trunking', bg: 'linear-gradient(135deg,#00B4D8,#0096C7)' },
    { code: 'AN', name: 'AT&T', sub: 'Americas · Enterprise Voice', bg: 'linear-gradient(135deg,#009FDB,#0077B6)' },
    { code: 'Vz', name: 'Verizon', sub: 'Americas · SIP · UCaaS', bg: 'linear-gradient(135deg,#CD040B,#A50308)' },
    { code: 'Lu', name: 'Lumen', sub: 'Americas · SIP Trunking', bg: 'linear-gradient(135deg,#0075C9,#005A9E)' },
    { code: 'Rg', name: 'RingCentral', sub: 'Americas · Cloud PBX', bg: 'linear-gradient(135deg,#F47621,#D96310)' },
    { code: 'BT', name: 'BT', sub: 'Europe · Global Voice', bg: 'linear-gradient(135deg,#6400AA,#4A0080)' },
    { code: 'DT', name: 'Deutsche Telekom', sub: 'Europe · SIP · ISDN', bg: 'linear-gradient(135deg,#E20074,#B8005D)' },
    { code: 'Or', name: 'Orange', sub: 'Europe · Business Voice', bg: 'linear-gradient(135deg,#FF7900,#E06800)' },
    { code: 'Tf', name: 'Telefónica', sub: 'Europe · LATAM · Voice', bg: 'linear-gradient(135deg,#0066FF,#0050CC)' },
    { code: 'ST', name: 'SingTel', sub: 'APAC · Global Voice', bg: 'linear-gradient(135deg,#E60012,#C4000F)' },
    { code: 'NT', name: 'NTT', sub: 'Japan · Global SIP', bg: 'linear-gradient(135deg,#1D2088,#15186A)' },
    { code: 'Tl', name: 'Telstra', sub: 'Australia · Enterprise', bg: 'linear-gradient(135deg,#FF6200,#E05500)' },
    { code: 'Et', name: 'Etisalat (e&)', sub: 'Middle East · Voice', bg: 'linear-gradient(135deg,#5EBD3E,#4CA032)' },
    { code: 'Cl', name: 'Claro', sub: 'LATAM · Enterprise Voice', bg: 'linear-gradient(135deg,#DA291C,#B71C1C)' },
  ]},
  { key: 'llms', icon: '🧠', name: 'LLMs', logos: [
    { code: 'OA', name: 'OpenAI', sub: 'GPT-4o · GPT-4o-mini', bg: 'linear-gradient(135deg,#10A37F,#0D8C6D)' },
    { code: 'Az', name: 'Azure OpenAI', sub: 'Enterprise · Private', bg: 'linear-gradient(135deg,#0078D4,#005A9E)' },
    { code: 'An', name: 'Anthropic', sub: 'Claude · Sonnet · Opus', bg: 'linear-gradient(135deg,#D97706,#B45309)' },
    { code: 'Gm', name: 'Google Gemini', sub: 'Gemini Pro · Flash', bg: 'linear-gradient(135deg,#4285F4,#2B6DC9)' },
    { code: 'Bd', name: 'AWS Bedrock', sub: 'Multi-model · Managed', bg: 'linear-gradient(135deg,#FF6D00,#E65100)' },
    { code: 'Mt', name: 'Meta LLaMA', sub: 'Open Source · Self-hosted', bg: 'linear-gradient(135deg,#0668E1,#0451B5)' },
    { code: 'Ms', name: 'Mistral', sub: 'Large · Small · Open', bg: 'linear-gradient(135deg,#FF7000,#D45D00)' },
    { code: 'Co', name: 'Cohere', sub: 'Command R+ · Embed', bg: 'linear-gradient(135deg,#6366F1,#4F46E5)' },
    { code: 'Dp', name: 'DeepSeek', sub: 'V3 · Coder', bg: 'linear-gradient(135deg,#1DA1F2,#0D8BD9)' },
  ]},
  { key: 'infra', icon: '🏗️', name: 'Infrastructure', logos: [
    { code: 'LK', name: 'LiveKit', sub: 'WebRTC · SFU', bg: 'linear-gradient(135deg,#6366F1,#4F46E5)' },
    { code: 'FS', name: 'FreeSWITCH', sub: 'SIP · Telephony', bg: 'linear-gradient(135deg,#00BFA5,#009688)' },
    { code: 'Rd', name: 'Redis', sub: 'Cache · Pub/Sub', bg: 'linear-gradient(135deg,#DC382D,#B71C1C)' },
    { code: 'Pg', name: 'PostgreSQL', sub: 'Multi-tenant DB', bg: 'linear-gradient(135deg,#336791,#264D73)' },
    { code: 'Ng', name: 'Nginx', sub: 'Reverse Proxy', bg: 'linear-gradient(135deg,#009639,#007530)' },
    { code: 'Pm', name: 'Prometheus', sub: 'Monitoring', bg: 'linear-gradient(135deg,#E6522C,#C73E1D)' },
  ]},
]

function BYOGrid() {
  const [expanded, setExpanded] = useState<string | null>(null)
  return (
    <>
      <div className="grid grid-cols-3 sm:grid-cols-7 gap-2">
        {BYO_CATEGORIES.map(cat => (
          <div key={cat.key}
            onClick={() => setExpanded(expanded === cat.key ? null : cat.key)}
            className={`p-3 rounded-[9px] text-center cursor-pointer transition-all hover:scale-[1.03] ${expanded === cat.key ? 'ring-1' : ''}`}
            style={{
              background: expanded === cat.key ? 'rgba(139,92,246,.1)' : 'rgba(139,92,246,.04)',
              border: '1px solid rgba(139,92,246,.1)',
              ringColor: '#8b5cf6',
            }}>
            <div className="text-[24px] mb-1">{cat.icon}</div>
            <div className="text-[9px] font-bold" style={{ color: '#8b5cf6' }}>{cat.name}</div>
            <div className="text-[7px] mt-0.5" style={{ color: expanded === cat.key ? '#8b5cf6' : 'var(--dim)' }}>
              {expanded === cat.key ? '▲ collapse' : `▼ ${cat.logos.length}`}
            </div>
          </div>
        ))}
      </div>
      {expanded && (() => {
        const cat = BYO_CATEGORIES.find(c => c.key === expanded)
        if (!cat) return null
        return (
          <div className="mt-3 p-4 rounded-xl" style={{ background: 'var(--card2)', border: '1px solid var(--b1)', animation: 'fadeUp .3s ease' }}>
            <div className="text-[10px] font-bold mb-3 flex items-center gap-2" style={{ color: '#8b5cf6' }}>
              <span className="text-[14px]">{cat.icon}</span> {cat.name} — {cat.logos.length} integrations
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {cat.logos.map((l, li) => (
                <div key={li} className="flex items-center gap-2.5 p-2.5 rounded-lg transition-all hover:-translate-y-0.5" style={{ background: 'var(--card)', border: '1px solid var(--b1)' }}>
                  <div className="w-[32px] h-[32px] rounded-lg flex items-center justify-center text-[10px] font-extrabold text-white flex-shrink-0" style={{ background: l.bg }}>{l.code}</div>
                  <div>
                    <div className="text-[10px] font-bold">{l.name}</div>
                    <div className="text-[8px]" style={{ color: 'var(--dim)' }}>{l.sub}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      })()}
    </>
  )
}

export default function HomepageSections({ onStartCall, onToggleIVRBar, onSignUp, onNavigateJourney }: Props) {
  const startJourney = (step: number) => { onNavigateJourney?.(step); onStartCall() }
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          const siblings = Array.from(e.target.parentElement?.querySelectorAll('.fi') || [])
          const idx = siblings.indexOf(e.target as Element)
          ;(e.target as HTMLElement).style.transitionDelay = (idx * 0.08) + 's'
          e.target.classList.add('vis')
        }
      })
    }, { threshold: 0.08, rootMargin: '0px 0px -60px 0px' })
    el.querySelectorAll('.fi').forEach(c => obs.observe(c))
    return () => obs.disconnect()
  }, [])

  return (
    <div ref={scrollRef} className="overflow-y-auto flex-1" style={{ background: 'var(--bg)' }}>
      <style>{`
        @keyframes gradPulse { 0%,100% { opacity:1; filter:brightness(1); } 50% { opacity:.85; filter:brightness(1.3); } }
        @keyframes ctaGlow { 0%,100% { box-shadow:0 4px 20px rgba(59,130,246,.3); } 50% { box-shadow:0 4px 32px rgba(59,130,246,.6),0 0 60px rgba(59,130,246,.15); } }
        @keyframes pulse2 { 0%,100% { opacity:1 } 50% { opacity:.3 } }
        .fi { opacity:0; transform:translateY(28px); transition: opacity .7s cubic-bezier(.22,1,.36,1), transform .7s cubic-bezier(.22,1,.36,1); }
        .fi.vis { opacity:1; transform:translateY(0); }
        .pc { background:var(--card); border:1px solid var(--b1); border-radius:16px; padding:28px 24px 24px; margin-bottom:18px; position:relative; overflow:hidden; transition:transform .3s,border-color .3s; }
        .pc:hover { transform:translateY(-2px); border-color:var(--b2); }
        .pc::before { content:''; position:absolute; top:0; left:0; right:0; height:3px; border-radius:16px 16px 0 0; }
        .p1::before{background:linear-gradient(90deg,#00C9B1,#00DE7A)} .p2::before{background:linear-gradient(90deg,#00DE7A,#00C9B1)}
        .p3::before{background:linear-gradient(90deg,#3370E8,#8B5CF6)} .p4::before{background:linear-gradient(90deg,#F5A623,#f97316)}
        .p5::before{background:linear-gradient(90deg,#F03060,#f472b6)} .p6::before{background:linear-gradient(90deg,#8B5CF6,#3370E8)}
      `}</style>

      {/* ═══ HERO ═══ */}
      <section className="text-center px-4 sm:px-6 pt-14 sm:pt-20 pb-8 sm:pb-10 relative overflow-hidden">
        <div className="absolute top-[-250px] left-1/2 -translate-x-1/2 w-[900px] h-[900px] rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle,rgba(0,222,122,.04) 0%,transparent 70%)' }} />
        <div className="relative z-[1]">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-6 text-[11px] font-semibold uppercase tracking-wider" style={{ background: 'rgba(0,222,122,.08)', border: '1px solid rgba(0,222,122,.15)', color: '#00de7a' }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#00de7a', animation: 'pulse2 2s infinite' }} />
            Zero Integration · Per-Intent · Self-Funding
          </div>
          <h1 style={{ fontFamily: SERIF, fontSize: 'clamp(34px, 5.5vw, 64px)', fontWeight: 400, lineHeight: 1.1, letterSpacing: '-1.5px', marginBottom: 16 }}>
            Transform your IVR to AI IVR.<br />
            <span style={{ background: 'linear-gradient(135deg, #3370E8, #00C9B1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>In 17 minutes. No IT.</span>
          </h1>
          <p className="text-[15px] sm:text-[17px] mb-8 mx-auto leading-relaxed" style={{ color: 'var(--dim)', maxWidth: 580 }}>
            No IT team. No approval. No integration. <strong style={{ color: 'var(--text)' }}>Free migration &amp; 3-month production pilot</strong> in your environment.
          </p>
          <button onClick={onStartCall} className="px-10 py-3.5 rounded-xl text-[16px] font-bold border-none cursor-pointer transition-all hover:-translate-y-0.5" style={{ background: '#3b82f6', color: '#fff', animation: 'ctaGlow 2.5s ease-in-out infinite' }}>
            ▶ Try Live Demo
          </button>
          <div className="text-[10px] mt-3" style={{ color: 'var(--dim)' }}>Zero integration · Zero cost · No IT ticket</div>
        </div>
      </section>

      <div className="mx-auto px-4 sm:px-6 pb-8" style={{ maxWidth: 1100 }}>

        {/* ═══ 01 — FOUR JOURNEYS ═══ */}
        <div className="pc p1 fi">
          <div className="flex items-start gap-3 mb-5">
            <div className="flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center text-[15px] font-medium" style={{ fontFamily: MONO, background: '#00C9B1', color: '#080D18' }}>01</div>
            <div>
              <div style={{ fontFamily: SERIF, fontSize: 20, fontWeight: 400, lineHeight: 1.3 }}>Four Industry-First Ways to Experience &amp; Deploy AI on Your IVR</div>
              <div className="text-[11px] mt-1" style={{ color: 'var(--dim)' }}>And <span className="font-bold px-2 py-0.5 rounded" style={{ background: 'rgba(0,222,122,.12)', color: '#00de7a' }}>pay per intent only</span></div>
            </div>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { icon: '⚡', label: 'J1', name: 'Lowest Cost to Serve /Intent', tag: '$0.005 /intent', tagColor: '#00c9b1', desc: "Pay per resolution. Not per minute. Industry's lowest cost to serve per intent.", bg: 'rgba(0,201,177,.06)', ibg: 'rgba(0,201,177,.12)', j: 0, phone: true },
              { icon: '💰', label: 'J2', name: 'Service IVR + Revenue IVR', tag: 'CCaaS + CRM', tagColor: '#00de7a', desc: 'Same price + free leads. We earn only when leads convert.', bg: 'rgba(0,222,122,.06)', ibg: 'rgba(0,222,122,.12)', j: 1, phone: false },
              { icon: '🔥', label: 'J3', name: 'Improve IVR CSAT', tag: '3.5 → 4.5 · CCaaS + CRM', tagColor: '#F03060', desc: 'Detect frustration. Recover in 3 seconds. Upgrade AI mid-call.', bg: 'rgba(245,166,35,.06)', ibg: 'rgba(245,166,35,.12)', j: 2, phone: false },
              { icon: '🎯', label: 'J4', name: 'Route by Customer Value', tag: 'CCaaS + CRM', tagColor: '#3370E8', desc: 'Premium AI for premium customers. Auto-route by customer value.', bg: 'rgba(51,112,232,.06)', ibg: 'rgba(51,112,232,.12)', j: 3, phone: false },
            ].map((c, i) => (
              <div key={i} onClick={() => startJourney(c.j)} className="p-4 sm:p-5 rounded-[14px] text-center border cursor-pointer transition-all hover:-translate-y-1" style={{ background: `linear-gradient(145deg, ${c.bg}, var(--card2))`, borderColor: 'var(--b1)' }}>
                <div className="w-[52px] h-[52px] rounded-[14px] flex items-center justify-center mx-auto mb-3 text-[24px]" style={{ background: c.ibg }}>{c.icon}</div>
                <div className="text-[11px] font-medium mb-1 tracking-wider" style={{ fontFamily: MONO, color: c.tagColor }}>{c.label}</div>
                <div className="text-[13px] sm:text-[14px] font-bold mb-1 leading-tight">{c.name}</div>
                <div className="text-[10px] font-medium mb-1" style={{ fontFamily: MONO, color: c.tagColor }}>{c.tag}</div>
                <div className="text-[9px] leading-relaxed mb-2" style={{ color: 'var(--dim)' }}>{c.desc}</div>
                <div className="text-[9px] font-bold opacity-60 hover:opacity-100 transition-opacity" style={{ color: c.tagColor }}>Try demo →</div>
                {c.phone && (
                  <div className="mt-1.5 text-[8px]" style={{ color: 'var(--dim)' }}>
                    or call <a href={`tel:${PHONE.replace(/-/g,'')}`} className="font-semibold" style={{ color: '#00c9b1', textDecoration: 'none' }}>{PHONE}</a>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ═══ TIMELINE ═══ */}
        <div className="fi text-center py-8">
          <div className="text-[10px] font-bold uppercase tracking-widest mb-4" style={{ color: 'var(--dim)' }}>From IVR number to production</div>
          <div className="flex items-start justify-center gap-0 relative px-6">
            <div className="absolute top-[18px] left-[15%] right-[15%] h-[2px]" style={{ background: 'var(--b1)' }} />
            {[
              { icon: '📱', title: 'Share IVR #', time: '2 min', color: 'var(--b1)' },
              { icon: '🤖', title: 'Hear your AI', time: '5 min', color: '#00c9b1' },
              { icon: '✅', title: 'Validate', time: '5 min', color: '#f5a623' },
              { icon: '🧪', title: 'Free Pilot', time: '3 months', color: '#00de7a' },
              { icon: '🚀', title: 'Go Live', time: '5 min', color: '#8b5cf6' },
            ].map((s, i) => (
              <div key={i} className="flex-1 text-center relative z-[1]">
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-[16px] mx-auto mb-2" style={{ border: `2px solid ${s.color}`, background: 'var(--card)' }}>{s.icon}</div>
                <div className="text-[10px] font-bold">{s.title}</div>
                <div className="text-[8px]" style={{ color: 'var(--dim)' }}>{s.time}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ═══ 02 — HOW CX LEADERS MIGRATE ═══ */}
        <div className="pc p2 fi">
          <div className="flex items-start gap-3 mb-5">
            <div className="flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center text-[15px] font-medium" style={{ fontFamily: MONO, background: '#00DE7A', color: '#080D18' }}>02</div>
            <div>
              <div style={{ fontFamily: SERIF, fontSize: 20, fontWeight: 400, lineHeight: 1.3 }}>How CX Leaders Can Migrate in 17 Minutes Using Our Platform</div>
              <div className="text-[11px] mt-1" style={{ color: 'var(--dim)' }}>Zero IT · Zero integration · Zero budget</div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-[1fr_40px_1fr] items-stretch gap-0">
            {/* Experience Shop — bigger, clickable */}
            <div onClick={onStartCall}
              className="p-6 sm:p-7 rounded-[14px] border cursor-pointer transition-all hover:-translate-y-1 hover:border-[#f5a623]"
              style={{ background: 'linear-gradient(160deg,rgba(245,166,35,.04),var(--card2))', borderColor: 'var(--b1)' }}>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide mb-3" style={{ background: 'rgba(245,166,35,.1)', color: '#f5a623' }}>🛍️ Experience Shop</div>
              <h4 className="text-[17px] sm:text-[18px] font-bold mb-3">Try Before You Buy</h4>
              <div className="flex flex-col gap-2.5">
                {[
                  { icon: '⚡', bg: 'rgba(0,201,177,.1)', t: 'All 4 journeys — J1, J2, J3, J4' },
                  { icon: '🎚️', bg: 'rgba(51,112,232,.1)', t: '5 experience tiers live' },
                  { icon: '🧠', bg: 'rgba(139,92,246,.1)', t: 'Switch LLMs — GPT, Gemini, Sarvam' },
                  { icon: '📡', bg: 'rgba(0,222,122,.1)', t: 'Web, SIP & Hybrid modes' },
                  { icon: '🚫', bg: 'rgba(240,48,96,.1)', t: 'Zero sign-up. Zero friction.' },
                ].map((f, fi) => (
                  <div key={fi} className="flex items-center gap-2.5 text-[11px]" style={{ color: 'var(--dim)' }}>
                    <div className="w-[28px] h-[28px] rounded-md flex items-center justify-center text-[14px] flex-shrink-0" style={{ background: f.bg }}>{f.icon}</div>
                    <span>{f.t}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 text-[11px] font-bold" style={{ color: '#f5a623' }}>▶ Enter Experience Shop →</div>
            </div>
            {/* Arrow */}
            <div className="hidden md:flex items-center justify-center text-[20px]" style={{ color: 'var(--dim)' }}>→</div>
            <div className="flex md:hidden items-center justify-center py-2 text-[20px] rotate-90" style={{ color: 'var(--dim)' }}>→</div>
            {/* CX Leader Lab — clickable → SignUp */}
            <div onClick={() => onSignUp?.()}
              className="p-6 sm:p-7 rounded-[14px] border cursor-pointer transition-all hover:-translate-y-1 hover:border-[#00de7a]"
              style={{ background: 'linear-gradient(160deg,rgba(0,222,122,.04),var(--card2))', borderColor: 'var(--b1)' }}>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide mb-3" style={{ background: 'rgba(0,222,122,.1)', color: '#00de7a' }}>🔬 CX Leader Lab</div>
              <h4 className="text-[17px] sm:text-[18px] font-bold mb-3">Build &amp; Go Live</h4>
              <div className="flex flex-col gap-2.5">
                {[
                  { icon: '📤', bg: 'rgba(0,222,122,.1)', t: 'Upload your own IVR tree' },
                  { icon: '🧪', bg: 'rgba(51,112,232,.1)', t: 'Pre-UAT → UAT testing' },
                  { icon: '🚀', bg: 'rgba(245,166,35,.1)', t: 'Pilot → Production self-serve' },
                  { icon: '📊', bg: 'rgba(139,92,246,.1)', t: 'Real billing, real KPIs, real CRM' },
                  { icon: '🔁', bg: 'rgba(0,201,177,.1)', t: 'Same interface. Demo → Production.' },
                ].map((f, fi) => (
                  <div key={fi} className="flex items-center gap-2.5 text-[11px]" style={{ color: 'var(--dim)' }}>
                    <div className="w-[28px] h-[28px] rounded-md flex items-center justify-center text-[14px] flex-shrink-0" style={{ background: f.bg }}>{f.icon}</div>
                    <span>{f.t}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 text-[11px] font-bold" style={{ color: '#00de7a' }}>🔐 Sign Up &amp; Start Building →</div>
            </div>
          </div>
        </div>

        {/* ═══ 03 — DEMOCRATIZE AI SPEND ═══ */}
        <div className="pc p3 fi">
          <div className="flex items-start gap-3 mb-5">
            <div className="flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center text-[15px] font-medium" style={{ fontFamily: MONO, background: '#3370E8', color: '#fff' }}>03</div>
            <div>
              <div style={{ fontFamily: SERIF, fontSize: 20, fontWeight: 400, lineHeight: 1.3 }}>CX Leaders Can Democratize AI Spend Across Customer Journeys</div>
              <div className="text-[11px] mt-1" style={{ color: 'var(--dim)' }}>Right AI, right customer, right cost. Billed per intent (~45s avg).</div>
            </div>
          </div>
          <div className="flex items-end justify-center gap-3 py-4 overflow-x-auto">
            {[
              { emoji: '🤖', n: '5', label: 'Basic', h: 80, bg: 'linear-gradient(180deg,#3370E8,rgba(51,112,232,.25))', price: '$0.002/min', intent: '≈ $0.0015', stack: 'Azure STT → GPT-4o-mini → Azure TTS', tag: 'Fast & efficient' },
              { emoji: '🗣️', n: '4', label: 'Enhanced', h: 105, bg: 'linear-gradient(180deg,#00C9B1,rgba(0,201,177,.25))', price: '$0.004/min', intent: '≈ $0.003', stack: 'Sarvam STT → GPT-4o-mini → Sarvam TTS', tag: 'Native accent' },
              { emoji: '🧠', n: '3', label: 'Native', h: 135, bg: 'linear-gradient(180deg,#F5A623,rgba(245,166,35,.25))', price: '$0.008/min', intent: '≈ $0.006', stack: 'Sarvam-M (FREE) → Sarvam TTS', tag: 'Full regional' },
              { emoji: '❤️‍🔥', n: '2', label: 'Advanced', h: 170, bg: 'linear-gradient(180deg,#F03060,rgba(240,48,96,.25))', price: '$0.018/min', intent: '≈ $0.014', stack: 'Gemini 2.5 Flash S2S', tag: 'Human-like' },
              { emoji: '👑', n: '1', label: 'Ultra', h: 210, bg: 'linear-gradient(180deg,#8B5CF6,#f472b6,rgba(139,92,246,.25))', price: '$0.036/min', intent: '≈ $0.027', stack: 'Nova-3 → GPT-4o-mini → ElevenLabs', tag: 'VIP concierge' },
            ].map((t, i) => (
              <div key={i} className="flex flex-col items-center text-center flex-shrink-0" style={{ width: 'clamp(100px, 18%, 170px)' }}>
                <div className="w-full rounded-t-[13px] flex flex-col items-center justify-end px-2 py-3 text-white transition-transform hover:scale-[1.04]" style={{ height: t.h, background: t.bg }}>
                  <div className="text-[22px] mb-1">{t.emoji}</div>
                  <div className="text-[22px] font-medium" style={{ fontFamily: MONO }}>{t.n}</div>
                  <div className="text-[8px] font-bold uppercase tracking-wider mt-0.5" style={{ color: 'rgba(255,255,255,.8)' }}>{t.label}</div>
                </div>
                <div className="mt-2 w-full">
                  <div className="text-[11px] font-medium" style={{ fontFamily: MONO, color: '#00de7a' }}>{t.price}</div>
                  <div className="text-[10px]" style={{ fontFamily: MONO, color: '#f5a623' }}>{t.intent}</div>
                  <div className="text-[7px] mt-1 leading-tight" style={{ color: 'var(--dim)' }}>{t.stack}</div>
                  <div className="text-[8px] font-semibold mt-1">{t.tag}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ═══ 04 — VOICE JOURNEY MODES ═══ */}
        <div className="pc p4 fi">
          <div className="flex items-start gap-3 mb-5">
            <div className="flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center text-[15px] font-medium" style={{ fontFamily: MONO, background: '#F5A623', color: '#080D18' }}>04</div>
            <div>
              <div style={{ fontFamily: SERIF, fontSize: 20, fontWeight: 400, lineHeight: 1.3 }}>Experiment &amp; Deploy Using Different Voice Journey Modes</div>
              <div className="text-[11px] mt-1" style={{ color: 'var(--dim)' }}>Three delivery paths — one AI engine</div>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Web Journey → onStartCall */}
            <div onClick={onStartCall} className="p-5 rounded-[14px] text-center border cursor-pointer transition-all hover:-translate-y-1" style={{ background: 'linear-gradient(160deg, rgba(51,112,232,.05), var(--card2))', borderColor: 'var(--b1)' }}>
              <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3 text-[26px]" style={{ background: 'rgba(51,112,232,.15)' }}>🌐</div>
              <div className="text-[14px] font-bold mb-2" style={{ color: '#3370E8' }}>Web Journey</div>
              <div className="flex items-center justify-center gap-1 flex-wrap">
                {[['Browser','#3370E8'],['WebRTC','#3370E8'],['LiveKit','#3370E8'],['AI','#00de7a']].map(([label, c], ni) => (
                  <span key={ni} className="flex items-center gap-1">
                    <span className="px-2 py-0.5 rounded text-[7px] font-semibold uppercase tracking-wide" style={{ background: `${c}18`, color: c }}>{label}</span>
                    {ni < 3 && <span className="text-[10px]" style={{ color: 'var(--dim)' }}>→</span>}
                  </span>
                ))}
              </div>
              <div className="mt-3 text-[9px] font-bold" style={{ color: '#3370E8' }}>▶ Try in browser →</div>
            </div>
            {/* Hybrid Journey → show phone */}
            <div className="p-5 rounded-[14px] text-center border transition-all hover:-translate-y-1" style={{ background: 'linear-gradient(160deg, rgba(245,166,35,.05), var(--card2))', borderColor: 'var(--b1)' }}>
              <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3 text-[26px]" style={{ background: 'rgba(245,166,35,.15)' }}>🔀</div>
              <div className="text-[14px] font-bold mb-2" style={{ color: '#F5A623' }}>Hybrid Journey</div>
              <div className="flex items-center justify-center gap-1 flex-wrap">
                {[['Phone','#F5A623'],['SIP','#F5A623'],['Web AI','#3370E8'],['IVR','#00de7a']].map(([label, c], ni) => (
                  <span key={ni} className="flex items-center gap-1">
                    <span className="px-2 py-0.5 rounded text-[7px] font-semibold uppercase tracking-wide" style={{ background: `${c}18`, color: c }}>{label}</span>
                    {ni < 3 && <span className="text-[10px]" style={{ color: 'var(--dim)' }}>→</span>}
                  </span>
                ))}
              </div>
              <div className="mt-3">
                <a href={`tel:${PHONE.replace(/-/g,'')}`} className="text-[10px] font-bold" style={{ color: '#F5A623', textDecoration: 'none' }}>📞 Call {PHONE}</a>
              </div>
            </div>
            {/* E2E SIP → show phone */}
            <div className="p-5 rounded-[14px] text-center border transition-all hover:-translate-y-1" style={{ background: 'linear-gradient(160deg, rgba(240,48,96,.05), var(--card2))', borderColor: 'var(--b1)' }}>
              <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3 text-[26px]" style={{ background: 'rgba(240,48,96,.15)' }}>📞</div>
              <div className="text-[14px] font-bold mb-2" style={{ color: '#F03060' }}>End-to-End SIP</div>
              <div className="flex items-center justify-center gap-1 flex-wrap">
                {[['DID','#F03060'],['SIP Trunk','#F03060'],['FreeSWITCH','#F03060'],['AI','#00de7a']].map(([label, c], ni) => (
                  <span key={ni} className="flex items-center gap-1">
                    <span className="px-2 py-0.5 rounded text-[7px] font-semibold uppercase tracking-wide" style={{ background: `${c}18`, color: c }}>{label}</span>
                    {ni < 3 && <span className="text-[10px]" style={{ color: 'var(--dim)' }}>→</span>}
                  </span>
                ))}
              </div>
              <div className="mt-3">
                <a href={`tel:${PHONE.replace(/-/g,'')}`} className="text-[10px] font-bold" style={{ color: '#F03060', textDecoration: 'none' }}>📞 Call {PHONE}</a>
              </div>
            </div>
          </div>
        </div>

        {/* ═══ 05 — COST COMPARISON ═══ */}
        <div className="pc p5 fi">
          <div className="flex items-start gap-3 mb-5">
            <div className="flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center text-[15px] font-medium" style={{ fontFamily: MONO, background: '#F03060', color: '#fff' }}>05</div>
            <div>
              <div style={{ fontFamily: SERIF, fontSize: 20, fontWeight: 400, lineHeight: 1.3 }}>CX Leaders Cost Comparison With Your Current Model</div>
              <div className="text-[11px] mt-1" style={{ color: 'var(--dim)' }}>Two engines: customer support (lowest cost /intent) + sales (lowest cost /lead)</div>
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {/* Customer Support table */}
            <div className="rounded-[14px] border overflow-hidden" style={{ background: 'var(--card2)', borderColor: 'var(--b1)' }}>
              <div className="flex items-center gap-3 px-4 py-3" style={{ background: 'rgba(0,222,122,.04)' }}>
                <div className="w-[34px] h-[34px] rounded-[9px] flex items-center justify-center text-[16px]" style={{ background: 'rgba(0,222,122,.1)' }}>⚡</div>
                <div><div className="text-[12px] font-bold" style={{ color: '#00de7a' }}>Customer Support</div><div className="text-[8px]" style={{ color: 'var(--dim)' }}>Lowest cost /intent</div></div>
              </div>
              <table className="w-full" style={{ borderCollapse: 'collapse' }}>
                <thead><tr>{['Channel','Cost','CSAT','Wait'].map((h,hi) => <th key={hi} className={`px-3 py-2 text-[8px] font-bold uppercase tracking-wider ${hi>0?'text-right':'text-left'}`} style={{ color:'var(--dim)', borderBottom:'1px solid var(--b1)' }}>{h}</th>)}</tr></thead>
                <tbody>
                  {[
                    { icon:'🧑',n:'Human Agent',v1:'$5-8/call',c1:'#F03060',v2:'3.8',c2:'',v3:'1.5-3 min',c3:'#F03060',w:false },
                    { icon:'📟',n:'Traditional IVR',v1:'$0.02-0.05/min',c1:'',v2:'2.5-3.0',c2:'#F03060',v3:'2-5 min',c3:'',w:false },
                    { icon:'🤖',n:'Per-Minute AI',v1:'$0.07-0.33/min',c1:'',v2:'3.5',c2:'',v3:'30-60s',c3:'',w:false },
                    { icon:'💎',n:'AI IVRs',v1:'$0.005/intent',c1:'',v2:'Up to 4.5',c2:'',v3:'<30s',c3:'',w:true },
                  ].map((r,ri)=>(
                    <tr key={ri} style={{ background:r.w?'rgba(0,222,122,.04)':'transparent' }}>
                      <td className="px-3 py-2.5 text-[10px]" style={{ borderBottom:'1px solid var(--b1)',color:r.w?'#00de7a':'var(--dim)' }}><div className="flex items-center gap-2"><span>{r.icon}</span>{r.n}</div></td>
                      <td className="px-3 py-2.5 text-right text-[10px] font-medium" style={{ borderBottom:'1px solid var(--b1)',fontFamily:MONO,color:r.c1||(r.w?'#00de7a':'var(--dim)') }}>{r.v1}</td>
                      <td className="px-3 py-2.5 text-right text-[10px] font-medium" style={{ borderBottom:'1px solid var(--b1)',fontFamily:MONO,color:r.c2||(r.w?'#00de7a':'var(--dim)') }}>{r.v2}</td>
                      <td className="px-3 py-2.5 text-right text-[10px] font-medium" style={{ borderBottom:'1px solid var(--b1)',fontFamily:MONO,color:r.c3||(r.w?'#00de7a':'var(--dim)') }}>{r.v3}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Sales table */}
            <div className="rounded-[14px] border overflow-hidden" style={{ background: 'var(--card2)', borderColor: 'var(--b1)' }}>
              <div className="flex items-center gap-3 px-4 py-3" style={{ background: 'rgba(139,92,246,.04)' }}>
                <div className="w-[34px] h-[34px] rounded-[9px] flex items-center justify-center text-[16px]" style={{ background: 'rgba(139,92,246,.1)' }}>💰</div>
                <div><div className="text-[12px] font-bold" style={{ color: '#8b5cf6' }}>Sales</div><div className="text-[8px]" style={{ color: 'var(--dim)' }}>Lowest cost /lead</div></div>
              </div>
              <table className="w-full" style={{ borderCollapse: 'collapse' }}>
                <thead><tr>{['Channel','Cost/Lead','Conv.','Setup'].map((h,hi) => <th key={hi} className={`px-3 py-2 text-[8px] font-bold uppercase tracking-wider ${hi>0?'text-right':'text-left'}`} style={{ color:'var(--dim)', borderBottom:'1px solid var(--b1)' }}>{h}</th>)}</tr></thead>
                <tbody>
                  {[
                    { icon:'🧑',n:'Human Outbound',v1:'$15-50',c1:'#F03060',v2:'2-5%',v3:'Weeks',c3:'#F03060',w:false },
                    { icon:'📞',n:'Outbound Dialers',v1:'$5-15',c1:'#F03060',v2:'1-3%',v3:'Days',c3:'',w:false },
                    { icon:'📱',n:'Digital Marketing',v1:'$3-25',c1:'',v2:'1-4%',v3:'Days',c3:'',w:false },
                    { icon:'💎',n:'AI IVRs Sales',v1:'~$0',c1:'',v2:'Higher*',v3:'0 min',c3:'',w:true },
                  ].map((r,ri)=>(
                    <tr key={ri} style={{ background:r.w?'rgba(0,222,122,.04)':'transparent' }}>
                      <td className="px-3 py-2.5 text-[10px]" style={{ borderBottom:'1px solid var(--b1)',color:r.w?'#00de7a':'var(--dim)' }}><div className="flex items-center gap-2"><span>{r.icon}</span>{r.n}</div></td>
                      <td className="px-3 py-2.5 text-right text-[10px] font-medium" style={{ borderBottom:'1px solid var(--b1)',fontFamily:MONO,color:r.c1||(r.w?'#00de7a':'var(--dim)') }}>{r.v1}</td>
                      <td className="px-3 py-2.5 text-right text-[10px] font-medium" style={{ borderBottom:'1px solid var(--b1)',fontFamily:MONO,color:r.w?'#00de7a':'var(--dim)' }}>{r.v2}</td>
                      <td className="px-3 py-2.5 text-right text-[10px] font-medium" style={{ borderBottom:'1px solid var(--b1)',fontFamily:MONO,color:r.c3||(r.w?'#00de7a':'var(--dim)') }}>{r.v3}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 mt-4">
            {[
              { label:'Cost /Intent',from:'$5–8',to:'$0.005',fromL:'Human',toL:'AI IVRs' },
              { label:'CSAT Score',from:'2.5–3.0',to:'4.5',fromL:'Trad. IVR',toL:'AI IVRs' },
              { label:'Wait Time',from:'1.5–3m',to:'<30s',fromL:'Human',toL:'AI IVRs' },
            ].map((m,i)=>(
              <div key={i} className="p-3.5 rounded-xl text-center" style={{ background:'var(--card2)',border:'1px solid var(--b1)' }}>
                <div className="text-[8px] font-bold uppercase tracking-wider mb-2" style={{ color:'var(--dim)' }}>{m.label}</div>
                <div className="flex items-center justify-center gap-2.5">
                  <div><div className="text-[16px] font-medium" style={{ fontFamily:MONO,color:'#F03060' }}>{m.from}</div><div className="text-[7px] font-semibold mt-0.5" style={{ color:'var(--dim)' }}>{m.fromL}</div></div>
                  <div className="text-[14px] font-bold" style={{ color:'#00de7a' }}>→</div>
                  <div><div className="text-[16px] font-medium" style={{ fontFamily:MONO,color:'#00de7a' }}>{m.to}</div><div className="text-[7px] font-semibold mt-0.5" style={{ color:'#00c9b1' }}>{m.toL}</div></div>
                </div>
              </div>
            ))}
          </div>
          <div className="text-center mt-3"><span className="inline-block px-4 py-1.5 rounded-lg text-[10px] font-semibold" style={{ background:'rgba(0,222,122,.06)',border:'1px solid rgba(0,222,122,.1)',color:'#00de7a' }}>Intent cost → near zero. Lead cost → near zero. Your IVR pays for itself.</span></div>
        </div>

        {/* ═══ 06 — CX LEADERS QUESTIONS ANSWERED ═══ */}
        <div id="integrations" className="pc p6 fi">
          <div className="flex items-start gap-3 mb-5">
            <div className="flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center text-[15px] font-medium" style={{ fontFamily: MONO, background: '#8B5CF6', color: '#fff' }}>06</div>
            <div>
              <div style={{ fontFamily: SERIF, fontSize: 20, fontWeight: 400, lineHeight: 1.3 }}>CX Leaders Questions Answered</div>
              <div className="text-[11px] mt-1" style={{ color: 'var(--dim)' }}>Zero friction to start. Bring your own everything to scale.</div>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {[{icon:'🔌',val:'0',l:'Integration'},{icon:'🖥️',val:'0',l:'IT Dependency'},{icon:'💸',val:'0',l:'Cost to Migrate'},{icon:'🎯',val:'0',l:'Cost /Intent*'},{icon:'🔓',val:'0',l:'Vendor Lock-In'}].map((z,i)=>(
              <div key={i} className="p-4 rounded-xl text-center transition-all hover:scale-[1.03]" style={{ background:'var(--card2)',border:'1px solid var(--b1)' }}>
                <div className="w-10 h-10 rounded-[9px] flex items-center justify-center mx-auto mb-2 text-[20px]" style={{ background:'rgba(0,222,122,.08)' }}>{z.icon}</div>
                <div className="text-[24px] font-medium" style={{ fontFamily:MONO,color:'#00de7a' }}>{z.val}</div>
                <div className="text-[9px] font-semibold mt-0.5" style={{ color:'var(--dim)' }}>{z.l}</div>
              </div>
            ))}
          </div>
          <div className="mt-5">
            <div className="text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color:'var(--dim)' }}>Bring Your Own</div>
            <BYOGrid />
          </div>
          <div className="text-[8px] mt-2" style={{ color:'var(--dim)' }}>* With Sales Discovery enabled</div>
          <div className="mt-5 p-4 sm:p-5 rounded-[14px] flex items-center justify-between gap-4 flex-wrap" style={{ background:'linear-gradient(135deg, var(--card2), var(--card))',border:'1px solid var(--b1)' }}>
            <div>
              <div className="text-[13px] font-bold mb-1">Zero Integration. Open APIs.</div>
              <div className="text-[9px]" style={{ color:'var(--dim)' }}>40+ pre-built connectors. Or build your own with our SDK.</div>
            </div>
            <button onClick={() => onSignUp?.()} className="px-5 py-2.5 rounded-[10px] text-[11px] font-bold border-none cursor-pointer whitespace-nowrap transition-all hover:-translate-y-0.5" style={{ background:'#00c9b1',color:'#000',fontFamily:'inherit' }}>View API Docs →</button>
          </div>
        </div>

        {/* ═══ FAQ ═══ */}
        <div className="fi py-8">
          <div className="text-center mb-6"><div className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color:'#f5a623' }}>FAQ</div></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-4" style={{ maxWidth:900,margin:'0 auto' }}>
            {[
              {q:'Does my existing IVR keep working?',a:'Yes. We sit alongside — zero downtime. Your IVR stays live throughout.'},
              {q:'What do I need from IT?',a:'Nothing. Your IVR number and 17 minutes. No API keys, no SIP trunks.'},
              {q:'How does per-intent pricing work?',a:'Pay when AI resolves (~45s avg). Not per minute. No resolution = no charge.'},
              {q:'Can I bring my own LLM / cloud / CRM?',a:'Yes. BYO everything — 40+ pre-built connectors. Zero vendor lock-in.'},
            ].map((f,i)=>(
              <div key={i} className="p-4 rounded-xl" style={{ background:'var(--card)',border:'1px solid var(--b1)' }}>
                <div className="text-[11px] font-bold mb-1">{f.q}</div>
                <div className="text-[9px] leading-relaxed" style={{ color:'var(--dim)' }}>{f.a}</div>
              </div>
            ))}
          </div>
          <div className="text-center"><a href="/faq" className="text-[11px] font-semibold" style={{ color:'#00c9b1',textDecoration:'none' }}>See all 67 questions →</a></div>
        </div>

        {/* ═══ FINAL CTA ═══ */}
        <div className="fi text-center p-8 sm:p-10 rounded-2xl border mb-8" style={{ background:'linear-gradient(135deg, rgba(59,130,246,.06), rgba(6,182,212,.04))',borderColor:'rgba(59,130,246,.1)' }}>
          <h2 style={{ fontFamily:SERIF,fontSize:'clamp(20px, 3vw, 26px)',fontWeight:400,marginBottom:8 }}>Transform your IVR to AI IVR. In 17 minutes. No IT.</h2>
          <p className="text-[12px] mb-5" style={{ color:'var(--dim)' }}>90% lower cost. Better CSAT. Get leads from your own customers.</p>
          <button onClick={onStartCall} className="px-8 py-3.5 rounded-[10px] text-[14px] font-bold border-none cursor-pointer" style={{ background:'#00c9b1',color:'#000',boxShadow:'0 4px 16px rgba(0,201,177,.3)' }}>▶ Try Live Demo</button>
          <div className="flex gap-4 justify-center mt-3.5 flex-wrap text-[10px]" style={{ color:'var(--dim)' }}><span>✓ No credit card</span><span>✓ Free 3 months</span><span>✓ Your IVR stays live</span><span>✓ Cancel anytime</span></div>
        </div>

      </div>

      {/* ═══ FOOTER ═══ */}
      <footer className="px-4 sm:px-6 py-10 sm:py-14" style={{ borderTop: '1px solid var(--b1, #1c2d45)' }}>
        <div className="max-w-[900px] mx-auto">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="text-[16px] font-extrabold mb-1">Ai<span style={{ color: '#3370E8' }}>IVRs</span></div>
              <p className="text-[10px] mt-2 leading-relaxed" style={{ color: 'var(--dim)' }}>
                Transform your IVR to AI IVR. In 17 minutes. No IT. Zero integration.
              </p>
            </div>
            <div>
              <div className="text-[11px] font-semibold mb-3 uppercase tracking-wider" style={{ color: 'var(--dim)' }}>Product</div>
              <div className="text-[12px] mb-2 cursor-pointer transition-colors hover:text-white" style={{ color: 'var(--text)' }} onClick={onStartCall}>Experience Shop</div>
              <a href="/pricing" className="block text-[12px] no-underline mb-2 transition-colors hover:text-white" style={{ color: 'var(--text)' }}>Pricing</a>
              <a href="/how-it-works" className="block text-[12px] no-underline mb-2 transition-colors hover:text-white" style={{ color: 'var(--text)' }}>How It Works</a>
              <a href="/faq" className="block text-[12px] no-underline mb-2 transition-colors hover:text-white" style={{ color: 'var(--text)' }}>FAQ</a>
            </div>
            <div>
              <div className="text-[11px] font-semibold mb-3 uppercase tracking-wider" style={{ color: 'var(--dim)' }}>Industries</div>
              {[
                { label: 'Banking', href: '/industries/banking' },
                { label: 'Insurance', href: '/industries/insurance' },
                { label: 'Healthcare', href: '/industries/healthcare' },
                { label: 'Telecom', href: '/industries/telecom' },
                { label: 'E-Commerce', href: '/industries/ecommerce' },
                { label: 'Hospitality', href: '/industries/hospitality' },
              ].map(ind => (
                <a key={ind.href} href={ind.href} className="block text-[12px] no-underline mb-2 transition-colors hover:text-white" style={{ color: 'var(--text)' }}>{ind.label}</a>
              ))}
            </div>
            <div>
              <div className="text-[11px] font-semibold mb-3 uppercase tracking-wider" style={{ color: 'var(--dim)' }}>Company</div>
              <a href="/contact-sales" className="block text-[12px] no-underline mb-2 transition-colors hover:text-white" style={{ color: 'var(--text)' }}>Contact Sales</a>
              <a href="/docs" className="block text-[12px] no-underline mb-2 transition-colors hover:text-white" style={{ color: 'var(--text)' }}>Docs</a>
              <a href="/blog" className="block text-[12px] no-underline mb-2 transition-colors hover:text-white" style={{ color: 'var(--text)' }}>Blog</a>
              <a href="/compare" className="block text-[12px] no-underline mb-2 transition-colors hover:text-white" style={{ color: 'var(--text)' }}>Compare</a>
            </div>
          </div>
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-2" style={{ borderTop: '1px solid var(--b1, #1c2d45)' }}>
            <div className="text-[10px]" style={{ color: 'var(--dim)' }}>© 2026 AiIVRs. All rights reserved.</div>
            <div className="flex gap-4">
              <a href="/privacy" className="text-[10px] no-underline" style={{ color: 'var(--dim)' }}>Privacy</a>
              <a href="/terms" className="text-[10px] no-underline" style={{ color: 'var(--dim)' }}>Terms</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

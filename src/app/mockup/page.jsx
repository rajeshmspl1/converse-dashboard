"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"

// ── Data ─────────────────────────────────────────────────────────────────────
const INDUSTRIES = [
  { id: "banking",   icon: "🏦", label: "Banking & Finance",  color: "#3b82f6", intents: ["Account balance", "Card blocking", "Loan EMI", "Cheque book"] },
  { id: "insurance", icon: "🛡️", label: "Insurance",          color: "#8b5cf6", intents: ["Claim status", "Policy renewal", "Premium payment", "Coverage query"] },
  { id: "healthcare",icon: "🏥", label: "Healthcare",          color: "#10b981", intents: ["Appointments", "Prescriptions", "Lab results", "Doctor info"] },
  { id: "telecom",   icon: "📱", label: "Telecom",             color: "#f59e0b", intents: ["Plan upgrade", "Data usage", "SIM replacement", "Billing query"] },
  { id: "ecommerce", icon: "🛒", label: "E-Commerce",          color: "#ef4444", intents: ["Order tracking", "Return request", "Store locator", "Refund status"] },
]

const EXPERIENCES = [
  { id: 1, name: "Ultra",         tag: "Most Premium",   price: "₹3.75", priceUSD: "$0.0446", latency: "~700ms", feel: "Human-like warmth, zero robotic feel",       color: "#f59e0b" },
  { id: 2, name: "Conversational",tag: "Best for NRI",   price: "₹1.47", priceUSD: "$0.0176", latency: "~300ms", feel: "Natural conversation, multilingual",           color: "#8b5cf6" },
  { id: 3, name: "Gemini",        tag: "Best Value",     price: "₹1.05", priceUSD: "$0.0125", latency: "~300ms", feel: "Fast, accurate, native Indic languages",        color: "#10b981" },
  { id: 4, name: "Sarvam",        tag: "Smart Indic",    price: "₹0.50", priceUSD: "$0.0060", latency: "~800ms", feel: "Optimised for Indian regional languages",       color: "#3b82f6" },
  { id: 5, name: "Essential",     tag: "Functional IVR", price: "₹0.47", priceUSD: "$0.0057", latency: "~900ms", feel: "Reliable, cost-effective, proven stack",        color: "#6b7280" },
]

const JOURNEY = [
  { id: "try",    label: "Try",     sub: "Demo",         desc: "Live experience — hear AI handle your calls" },
  { id: "test",   label: "Test",    sub: "Validate",     desc: "Upload your IVR, simulate your real flow" },
  { id: "pilot",  label: "Pilot",   sub: "Live traffic", desc: "Real calls, limited volume, full monitoring" },
  { id: "golive", label: "Go Live", sub: "Production",   desc: "Full deployment, real-time analytics" },
]

// ── Global CSS ────────────────────────────────────────────────────────────────
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;700;900&family=JetBrains+Mono:wght@500&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  @keyframes fadeUp   { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
  @keyframes pulse    { 0%,100%{opacity:1} 50%{opacity:.3} }
  @keyframes glow     { 0%,100%{opacity:.6} 50%{opacity:1} }
  @keyframes wave-bar { from{transform:scaleY(0.3)} to{transform:scaleY(1.25)} }
  .nav-link:hover     { color:#fff !important }
  .ind-card:hover     { transform:translateY(-4px) !important }
  .tl-row:hover .tl-dot { box-shadow:0 0 26px var(--tc) !important }
  .pricing-row:hover  { background:rgba(255,255,255,.04) !important }
  .trust-card         { transition:transform .2s }
  .trust-card:hover   { transform:translateY(-2px) }

  @media(max-width:768px){
    .nav-links        { display:none !important }
    .hero-h1          { font-size:clamp(28px,8vw,44px) !important; letter-spacing:-1px !important }
    .usp-grid         { grid-template-columns:repeat(2,1fr) !important }
    .ind-grid         { grid-template-columns:repeat(2,1fr) !important }
    .trust-grid       { grid-template-columns:1fr !important }
    .p-cols           { grid-template-columns:50px 1fr 110px !important }
    .p-stack,.p-lat,.p-try { display:none !important }
    .tl-left          { width:56px !important }
    .section-pad      { padding:48px 18px !important }
    .hero-wrap        { padding:64px 18px 48px !important }
    .nav-inner        { padding:0 18px !important }
    .shop-left,.shop-right { display:none !important }
    .form-2col        { grid-template-columns:1fr !important }
    .cta-opt-grid     { grid-template-columns:1fr !important }
    .journey-stepper  { display:none !important }
    .hero-btns        { flex-direction:column; align-items:center }
    .country-row      { flex-wrap:wrap }
    .footer-cta-btns  { flex-direction:column; align-items:center }
  }
  @media(max-width:480px){
    .usp-grid         { grid-template-columns:1fr !important }
    .ind-grid         { grid-template-columns:1fr !important }
  }
`

// ── Shared components ─────────────────────────────────────────────────────────
function WaveBg({ color = "#3b82f6", opacity = 0.13 }) {
  return (
    <svg style={{ position:"absolute",inset:0,width:"100%",height:"100%",opacity,pointerEvents:"none" }} preserveAspectRatio="none">
      <defs><filter id="wbg"><feGaussianBlur stdDeviation="44"/></filter></defs>
      <ellipse cx="18%" cy="42%" rx="34%" ry="26%" fill={color}   filter="url(#wbg)"/>
      <ellipse cx="82%" cy="58%" rx="30%" ry="22%" fill="#6366f1" filter="url(#wbg)"/>
      <ellipse cx="52%" cy="18%" rx="22%" ry="16%" fill="#0ea5e9" filter="url(#wbg)"/>
    </svg>
  )
}

function SoundWave({ active, bars = 32 }) {
  return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:3, height:52 }}>
      {Array.from({ length: bars }).map((_, i) => (
        <div key={i} style={{
          width:3, borderRadius:99,
          background: active ? `hsl(${208+i*3.5},78%,62%)` : "#1e2d42",
          height: active ? `${16+Math.abs(Math.sin(i*0.75))*22}px` : "5px",
          transition:"height .35s ease, background .5s",
          animation: active ? `wave-bar ${0.75+(i%7)*0.12}s ease-in-out infinite alternate` : "none",
          animationDelay:`${i*0.045}s`,
        }}/>
      ))}
    </div>
  )
}

function TxLine({ line, delay = 0 }) {
  const [vis, setVis] = useState(false)
  useEffect(()=>{ const t=setTimeout(()=>setVis(true),delay); return ()=>clearTimeout(t) },[delay])
  return (
    <div style={{ opacity:vis?1:0, transform:vis?"translateY(0)":"translateY(8px)", transition:"all .4s ease", display:"flex", gap:10, alignItems:"flex-start", marginBottom:10 }}>
      <div style={{ fontSize:10, fontWeight:700, padding:"2px 7px", borderRadius:4, flexShrink:0, marginTop:2,
        background: line.who==="ai"?"rgba(59,130,246,.2)":"rgba(16,185,129,.15)",
        color:       line.who==="ai"?"#93c5fd":"#6ee7b7" }}>
        {line.who==="ai"?"AI":"YOU"}
      </div>
      <div style={{ fontSize:13, color:"#e2e8f0", lineHeight:1.55 }}>{line.text}</div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// LANDING PAGE
// ═══════════════════════════════════════════════════════════════════════════════
function LandingPage({ onEnter }) {
  const [scrolled, setScrolled]       = useState(false)
  const [showPicker, setShowPicker]   = useState(false)
  const [country, setCountry]         = useState("IN")
  const [activeStep, setActiveStep]   = useState(null)
  const [hoveredInd, setHoveredInd]   = useState(null)

  const COUNTRIES = [
    { code:"IN", flag:"🇮🇳", label:"India",    fmt:(p)=>`₹${p.toFixed(2)}` },
    { code:"US", flag:"🇺🇸", label:"USA",       fmt:(p)=>`$${(p/84).toFixed(4)}` },
    { code:"AE", flag:"🇦🇪", label:"UAE",       fmt:(p)=>`AED ${(p/22.9).toFixed(3)}` },
    { code:"SG", flag:"🇸🇬", label:"Singapore", fmt:(p)=>`SGD ${(p/62).toFixed(4)}` },
    { code:"GB", flag:"🇬🇧", label:"UK",        fmt:(p)=>`£${(p/106).toFixed(4)}` },
  ]
  const fmt = (inr) => COUNTRIES.find(c=>c.code===country).fmt(inr)

  const TIMELINE = [
    { min:"0 min",  icon:"📞", label:"Share your IVR number",        color:"#3b82f6", detail:"Just the number you use today. That's it. We handle everything from here — no changes to your existing system." },
    { min:"5 min",  icon:"🎧", label:"Hear AI live on your calls",   color:"#8b5cf6", detail:"AI answers your industry's real customer intents right now — balance queries, claims, plan changes — all handled conversationally." },
    { min:"15 min", icon:"🔬", label:"Validate on your real flows",  color:"#10b981", detail:"We map your IVR tree. You run simulated calls through every customer journey and confirm every intent is handled correctly." },
    { min:"25 min", icon:"🚀", label:"Pilot with live customers",    color:"#f59e0b", detail:"AI takes real customer calls on limited volume. Full monitoring, intent analytics, and escalation to human agent — all ready." },
    { min:"30 min", icon:"✅", label:"Go fully live",                color:"#22c55e", detail:"Full deployment. Real-time dashboards, compliance logs, multilingual support, and seamless agent handoff — all running." },
  ]

  const USPS = [
    { icon:"⚡", stat:"30 min",    label:"IVR → AI",    sub:"No IT ticket. No integration." },
    { icon:"🔌", stat:"Zero",      label:"Integration", sub:"Your existing IVR stays live." },
    { icon:"₹",  stat:"Per intent",label:"Pricing",     sub:"Pay only when it resolves." },
    { icon:"🛡️", stat:"Your data", label:"Stays yours", sub:"Shared, dedicated, or on-prem." },
  ]

  const TRUST = [
    { icon:"🛡️", color:"#10b981", title:"Data stays in your jurisdiction",
      body:"Choose shared, dedicated, or on-premise deployment. Customer voice data never leaves your chosen region. Tenant-isolated architecture, compliant by design.",
      chips:["Shared","Dedicated","On-Prem","India · UAE · EU regions"] },
    { icon:"🎙️", color:"#3b82f6", title:"Every call recorded and scored",
      body:"Full call recordings, transcripts, intent success rates, containment rate, and escalation triggers — all in your dashboard. QA built in from day one.",
      chips:["Call recordings","Transcripts","Intent analytics","CSAT proxy"] },
    { icon:"🤝", color:"#f59e0b", title:"Seamless handoff to your human agents",
      body:"If AI confidence drops below your threshold, or a customer asks for an agent — the call transfers cleanly with the full conversation context passed over. Zero dead air.",
      chips:["Clean agent transfer","Full context handoff","Configurable threshold","Zero dead air"] },
    { icon:"🔌", color:"#8b5cf6", title:"Zero integration — truly",
      body:"Your IVR keeps running, completely unchanged. We operate in front of it. No API changes to your core banking system, no IT approval cycles, no new vendor contracts.",
      chips:["No API changes","IVR untouched","No new contracts","No IT team needed"] },
    { icon:"📊", color:"#06b6d4", title:"Per-intent pricing — industry first",
      body:"You pay ₹0.47–₹3.75 per resolved customer intent. A customer who disconnects early costs you nothing. Traditional IVR ports were billing ₹6–8/min regardless.",
      chips:["₹0.47 Essential","₹1.05 Gemini","₹3.75 Ultra","Zero idle cost"] },
    { icon:"🌐", color:"#a78bfa", title:"Multilingual — no extra setup",
      body:"Hindi, Tamil, Telugu, Kannada, Bengali, Marathi, English — all supported natively. Language detected automatically per call. No configuration needed.",
      chips:["Auto language detect","10+ Indian languages","English + NRI","No configuration"] },
  ]

  useEffect(()=>{
    const el=document.getElementById("ls")
    if(!el) return
    const h=()=>setScrolled(el.scrollTop>50)
    el.addEventListener("scroll",h)
    return ()=>el.removeEventListener("scroll",h)
  },[])

  return (
    <div id="ls" style={{ height:"100%", overflowY:"auto", scrollBehavior:"smooth", fontFamily:"'DM Sans',sans-serif", background:"#070d1a" }}>

      {/* NAV */}
      <nav style={{ position:"sticky", top:0, zIndex:100, display:"flex", alignItems:"center", justifyContent:"space-between",
        height:62, background:scrolled?"rgba(7,13,26,.96)":"transparent",
        backdropFilter:scrolled?"blur(16px)":"none",
        borderBottom:scrolled?"1px solid rgba(255,255,255,.07)":"none",
        transition:"all .3s", padding:"0 48px" }} className="nav-inner">
        <div style={{ display:"flex", alignItems:"center", gap:10, fontWeight:900, fontSize:18, color:"#fff" }}>
          <div style={{ width:34, height:34, borderRadius:10, background:"linear-gradient(135deg,#3b82f6,#06b6d4)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:17 }}>🎙</div>
          Converse<span style={{ color:"#3b82f6" }}>AI</span>
        </div>
        <div className="nav-links" style={{ display:"flex", gap:32 }}>
          {["Product","Pricing","Industries","Security","Docs"].map(l=>(
            <a key={l} className="nav-link" style={{ fontSize:13, color:"rgba(255,255,255,.5)", cursor:"pointer", textDecoration:"none", transition:"color .2s" }}>{l}</a>
          ))}
        </div>
        <button onClick={()=>onEnter()} style={{ padding:"9px 22px", borderRadius:9, background:"#3b82f6", color:"#fff", border:"none", cursor:"pointer", fontWeight:700, fontSize:13 }}>Try Live →</button>
      </nav>

      {/* HERO */}
      <div className="hero-wrap" style={{ position:"relative", minHeight:680, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", textAlign:"center", padding:"90px 40px 70px", overflow:"hidden" }}>
        <WaveBg/>
        <div style={{ position:"relative", zIndex:1, animation:"fadeUp .7s ease both", width:"100%", maxWidth:680 }}>
          <div style={{ display:"inline-flex", alignItems:"center", gap:8, padding:"5px 16px", borderRadius:99, border:"1px solid rgba(255,255,255,.13)", background:"rgba(255,255,255,.06)", fontSize:12, color:"rgba(255,255,255,.78)", marginBottom:30 }}>
            <span style={{ width:7, height:7, borderRadius:"50%", background:"#22c55e", display:"inline-block", animation:"glow 2s infinite" }}/>
            Live AI · No pre-recorded responses · Zero integration
          </div>

          <h1 className="hero-h1" style={{ fontSize:"clamp(34px,5.5vw,70px)", fontWeight:900, lineHeight:1.08, color:"#fff", marginBottom:14, letterSpacing:"-2px" }}>
            Your IVR speaks conversational AI<br/>
            <span style={{ background:"linear-gradient(90deg,#60a5fa,#34d399,#a78bfa)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>in 30 minutes flat.</span>
          </h1>
          <p style={{ fontSize:17, color:"rgba(255,255,255,.5)", marginBottom:10, lineHeight:1.65 }}>
            No IT ticket. No integration project. Just your IVR number — and we do the rest.
          </p>
          <p style={{ fontSize:13, color:"rgba(255,255,255,.28)", marginBottom:40, fontStyle:"italic" }}>
            Industry's first per-intent pricing. You pay when it resolves. Not by the minute.
          </p>

          <div className="hero-btns" style={{ display:"flex", gap:12, justifyContent:"center", flexWrap:"wrap" }}>
            <button onClick={()=>setShowPicker(p=>!p)} style={{ padding:"15px 36px", borderRadius:11, background:"#3b82f6", color:"#fff", border:"none", cursor:"pointer", fontWeight:800, fontSize:15, boxShadow:"0 0 32px #3b82f660" }}>
              📞 Start a Call
            </button>
            <button onClick={()=>onEnter()} style={{ padding:"15px 30px", borderRadius:11, background:"rgba(255,255,255,.07)", color:"#fff", border:"1px solid rgba(255,255,255,.14)", cursor:"pointer", fontWeight:600, fontSize:15 }}>
              Try a Demo First →
            </button>
          </div>

          {showPicker && (
            <div style={{ marginTop:26, padding:"22px 24px", borderRadius:18, border:"1px solid rgba(255,255,255,.12)", background:"rgba(10,20,40,.92)", backdropFilter:"blur(20px)", animation:"fadeUp .3s ease both" }}>
              <div style={{ fontSize:11, fontWeight:700, color:"rgba(255,255,255,.4)", letterSpacing:"1.5px", textTransform:"uppercase", marginBottom:14 }}>Select your industry</div>
              <div style={{ display:"flex", gap:10, flexWrap:"wrap", justifyContent:"center" }}>
                {INDUSTRIES.map(ind=>(
                  <button key={ind.id} onClick={()=>{ setShowPicker(false); onEnter() }}
                    style={{ padding:"10px 18px", borderRadius:10, border:`1px solid ${ind.color}55`, background:`${ind.color}14`, color:"#fff", cursor:"pointer", fontSize:13, fontWeight:700, display:"flex", alignItems:"center", gap:8 }}>
                    {ind.icon} {ind.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* CENTERED SOUND WAVE */}
          <div style={{ marginTop:52, display:"flex", flexDirection:"column", alignItems:"center", gap:10 }}>
            <SoundWave active={true}/>
            <p style={{ fontSize:11, color:"rgba(255,255,255,.22)", letterSpacing:".8px", textTransform:"uppercase" }}>Live AI Voice · Real-time · Multilingual</p>
          </div>
        </div>
      </div>

      {/* USP STRIP */}
      <div style={{ background:"rgba(255,255,255,.025)", borderTop:"1px solid rgba(255,255,255,.06)", borderBottom:"1px solid rgba(255,255,255,.06)" }}>
        <div className="usp-grid" style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", maxWidth:960, margin:"0 auto" }}>
          {USPS.map((u,i)=>(
            <div key={i} style={{ padding:"26px 22px", borderRight:i<3?"1px solid rgba(255,255,255,.06)":"none", textAlign:"center" }}>
              <div style={{ fontSize:24, marginBottom:6 }}>{u.icon}</div>
              <div style={{ fontSize:20, fontWeight:900, color:"#fff", letterSpacing:"-1px", fontFamily:"'JetBrains Mono',monospace" }}>{u.stat}</div>
              <div style={{ fontSize:12, fontWeight:700, color:"#60a5fa", marginBottom:4 }}>{u.label}</div>
              <div style={{ fontSize:11, color:"rgba(255,255,255,.36)", lineHeight:1.45 }}>{u.sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 30-MIN TIMELINE */}
      <div className="section-pad" style={{ padding:"80px 40px", background:"#060b17", borderTop:"1px solid rgba(255,255,255,.06)" }}>
        <div style={{ maxWidth:780, margin:"0 auto" }}>
          <div style={{ textAlign:"center", marginBottom:52 }}>
            <div style={{ fontSize:11, fontWeight:700, color:"#3b82f6", letterSpacing:"2px", textTransform:"uppercase", marginBottom:12 }}>Fastest IVR upgrade in the industry</div>
            <h2 style={{ fontSize:42, fontWeight:900, color:"#fff", letterSpacing:"-1.5px", marginBottom:12 }}>Live in <span style={{ color:"#22c55e" }}>30 minutes.</span></h2>
            <p style={{ fontSize:16, color:"rgba(255,255,255,.4)", maxWidth:400, margin:"0 auto" }}>No IT dependency. No changes to your existing system. No new contracts.</p>
          </div>

          <div style={{ position:"relative" }}>
            <div style={{ position:"absolute", left:75, top:20, bottom:20, width:2, background:"linear-gradient(to bottom,#3b82f6,#8b5cf6,#10b981,#f59e0b,#22c55e)", borderRadius:2, opacity:.32 }}/>
            {TIMELINE.map((s,i)=>(
              <div key={i} className="tl-row" onClick={()=>setActiveStep(activeStep===i?null:i)}
                style={{ display:"flex", alignItems:"flex-start", marginBottom:i<4?28:0, cursor:"pointer", "--tc":s.color }}>
                <div className="tl-left" style={{ width:76, textAlign:"right", paddingRight:18, paddingTop:10, flexShrink:0 }}>
                  <div style={{ fontSize:11, fontWeight:800, color:s.color, fontFamily:"'JetBrains Mono',monospace" }}>{s.min}</div>
                </div>
                <div className="tl-dot" style={{ width:38, height:38, borderRadius:"50%", background:`${s.color}18`, border:`2px solid ${s.color}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, flexShrink:0, transition:"box-shadow .3s", zIndex:1, boxShadow:activeStep===i?`0 0 26px ${s.color}`:"none" }}>{s.icon}</div>
                <div style={{ paddingLeft:18, paddingTop:7, flex:1 }}>
                  <div style={{ fontSize:15, fontWeight:800, color:"#fff", marginBottom:2 }}>{s.label}</div>
                  <div style={{ fontSize:12, color:"rgba(255,255,255,.42)", lineHeight:1.65, overflow:"hidden", maxHeight:activeStep===i?90:0, transition:"max-height .35s ease, opacity .3s", opacity:activeStep===i?1:0 }}>{s.detail}</div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ textAlign:"center", marginTop:44 }}>
            <button onClick={()=>setShowPicker(true)} style={{ padding:"14px 36px", borderRadius:11, background:"#22c55e", color:"#fff", border:"none", cursor:"pointer", fontWeight:800, fontSize:14, boxShadow:"0 0 28px #22c55e45" }}>
              Start My 30-Min Setup →
            </button>
          </div>
        </div>
      </div>

      {/* INDUSTRY SELECTOR */}
      <div className="section-pad" style={{ padding:"80px 40px", borderTop:"1px solid rgba(255,255,255,.06)" }}>
        <div style={{ textAlign:"center", marginBottom:44 }}>
          <div style={{ fontSize:11, fontWeight:700, color:"#8b5cf6", letterSpacing:"2px", textTransform:"uppercase", marginBottom:12 }}>Choose your context</div>
          <h2 style={{ fontSize:36, fontWeight:900, color:"#fff", marginBottom:12, letterSpacing:"-1px" }}>Hear it in your industry</h2>
          <p style={{ fontSize:15, color:"rgba(255,255,255,.4)" }}>Click an industry — get a live AI call handling your sector's real customer intents, right now.</p>
        </div>
        <div className="ind-grid" style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:13, maxWidth:960, margin:"0 auto" }}>
          {INDUSTRIES.map(ind=>(
            <div key={ind.id} className="ind-card"
              style={{ padding:"24px 15px", borderRadius:16, cursor:"pointer", textAlign:"center", transition:"all .2s",
                border:`1px solid ${hoveredInd===ind.id?ind.color+"68":"rgba(255,255,255,.07)"}`,
                background: hoveredInd===ind.id?`${ind.color}12`:"rgba(255,255,255,.025)" }}
              onMouseEnter={()=>setHoveredInd(ind.id)} onMouseLeave={()=>setHoveredInd(null)}
              onClick={()=>onEnter()}>
              <div style={{ fontSize:30, marginBottom:10 }}>{ind.icon}</div>
              <div style={{ fontSize:13, fontWeight:700, color:"#fff", marginBottom:7, lineHeight:1.3 }}>{ind.label}</div>
              <div style={{ fontSize:10, color:"rgba(255,255,255,.35)", lineHeight:1.6, marginBottom:12 }}>{ind.intents.slice(0,3).join(" · ")}</div>
              <div style={{ fontSize:12, fontWeight:700, color:hoveredInd===ind.id?ind.color:"rgba(255,255,255,.26)", transition:"color .2s" }}>Start Call →</div>
            </div>
          ))}
        </div>
      </div>

      {/* TRUST / COMPLIANCE */}
      <div className="section-pad" style={{ padding:"80px 40px", background:"#060b17", borderTop:"1px solid rgba(255,255,255,.06)" }}>
        <div style={{ maxWidth:980, margin:"0 auto" }}>
          <div style={{ textAlign:"center", marginBottom:48 }}>
            <div style={{ fontSize:11, fontWeight:700, color:"#10b981", letterSpacing:"2px", textTransform:"uppercase", marginBottom:12 }}>Built for regulated industries</div>
            <h2 style={{ fontSize:36, fontWeight:900, color:"#fff", letterSpacing:"-1px", marginBottom:12 }}>Your CX team's checklist. Answered.</h2>
            <p style={{ fontSize:15, color:"rgba(255,255,255,.4)" }}>Every question your compliance and IT team will ask — already handled before they raise it.</p>
          </div>
          <div className="trust-grid" style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:16 }}>
            {TRUST.map((c,i)=>(
              <div key={i} className="trust-card" style={{ padding:"24px", borderRadius:16, border:`1px solid ${c.color}20`, background:`${c.color}07` }}>
                <div style={{ fontSize:24, marginBottom:11 }}>{c.icon}</div>
                <div style={{ fontSize:14, fontWeight:800, color:"#fff", marginBottom:8, lineHeight:1.35 }}>{c.title}</div>
                <div style={{ fontSize:12, color:"rgba(255,255,255,.46)", lineHeight:1.7, marginBottom:13 }}>{c.body}</div>
                <div style={{ display:"flex", flexWrap:"wrap", gap:5 }}>
                  {c.chips.map(ch=>(
                    <span key={ch} style={{ fontSize:10, padding:"3px 8px", borderRadius:99, background:`${c.color}15`, border:`1px solid ${c.color}30`, color:c.color, fontWeight:700 }}>{ch}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* PRICING */}
      <div className="section-pad" style={{ padding:"80px 40px", borderTop:"1px solid rgba(255,255,255,.06)" }}>
        <div style={{ textAlign:"center", marginBottom:40 }}>
          <div style={{ fontSize:11, fontWeight:700, color:"#f59e0b", letterSpacing:"2px", textTransform:"uppercase", marginBottom:12 }}>Transparent · No surprises</div>
          <h2 style={{ fontSize:36, fontWeight:900, color:"#fff", marginBottom:10, letterSpacing:"-1px" }}>Pay per intent resolved. Not per minute.</h2>
          <p style={{ fontSize:13, color:"rgba(255,255,255,.36)", marginBottom:22 }}>Traditional IVR ports bill ₹6–8/min regardless. With Converse, idle calls cost zero.</p>
          <div className="country-row" style={{ display:"flex", gap:8, justifyContent:"center", flexWrap:"wrap" }}>
            {COUNTRIES.map(c=>(
              <button key={c.code} onClick={()=>setCountry(c.code)} style={{ padding:"6px 14px", borderRadius:99, cursor:"pointer", fontSize:12, fontWeight:600, transition:"all .2s",
                border:`1px solid ${country===c.code?"#f59e0b":"rgba(255,255,255,.1)"}`,
                background: country===c.code?"rgba(245,158,11,.14)":"rgba(255,255,255,.04)",
                color: country===c.code?"#f59e0b":"rgba(255,255,255,.45)" }}>
                {c.flag} {c.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ maxWidth:820, margin:"0 auto", borderRadius:16, overflow:"hidden", border:"1px solid rgba(255,255,255,.08)" }}>
          <div className="p-cols" style={{ display:"grid", gridTemplateColumns:"58px 1fr 1.8fr 130px 88px 66px", padding:"11px 22px", background:"rgba(255,255,255,.04)", fontSize:10, fontWeight:700, color:"rgba(255,255,255,.3)", textTransform:"uppercase", letterSpacing:"1px" }}>
            <div>#</div><div>Experience</div><div className="p-stack">AI Stack</div><div>Price / intent</div><div className="p-lat">Latency</div><div className="p-try"></div>
          </div>
          {[
            { id:1, name:"Ultra",          sub:"Human-Like",    stack:"ElevenLabs · GPT-4o-mini · Azure STT", inr:3.75, lat:"~700ms", color:"#f59e0b", badge:"Premium" },
            { id:2, name:"Conversational", sub:"NRI-Ready",      stack:"GPT-4o Realtime (end-to-end)",         inr:1.47, lat:"~300ms", color:"#8b5cf6", badge:"" },
            { id:3, name:"Gemini",         sub:"Best Value",     stack:"Gemini 2.5 Flash (end-to-end)",        inr:1.05, lat:"~300ms", color:"#10b981", badge:"Popular" },
            { id:4, name:"Sarvam",         sub:"Smart Indic",    stack:"Sarvam · GPT-4o-mini · Sarvam",       inr:0.50, lat:"~800ms", color:"#3b82f6", badge:"" },
            { id:5, name:"Essential",      sub:"Functional IVR", stack:"Azure STT · GPT-4o-mini · Azure TTS", inr:0.47, lat:"~900ms", color:"#6b7280", badge:"" },
          ].map((e,i)=>(
            <div key={e.id} className="p-cols pricing-row" onClick={()=>onEnter()}
              style={{ display:"grid", gridTemplateColumns:"58px 1fr 1.8fr 130px 88px 66px", padding:"16px 22px", borderTop:"1px solid rgba(255,255,255,.05)", background:i%2===0?"rgba(255,255,255,.014)":"transparent", alignItems:"center", cursor:"pointer", transition:"background .15s" }}>
              <div style={{ fontSize:11, color:"rgba(255,255,255,.28)" }}>Exp {e.id}</div>
              <div>
                <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:2 }}>
                  <span style={{ fontSize:14, fontWeight:800, color:"#fff" }}>{e.name}</span>
                  {e.badge&&<span style={{ fontSize:9, padding:"2px 6px", borderRadius:4, background:`${e.color}20`, color:e.color, fontWeight:800 }}>{e.badge}</span>}
                </div>
                <div style={{ fontSize:11, color:"rgba(255,255,255,.33)" }}>{e.sub}</div>
              </div>
              <div className="p-stack" style={{ fontSize:11, color:"rgba(255,255,255,.36)", fontFamily:"'JetBrains Mono',monospace" }}>{e.stack}</div>
              <div style={{ fontSize:16, fontWeight:800, color:e.color, fontFamily:"'JetBrains Mono',monospace" }}>{fmt(e.inr)}<span style={{ fontSize:10, fontWeight:400, color:"rgba(255,255,255,.3)" }}>/intent</span></div>
              <div className="p-lat" style={{ fontSize:12, color:"rgba(255,255,255,.4)" }}>{e.lat}</div>
              <div className="p-try" style={{ fontSize:11, color:"#3b82f6", fontWeight:700 }}>Try →</div>
            </div>
          ))}
        </div>
        <div style={{ textAlign:"center", marginTop:12, fontSize:11, color:"rgba(255,255,255,.22)" }}>
          All prices include STT + LLM + TTS + infrastructure. 35s/intent basis. 2.5× margin. ₹84 = $1.
        </div>
        <div className="footer-cta-btns" style={{ display:"flex", justifyContent:"center", gap:12, marginTop:36 }}>
          <button onClick={()=>onEnter()} style={{ padding:"14px 32px", borderRadius:11, background:"#3b82f6", color:"#fff", border:"none", cursor:"pointer", fontWeight:800, fontSize:14, boxShadow:"0 0 26px #3b82f640" }}>Start Free Demo →</button>
          <button style={{ padding:"14px 24px", borderRadius:11, background:"rgba(255,255,255,.06)", color:"#fff", border:"1px solid rgba(255,255,255,.12)", cursor:"pointer", fontWeight:600, fontSize:14 }}>Talk to Sales</button>
        </div>
      </div>

      {/* BOTTOM CTA */}
      <div style={{ padding:"72px 40px", background:"#060b17", borderTop:"1px solid rgba(255,255,255,.06)", textAlign:"center", position:"relative", overflow:"hidden" }}>
        <WaveBg color="#22c55e" opacity={0.07}/>
        <div style={{ position:"relative", zIndex:1 }}>
          <h2 style={{ fontSize:40, fontWeight:900, color:"#fff", letterSpacing:"-1.5px", marginBottom:14, lineHeight:1.15 }}>
            Ready to convert your IVR?<br/><span style={{ color:"#22c55e" }}>30 minutes from now.</span>
          </h2>
          <p style={{ fontSize:16, color:"rgba(255,255,255,.4)", marginBottom:32, maxWidth:420, margin:"0 auto 32px", lineHeight:1.6 }}>Your customers deserve a better experience. There's no reason to wait.</p>
          <div className="footer-cta-btns" style={{ display:"flex", gap:12, justifyContent:"center", flexWrap:"wrap" }}>
            <button onClick={()=>setShowPicker(true)} style={{ padding:"16px 40px", borderRadius:12, background:"#22c55e", color:"#fff", border:"none", cursor:"pointer", fontWeight:800, fontSize:15, boxShadow:"0 0 36px #22c55e50" }}>📞 Start a Call Now</button>
            <button style={{ padding:"16px 28px", borderRadius:12, background:"rgba(255,255,255,.06)", color:"#fff", border:"1px solid rgba(255,255,255,.13)", cursor:"pointer", fontWeight:600, fontSize:15 }}>Book a Demo</button>
          </div>
          <div style={{ marginTop:26, display:"flex", gap:22, justifyContent:"center", flexWrap:"wrap" }}>
            {["✓ No credit card","✓ 7-day free trial","✓ Your IVR stays live","✓ Cancel anytime"].map(t=>(
              <span key={t} style={{ fontSize:12, color:"rgba(255,255,255,.35)", fontWeight:600 }}>{t}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPERIENCE SHOP
// ═══════════════════════════════════════════════════════════════════════════════
function ExperienceShop({ industry, onCTA, onBack }) {
  const [callState, setCallState]     = useState("idle")
  const [selectedExp, setSelectedExp] = useState(5)
  const [transcript, setTranscript]   = useState([])
  const [keypadActive, setKeypadActive] = useState(false)
  const [elapsed, setElapsed]         = useState(0)
  const [cost, setCost]               = useState(0)
  const [intents, setIntents]         = useState(0)
  const txRef = useRef(null)
  const timer = useRef(null)

  const ind = industry || INDUSTRIES[0]
  const exp = EXPERIENCES.find(e=>e.id===selectedExp)

  useEffect(()=>{ if(txRef.current) txRef.current.scrollTop=txRef.current.scrollHeight },[transcript])

  useEffect(()=>{
    if(callState==="active"){
      timer.current=setInterval(()=>{
        setElapsed(e=>e+1)
        setCost(c=>c+parseFloat(exp.price.replace("₹",""))/60)
      },1000)
    } else { clearInterval(timer.current) }
    return ()=>clearInterval(timer.current)
  },[callState,exp])

  const startCall = () => {
    setCallState("connecting"); setTranscript([]); setKeypadActive(false)
    setElapsed(0); setCost(0); setIntents(0)
    setTimeout(()=>{
      setCallState("active")
      setTranscript([{ who:"ai", text:`Welcome to ${ind.label}. I'm your AI assistant. How can I help you today?` }])
    },1600)
    setTimeout(()=>{
      setTranscript(t=>[...t,{ who:"user", text:`I'd like to check my ${ind.intents[0].toLowerCase()}` }])
      setIntents(n=>n+1)
      setTimeout(()=>{
        setTranscript(t=>[...t,{ who:"ai", text:`Of course — let me retrieve that for you. Your ${ind.intents[0].toLowerCase()} information is being fetched right now.` }])
        setCost(c=>c+parseFloat(exp.price.replace("₹","")))
        setTimeout(()=>{
          setTranscript(t=>[...t,{ who:"ai", text:"Is there anything else I can help you with, or would you like to explore more options?" }])
          setKeypadActive(true)
        },3500)
      },1400)
    },4000)
  }

  const endCall = () => {
    setCallState("ended"); setKeypadActive(false)
    clearInterval(timer.current)
    setTranscript(t=>[...t,{ who:"ai", text:"Thank you for calling. Have a wonderful day!" }])
    setTimeout(()=>onCTA({ exp, industry:ind, elapsed, cost:cost.toFixed(3), intents }),2200)
  }

  const pressKey = (d) => {
    setTranscript(t=>[...t,{ who:"user", text:`[Option ${d} selected]` }])
    setTimeout(()=>{
      const resp = ind.intents[parseInt(d)%ind.intents.length]||"Main options"
      setTranscript(t=>[...t,{ who:"ai", text:`You've selected ${resp}. I'm handling that for you now.` }])
      setIntents(n=>n+1)
      setCost(c=>c+parseFloat(exp.price.replace("₹","")))
    },800)
  }

  const fmtTime = s=>`${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`

  return (
    <div style={{ height:"100%", display:"flex", flexDirection:"column", background:"#070d1a", fontFamily:"'DM Sans',sans-serif", overflow:"hidden" }}>

      {/* TOP BAR */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 18px", height:52, background:"rgba(255,255,255,.03)", borderBottom:"1px solid rgba(255,255,255,.07)", flexShrink:0, gap:8, flexWrap:"wrap", minHeight:52 }}>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <button onClick={onBack} style={{ background:"none", border:"none", color:"rgba(255,255,255,.5)", cursor:"pointer", fontSize:13 }}>← Back</button>
          <div style={{ width:1, height:18, background:"rgba(255,255,255,.1)" }}/>
          <div style={{ fontSize:13, color:"rgba(255,255,255,.72)", display:"flex", alignItems:"center", gap:6 }}>
            <span style={{ fontSize:15 }}>{ind.icon}</span>{ind.label}
          </div>
        </div>
        <div className="journey-stepper" style={{ display:"flex", alignItems:"center", gap:5 }}>
          {JOURNEY.map((j,i)=>(
            <div key={j.id} style={{ display:"flex", alignItems:"center", gap:5 }}>
              <div style={{ padding:"3px 10px", borderRadius:99, fontSize:11, fontWeight:700,
                background:i===0?"#3b82f6":"rgba(255,255,255,.07)",
                color:i===0?"#fff":"rgba(255,255,255,.3)" }}>{j.label}</div>
              {i<3&&<div style={{ width:14, height:1, background:"rgba(255,255,255,.1)" }}/>}
            </div>
          ))}
        </div>
        <div style={{ fontSize:11, color:"rgba(255,255,255,.26)" }}>Experience Shop</div>
      </div>

      {/* BODY */}
      <div style={{ flex:1, display:"flex", overflow:"hidden" }}>

        {/* LEFT */}
        <div className="shop-left" style={{ width:208, borderRight:"1px solid rgba(255,255,255,.07)", padding:"13px 9px", overflowY:"auto", flexShrink:0 }}>
          <div style={{ fontSize:9, fontWeight:700, color:"rgba(255,255,255,.26)", textTransform:"uppercase", letterSpacing:"1.5px", marginBottom:9, paddingLeft:3 }}>Experience Level</div>
          {EXPERIENCES.map(e=>(
            <div key={e.id} onClick={()=>{ if(callState==="idle"||callState==="ended") setSelectedExp(e.id) }}
              style={{ padding:"10px 11px", borderRadius:10, marginBottom:5, cursor:"pointer", transition:"all .2s",
                border:`1px solid ${selectedExp===e.id?e.color+"60":"rgba(255,255,255,.05)"}`,
                background:selectedExp===e.id?`${e.color}12`:"rgba(255,255,255,.02)" }}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:2 }}>
                <div style={{ fontSize:12, fontWeight:700, color:selectedExp===e.id?e.color:"#cbd5e1" }}>Exp {e.id} · {e.name}</div>
                {e.id===3&&<div style={{ fontSize:8, padding:"1px 5px", borderRadius:3, background:"#10b98118", color:"#10b981", fontWeight:700 }}>HOT</div>}
              </div>
              <div style={{ fontSize:10, color:"rgba(255,255,255,.36)", marginBottom:3 }}>{e.feel}</div>
              <div style={{ fontSize:12, fontWeight:700, color:e.color }}>{e.price}<span style={{ fontSize:9, fontWeight:400, color:"rgba(255,255,255,.28)" }}>/intent · {e.priceUSD}</span></div>
            </div>
          ))}
        </div>

        {/* CENTER */}
        <div className="shop-main" style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>
          {/* Metrics */}
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"9px 16px", borderBottom:"1px solid rgba(255,255,255,.07)", flexShrink:0, flexWrap:"wrap", gap:8 }}>
            <div style={{ display:"flex", alignItems:"center", gap:7 }}>
              <div style={{ width:7, height:7, borderRadius:"50%", background:callState==="active"?"#22c55e":callState==="connecting"?"#f59e0b":"#2d3f52", animation:callState==="active"?"pulse 2s infinite":"none" }}/>
              <span style={{ fontSize:12, fontWeight:700, color:exp.color }}>Exp {selectedExp}: {exp.name}</span>
              <span style={{ fontSize:11, color:"rgba(255,255,255,.26)" }}>· {exp.latency}</span>
            </div>
            <div style={{ display:"flex", gap:16 }}>
              {[{l:"Duration",v:fmtTime(elapsed),c:"#fff"},{l:"Cost",v:`₹${cost.toFixed(3)}`,c:"#22c55e"},{l:"Intents",v:intents,c:"#a78bfa"}].map(m=>(
                <div key={m.l} style={{ textAlign:"right" }}>
                  <div style={{ fontSize:9, color:"rgba(255,255,255,.28)", textTransform:"uppercase", letterSpacing:"1px" }}>{m.l}</div>
                  <div style={{ fontSize:15, fontWeight:700, fontFamily:"'JetBrains Mono',monospace", color:m.c }}>{m.v}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Transcript */}
          <div ref={txRef} style={{ flex:1, overflowY:"auto", padding:"16px" }}>
            {callState==="idle"&&(
              <div style={{ height:"100%", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:16 }}>
                <SoundWave active={false}/>
                <div style={{ fontSize:20, fontWeight:800, color:"#fff", textAlign:"center", lineHeight:1.3 }}>
                  Experience AI handling<br/><span style={{ color:ind.color }}>{ind.label}</span> calls
                </div>
                <div style={{ fontSize:13, color:"rgba(255,255,255,.36)", textAlign:"center", maxWidth:280, lineHeight:1.6 }}>
                  Click Start Call. Speak naturally. Watch the AI resolve your customer's request.
                </div>
              </div>
            )}
            {callState==="connecting"&&(
              <div style={{ height:"100%", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:13 }}>
                <SoundWave active={true}/>
                <div style={{ fontSize:13, color:"rgba(255,255,255,.42)", fontFamily:"'JetBrains Mono',monospace" }}>Connecting to AI agent…</div>
              </div>
            )}
            {(callState==="active"||callState==="ended")&&transcript.map((l,i)=>(
              <TxLine key={i} line={l} delay={i*80}/>
            ))}
          </div>

          {/* Controls */}
          <div style={{ padding:"11px 16px", borderTop:"1px solid rgba(255,255,255,.07)", display:"flex", justifyContent:"center", gap:10, flexShrink:0 }}>
            {callState==="idle"&&<button onClick={startCall} style={{ padding:"11px 36px", borderRadius:10, background:"#22c55e", color:"#fff", border:"none", cursor:"pointer", fontWeight:800, fontSize:14 }}>📞 Start Call</button>}
            {callState==="connecting"&&<button disabled style={{ padding:"11px 36px", borderRadius:10, background:"rgba(255,255,255,.07)", color:"rgba(255,255,255,.32)", border:"none", cursor:"not-allowed", fontWeight:700, fontSize:14 }}>Connecting…</button>}
            {callState==="active"&&<button onClick={endCall} style={{ padding:"11px 36px", borderRadius:10, background:"#ef4444", color:"#fff", border:"none", cursor:"pointer", fontWeight:800, fontSize:14 }}>📵 End Call</button>}
          </div>
        </div>

        {/* RIGHT */}
        <div className="shop-right" style={{ width:234, borderLeft:"1px solid rgba(255,255,255,.07)", padding:13, display:"flex", flexDirection:"column", gap:10, flexShrink:0 }}>
          <div style={{ padding:"11px 12px", borderRadius:12, border:`2px solid ${keypadActive?"#22c55e":"rgba(255,255,255,.07)"}`, background:keypadActive?"rgba(34,197,94,.07)":"rgba(255,255,255,.02)", transition:"all .5s" }}>
            <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:3 }}>
              <div style={{ width:8, height:8, borderRadius:"50%", background:keypadActive?"#22c55e":callState==="active"?"#ef4444":"#2d3f52", animation:(keypadActive||callState==="active")?"pulse 1.5s infinite":"none" }}/>
              <span style={{ fontSize:12, fontWeight:700, color:keypadActive?"#22c55e":callState==="active"?"#ef4444":"rgba(255,255,255,.3)" }}>
                {keypadActive?"Menu Active":callState==="active"?"AI Listening":"Idle"}
              </span>
            </div>
            <div style={{ fontSize:10, color:"rgba(255,255,255,.28)" }}>
              {keypadActive?"Use keypad to navigate options":callState==="active"?"Speak naturally":"Start a call to begin"}
            </div>
          </div>

          <div style={{ overflow:"hidden", transition:"max-height .5s ease, opacity .4s", maxHeight:keypadActive?290:0, opacity:keypadActive?1:0 }}>
            <div style={{ padding:11, background:"rgba(34,197,94,.05)", borderRadius:12, border:"1px solid rgba(34,197,94,.17)" }}>
              <div style={{ fontSize:10, fontWeight:700, color:"#22c55e", textAlign:"center", marginBottom:9, letterSpacing:"1.5px", textTransform:"uppercase" }}>Navigation Menu</div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:6 }}>
                {[1,2,3,4,5,6,7,8,9,"*",0,"#"].map(d=>(
                  <button key={d} onClick={()=>pressKey(String(d))}
                    style={{ padding:"10px 0", borderRadius:9, border:"1px solid rgba(34,197,94,.2)", background:"rgba(10,28,18,.85)", color:"#e0e4ec", fontWeight:700, fontSize:17, cursor:"pointer", transition:"background .1s" }}
                    onMouseDown={e=>e.currentTarget.style.background="#22c55e"}
                    onMouseUp={e=>e.currentTarget.style.background="rgba(10,28,18,.85)"}>{d}</button>
                ))}
              </div>
              <div style={{ fontSize:10, color:"rgba(255,255,255,.22)", textAlign:"center", marginTop:8 }}>Press 1–9 to navigate</div>
            </div>
          </div>

          {callState==="active"&&!keypadActive&&(
            <div style={{ padding:12, background:"rgba(255,255,255,.03)", borderRadius:12, border:"1px solid rgba(255,255,255,.06)" }}>
              <SoundWave active={true} bars={18}/>
              <div style={{ fontSize:10, color:"rgba(255,255,255,.32)", textAlign:"center", marginTop:8, fontFamily:"'JetBrains Mono',monospace" }}>AI is listening</div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// CTA FORM
// ═══════════════════════════════════════════════════════════════════════════════
function CTAForm({ context, onBack }) {
  const [step, setStep]               = useState(1)
  const [form, setForm]               = useState({ name:"", email:"", phone:"", designation:"" })
  const [uploadType, setUploadType]   = useState(null)
  const [submitted, setSubmitted]     = useState(false)

  const ind = context?.industry||INDUSTRIES[0]
  const exp = context?.exp||EXPERIENCES[4]
  const set = (k,v)=>setForm(f=>({...f,[k]:v}))
  const inp = { width:"100%", padding:"10px 12px", borderRadius:8, border:"1px solid rgba(255,255,255,.1)", background:"rgba(255,255,255,.05)", color:"#fff", fontSize:13, outline:"none", boxSizing:"border-box", fontFamily:"'DM Sans',sans-serif" }

  return (
    <div style={{ height:"100%", display:"flex", alignItems:"center", justifyContent:"center", background:"#070d1a", fontFamily:"'DM Sans',sans-serif", position:"relative", overflow:"hidden", padding:"20px" }}>
      <WaveBg color={ind.color} opacity={0.09}/>
      {!submitted?(
        <div style={{ position:"relative", zIndex:1, width:"100%", maxWidth:500 }}>
          {/* Progress */}
          <div style={{ display:"flex", alignItems:"center", gap:8, justifyContent:"center", marginBottom:26 }}>
            {[1,2,3].map(s=>(
              <div key={s} style={{ display:"flex", alignItems:"center", gap:8 }}>
                <div style={{ width:28, height:28, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:700, transition:"all .3s", background:s<=step?"#3b82f6":"rgba(255,255,255,.1)", color:s<=step?"#fff":"rgba(255,255,255,.28)" }}>{s}</div>
                {s<3&&<div style={{ width:34, height:2, borderRadius:1, transition:"background .3s", background:s<step?"#3b82f6":"rgba(255,255,255,.1)" }}/>}
              </div>
            ))}
          </div>

          <div style={{ background:"rgba(255,255,255,.04)", border:"1px solid rgba(255,255,255,.09)", borderRadius:20, padding:"28px 30px" }}>
            <div style={{ display:"inline-flex", alignItems:"center", gap:6, padding:"4px 12px", borderRadius:99, background:`${ind.color}15`, border:`1px solid ${ind.color}36`, fontSize:12, color:ind.color, marginBottom:16 }}>
              {ind.icon} {ind.label} · {exp.name}
            </div>

            {step===1&&(
              <>
                <h2 style={{ fontSize:22, fontWeight:800, color:"#fff", marginBottom:5 }}>You just experienced Exp {exp.id}</h2>
                <p style={{ fontSize:13, color:"rgba(255,255,255,.4)", marginBottom:22 }}>Get a 7-day free trial with your own IVR. No credit card needed.</p>
                <div className="form-2col" style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:11, marginBottom:11 }}>
                  {[["name","Full Name"],["designation","Designation"]].map(([k,l])=>(
                    <div key={k}>
                      <div style={{ fontSize:10, fontWeight:700, color:"rgba(255,255,255,.36)", marginBottom:5, textTransform:"uppercase", letterSpacing:".5px" }}>{l}</div>
                      <input value={form[k]} onChange={e=>set(k,e.target.value)} placeholder={l} style={inp}/>
                    </div>
                  ))}
                </div>
                <div className="form-2col" style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:11, marginBottom:20 }}>
                  {[["email","Work Email"],["phone","Phone Number"]].map(([k,l])=>(
                    <div key={k}>
                      <div style={{ fontSize:10, fontWeight:700, color:"rgba(255,255,255,.36)", marginBottom:5, textTransform:"uppercase", letterSpacing:".5px" }}>{l}</div>
                      <input value={form[k]} onChange={e=>set(k,e.target.value)} placeholder={l} style={inp}/>
                    </div>
                  ))}
                </div>
                <button onClick={()=>setStep(2)} style={{ width:"100%", padding:"12px", borderRadius:10, background:"#3b82f6", color:"#fff", border:"none", cursor:"pointer", fontWeight:700, fontSize:14 }}>Continue →</button>
              </>
            )}

            {step===2&&(
              <>
                <h2 style={{ fontSize:22, fontWeight:800, color:"#fff", marginBottom:5 }}>Connect your IVR</h2>
                <p style={{ fontSize:13, color:"rgba(255,255,255,.4)", marginBottom:20 }}>Choose how you'd like to share your IVR with us.</p>
                <div className="cta-opt-grid" style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:9, marginBottom:20 }}>
                  {[
                    { id:"number",   icon:"📞", label:"IVR Phone Number", desc:"We analyse your IVR flow automatically" },
                    { id:"vxml",     icon:"📄", label:"Upload Voice XML",  desc:".vxml file from your IVR platform" },
                    { id:"doc",      icon:"📊", label:"IVR Flow Document", desc:"PDF, Word, or Excel with your flow" },
                    { id:"schedule", icon:"📅", label:"Schedule a Call",   desc:"Our team will walk through it with you" },
                  ].map(opt=>(
                    <div key={opt.id} onClick={()=>setUploadType(opt.id)} style={{ padding:"12px", borderRadius:12, cursor:"pointer", transition:"all .2s",
                      border:`1px solid ${uploadType===opt.id?"#3b82f6":"rgba(255,255,255,.08)"}`,
                      background:uploadType===opt.id?"rgba(59,130,246,.1)":"rgba(255,255,255,.02)" }}>
                      <div style={{ fontSize:18, marginBottom:5 }}>{opt.icon}</div>
                      <div style={{ fontSize:12, fontWeight:700, color:"#fff", marginBottom:3 }}>{opt.label}</div>
                      <div style={{ fontSize:11, color:"rgba(255,255,255,.36)" }}>{opt.desc}</div>
                    </div>
                  ))}
                </div>
                {uploadType==="number"&&<input placeholder="+91 XXXXX XXXXX" style={{ ...inp, marginBottom:13 }}/>}
                <div style={{ display:"flex", gap:9 }}>
                  <button onClick={()=>setStep(1)} style={{ flex:1, padding:"11px", borderRadius:10, background:"rgba(255,255,255,.07)", color:"#fff", border:"1px solid rgba(255,255,255,.1)", cursor:"pointer", fontWeight:600, fontSize:13 }}>← Back</button>
                  <button onClick={()=>setStep(3)} disabled={!uploadType} style={{ flex:2, padding:"11px", borderRadius:10, background:uploadType?"#3b82f6":"rgba(255,255,255,.1)", color:uploadType?"#fff":"rgba(255,255,255,.28)", border:"none", cursor:uploadType?"pointer":"not-allowed", fontWeight:700, fontSize:13 }}>Continue →</button>
                </div>
              </>
            )}

            {step===3&&(
              <>
                <h2 style={{ fontSize:22, fontWeight:800, color:"#fff", marginBottom:5 }}>Review & confirm</h2>
                <p style={{ fontSize:13, color:"rgba(255,255,255,.4)", marginBottom:18 }}>Your 7-day free trial details.</p>
                <div style={{ background:"rgba(255,255,255,.04)", borderRadius:12, padding:13, marginBottom:16 }}>
                  {[
                    { l:"Industry", v:`${ind.icon} ${ind.label}` },
                    { l:"Experience", v:`Exp ${exp.id} · ${exp.name} · ${exp.price}/intent` },
                    { l:"Trial", v:"7 days free · No credit card" },
                    { l:"IVR Input", v:{number:"📞 Phone number",vxml:"📄 VXML file",doc:"📊 Document",schedule:"📅 Scheduled call"}[uploadType] },
                  ].map(r=>(
                    <div key={r.l} style={{ display:"flex", justifyContent:"space-between", padding:"8px 0", borderBottom:"1px solid rgba(255,255,255,.06)" }}>
                      <span style={{ fontSize:12, color:"rgba(255,255,255,.36)" }}>{r.l}</span>
                      <span style={{ fontSize:12, color:"#fff", fontWeight:600 }}>{r.v}</span>
                    </div>
                  ))}
                </div>
                <div style={{ display:"flex", gap:9 }}>
                  <button onClick={()=>setStep(2)} style={{ flex:1, padding:"11px", borderRadius:10, background:"rgba(255,255,255,.07)", color:"#fff", border:"1px solid rgba(255,255,255,.1)", cursor:"pointer", fontWeight:600 }}>← Back</button>
                  <button onClick={()=>setSubmitted(true)} style={{ flex:2, padding:"11px", borderRadius:10, background:"linear-gradient(135deg,#3b82f6,#06b6d4)", color:"#fff", border:"none", cursor:"pointer", fontWeight:700, fontSize:13 }}>🚀 Start My Free Trial</button>
                </div>
              </>
            )}
          </div>
          <button onClick={onBack} style={{ display:"block", margin:"13px auto 0", background:"none", border:"none", color:"rgba(255,255,255,.26)", cursor:"pointer", fontSize:12 }}>← Back to Experience Shop</button>
        </div>
      ):(
        <div style={{ position:"relative", zIndex:1, textAlign:"center", padding:40, maxWidth:440 }}>
          <div style={{ fontSize:50, marginBottom:16 }}>🎉</div>
          <h2 style={{ fontSize:28, fontWeight:900, color:"#fff", marginBottom:10 }}>Trial Started!</h2>
          <p style={{ fontSize:14, color:"rgba(255,255,255,.48)", marginBottom:26, lineHeight:1.65 }}>
            We'll set up your {ind.label} AI environment within 24 hours. Check <strong style={{ color:"#60a5fa" }}>{form.email||"your inbox"}</strong>.
          </p>
          <div style={{ display:"inline-flex", alignItems:"center", gap:8, padding:"8px 20px", borderRadius:99, background:"rgba(34,197,94,.1)", border:"1px solid rgba(34,197,94,.26)", color:"#22c55e", fontSize:13, fontWeight:700 }}>
            ✓ Next: Test stage — validate your IVR flow
          </div>
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// ROOT
// ═══════════════════════════════════════════════════════════════════════════════
export default function App() {
  const router = useRouter()
  const goToExperience = () => router.push("/")

  return (
    <>
      <style>{GLOBAL_CSS}</style>
      <div style={{ width:"100%", height:"100vh", overflow:"hidden" }}>
        <LandingPage onEnter={goToExperience} />
      </div>
    </>
  )
}

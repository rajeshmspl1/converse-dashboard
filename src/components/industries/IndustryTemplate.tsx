'use client'
import { useRouter } from 'next/navigation'
import StaticPageShell from '@/components/layout/StaticPageShell'

interface IndustryProps {
  emoji: string
  name: string
  headline: string
  subheadline: string
  color: string
  intents: { name: string; desc: string; time: string }[]
  stats: { label: string; before: string; after: string }[]
  challenges: { problem: string; solution: string }[]
  compliance: string[]
}

export default function IndustryTemplate({ emoji, name, headline, subheadline, color, intents, stats, challenges, compliance }: IndustryProps) {
  const router = useRouter()

  return (
    <StaticPageShell>
      {/* Hero */}
      <section className="text-center px-4 sm:px-6 pt-16 pb-8">
        <div className="text-[40px] mb-2">{emoji}</div>
        <div className="text-[11px] font-semibold uppercase tracking-widest mb-2" style={{ color }}>AI IVR for {name}</div>
        <h1 className="text-[28px] sm:text-[40px] font-black tracking-tight mb-3" style={{ letterSpacing: '-1px' }}>{headline}</h1>
        <p className="text-[14px] sm:text-[16px] mx-auto leading-relaxed" style={{ color: 'var(--tx2)', maxWidth: 580 }}>{subheadline}</p>
        <div className="flex justify-center gap-3 mt-5">
          <button onClick={() => router.push('/')} className="px-6 py-2.5 rounded-[10px] text-[13px] font-bold border-none cursor-pointer" style={{ background: color, color: '#000' }}>
            ▶ Try {name} Demo
          </button>
          <button onClick={() => router.push('/contact-sales')} className="px-6 py-2.5 rounded-[10px] text-[13px] font-semibold cursor-pointer" style={{ background: 'transparent', color: 'var(--tx2)', border: '1px solid var(--b1)' }}>
            Book a Demo →
          </button>
        </div>
      </section>

      {/* Intents */}
      <section className="max-w-[1000px] mx-auto px-4 sm:px-6 py-10" style={{ borderTop: '1px solid var(--b1)' }}>
        <h2 className="text-center text-[22px] sm:text-[28px] font-bold mb-2">Intents AI resolves for {name.toLowerCase()}</h2>
        <p className="text-center text-[13px] mb-8" style={{ color: 'var(--tx3)' }}>Each intent resolved in seconds. Per-intent pricing from $0.006.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {intents.map((intent, i) => (
            <div key={i} className="p-4 rounded-xl border" style={{ background: 'var(--s1)', borderColor: 'var(--b1)' }}>
              <div className="text-[13px] font-bold mb-1">{intent.name}</div>
              <div className="text-[10px] leading-relaxed mb-2" style={{ color: 'var(--tx3)' }}>{intent.desc}</div>
              <div className="text-[9px] font-bold" style={{ color }}>{intent.time}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Before/After Stats */}
      <section className="max-w-[1000px] mx-auto px-4 sm:px-6 py-10" style={{ borderTop: '1px solid var(--b1)' }}>
        <h2 className="text-center text-[22px] sm:text-[28px] font-bold mb-6">Before vs after AiIVRs</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {stats.map((s, i) => (
            <div key={i} className="p-4 rounded-xl border text-center" style={{ background: 'var(--s1)', borderColor: 'var(--b1)' }}>
              <div className="text-[11px] font-bold mb-2">{s.label}</div>
              <div className="flex items-center justify-center gap-2">
                <span className="text-[14px] font-bold" style={{ color: '#f03060', textDecoration: 'line-through', opacity: 0.6 }}>{s.before}</span>
                <span className="text-[10px]" style={{ color: 'var(--tx3)' }}>→</span>
                <span className="text-[18px] font-extrabold" style={{ fontFamily: "'JetBrains Mono', monospace", color: '#00c9b1' }}>{s.after}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Challenges solved */}
      <section className="max-w-[1000px] mx-auto px-4 sm:px-6 py-10" style={{ borderTop: '1px solid var(--b1)' }}>
        <h2 className="text-center text-[22px] sm:text-[28px] font-bold mb-6">{name} challenges AiIVRs solves</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {challenges.map((c, i) => (
            <div key={i} className="p-4 rounded-xl border" style={{ background: 'var(--s1)', borderColor: 'var(--b1)' }}>
              <div className="text-[11px] font-bold mb-1" style={{ color: '#f03060' }}>Problem: {c.problem}</div>
              <div className="text-[11px] leading-relaxed" style={{ color: 'var(--tx2)' }}>
                <span className="font-bold" style={{ color: '#00c9b1' }}>AiIVRs:</span> {c.solution}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Compliance */}
      <section className="max-w-[1000px] mx-auto px-4 sm:px-6 py-10" style={{ borderTop: '1px solid var(--b1)' }}>
        <h2 className="text-center text-[22px] sm:text-[28px] font-bold mb-6">Compliance + security for {name.toLowerCase()}</h2>
        <div className="flex flex-wrap gap-2 justify-center">
          {compliance.map((c, i) => (
            <span key={i} className="px-3 py-1.5 rounded-md text-[10px] font-semibold" style={{ background: 'var(--s1)', border: '1px solid var(--b1)', color: 'var(--tx2)' }}>
              ✓ {c}
            </span>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-[900px] mx-auto px-4 sm:px-6 py-10 pb-16">
        <div className="text-center p-8 sm:p-10 rounded-2xl border" style={{ background: 'linear-gradient(135deg, rgba(59,130,246,.06), rgba(6,182,212,.04))', borderColor: 'rgba(59,130,246,.1)' }}>
          <h2 className="text-[18px] sm:text-[22px] font-bold mb-2">Try AI IVR for {name.toLowerCase()} — live.</h2>
          <p className="text-[12px] sm:text-[13px] mb-5" style={{ color: 'var(--tx3)' }}>Hear AI resolve your sector&apos;s real intents. 17 minutes to production. No IT.</p>
          <button onClick={() => router.push('/')} className="px-8 py-3 rounded-[10px] text-[14px] font-bold border-none cursor-pointer" style={{ background: '#00c9b1', color: '#000' }}>
            ▶ Try Live Demo →
          </button>
        </div>
      </section>
    </StaticPageShell>
  )
}

'use client'
import { useRouter } from 'next/navigation'
import StaticPageShell from '@/components/layout/StaticPageShell'

export default function ComparePage() {
  const router = useRouter()
  return (
    <StaticPageShell>
      <section className="text-center px-4 sm:px-6 pt-16 pb-8">
        <div className="text-[11px] font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--tx3)' }}>Honest comparisons</div>
        <h1 className="text-[28px] sm:text-[40px] font-black tracking-tight mb-3" style={{ letterSpacing: '-1px' }}>How AiIVRs compares</h1>
        <p className="text-[14px] sm:text-[16px] mx-auto leading-relaxed" style={{ color: 'var(--tx2)', maxWidth: 580 }}>
          Transparent, honest comparisons with other voice AI platforms. We show where we win and where they&apos;re strong.
        </p>
      </section>
      <section className="max-w-[900px] mx-auto px-4 sm:px-6 pb-16">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { slug: 'retell-ai', name: 'Retell AI', desc: '$40M+ ARR. 40M calls/month. Developer-friendly. Per-minute pricing at $0.07/min. We charge per-intent at $0.006.', tag: 'Most compared', color: '#3370E8' },
            { slug: 'vapi', name: 'VAPI', desc: 'Developer-first. API-heavy. $0.05–$0.33/min + platform fees + STT fees. We include everything in $0.006/intent.', tag: 'Developer favorite', color: '#8b5cf6' },
            { slug: 'polyai', name: 'PolyAI', desc: 'Enterprise banking. $150K+/year custom contracts. 3-6 month deployment. We go live in 17 minutes at $0.006/intent.', tag: 'Enterprise incumbent', color: '#f5a623' },
          ].map((c) => (
            <div key={c.slug} onClick={() => router.push(`/compare/${c.slug}`)}
              className="p-5 sm:p-6 rounded-xl border cursor-pointer transition-all hover:-translate-y-1 hover:border-[#00c9b1]"
              style={{ background: 'var(--s1)', borderColor: 'var(--b1)' }}>
              <div className="text-[9px] font-bold px-2 py-0.5 rounded inline-block mb-3" style={{ background: `${c.color}20`, color: c.color }}>{c.tag}</div>
              <h2 className="text-[18px] font-bold mb-2">AiIVRs vs {c.name}</h2>
              <p className="text-[11px] leading-relaxed mb-3" style={{ color: 'var(--tx3)' }}>{c.desc}</p>
              <div className="text-[11px] font-semibold" style={{ color: '#00c9b1' }}>See full comparison →</div>
            </div>
          ))}
        </div>
      </section>
    </StaticPageShell>
  )
}

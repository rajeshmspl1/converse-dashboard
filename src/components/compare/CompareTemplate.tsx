'use client'
import { useRouter } from 'next/navigation'
import StaticPageShell from '@/components/layout/StaticPageShell'

interface CompareProps {
  competitor: string
  logo: string
  tagline: string
  headline: string
  subheadline: string
  comparison: { feature: string; aiivrs: string; them: string; winner: 'aiivrs' | 'them' | 'tie' }[]
  pricing: { label: string; aiivrs: string; them: string }[]
  advantages: string[]
  theirStrengths: string[]
  verdict: string
}

function TryJourneyBar({ router }: { router: ReturnType<typeof useRouter> }) {
  return (
    <div className="flex flex-wrap gap-2 justify-center py-4">
      {[
        { label: '⚡ Lower Cost', journey: 0, color: '#00c9b1' },
        { label: '💰 Sales Discovery', journey: 1, color: '#00de7a' },
        { label: '🔥 Frustration Recovery', journey: 2, color: '#f03060' },
        { label: '🎯 Value Routing', journey: 3, color: '#f5a623' },
      ].map((j) => (
        <button key={j.journey} onClick={() => router.push(`/?journey=${j.journey}`)}
          className="px-3 py-1.5 rounded-lg text-[10px] font-semibold cursor-pointer border-none transition-all hover:opacity-80"
          style={{ background: `${j.color}18`, color: j.color, border: `1px solid ${j.color}30` }}>
          {j.label} →
        </button>
      ))}
    </div>
  )
}

export default function CompareTemplate({ competitor, logo, tagline, headline, subheadline, comparison, pricing, advantages, theirStrengths, verdict }: CompareProps) {
  const router = useRouter()

  return (
    <StaticPageShell>
      {/* Hero */}
      <section className="text-center px-4 sm:px-6 pt-16 pb-8">
        <div className="text-[11px] font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--tx3)' }}>Honest comparison</div>
        <h1 className="text-[26px] sm:text-[38px] font-black tracking-tight mb-3" style={{ letterSpacing: '-1px' }}>{headline}</h1>
        <p className="text-[14px] sm:text-[16px] mx-auto leading-relaxed" style={{ color: 'var(--tx2)', maxWidth: 600 }}>{subheadline}</p>
        <button onClick={() => router.push('/')}
          className="mt-5 px-6 py-2.5 rounded-[10px] text-[13px] font-bold border-none cursor-pointer"
          style={{ background: '#00c9b1', color: '#000' }}>
          ▶ Try Live Demo — see the difference
        </button>
      </section>

      {/* Feature comparison table */}
      <section className="max-w-[900px] mx-auto px-4 sm:px-6 pb-4">
        <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--b1)' }}>
          <div className="grid grid-cols-3 gap-0" style={{ background: 'var(--s1)' }}>
            <div className="p-3 sm:p-4 text-[11px] font-semibold" style={{ color: 'var(--tx3)', borderBottom: '1px solid var(--b1)' }}>Feature</div>
            <div className="p-3 sm:p-4 text-[11px] font-bold text-center" style={{ color: '#00c9b1', borderBottom: '1px solid var(--b1)', borderLeft: '1px solid var(--b1)' }}>AiIVRs</div>
            <div className="p-3 sm:p-4 text-[11px] font-bold text-center" style={{ color: 'var(--tx2)', borderBottom: '1px solid var(--b1)', borderLeft: '1px solid var(--b1)' }}>{competitor}</div>
          </div>
          {comparison.map((row, i) => (
            <div key={i} className="grid grid-cols-3 gap-0" style={{ background: i % 2 === 0 ? 'transparent' : 'rgba(13,21,38,.5)' }}>
              <div className="p-3 sm:p-4 text-[11px] font-semibold" style={{ color: 'var(--tx2)', borderBottom: '1px solid rgba(28,45,69,.3)' }}>{row.feature}</div>
              <div className="p-3 sm:p-4 text-[10px] sm:text-[11px] text-center" style={{ color: row.winner === 'aiivrs' ? '#00c9b1' : 'var(--tx3)', borderBottom: '1px solid rgba(28,45,69,.3)', borderLeft: '1px solid var(--b1)', fontWeight: row.winner === 'aiivrs' ? 700 : 400 }}>
                {row.winner === 'aiivrs' && <span className="mr-1">✓</span>}{row.aiivrs}
              </div>
              <div className="p-3 sm:p-4 text-[10px] sm:text-[11px] text-center" style={{ color: 'var(--tx3)', borderBottom: '1px solid rgba(28,45,69,.3)', borderLeft: '1px solid var(--b1)' }}>
                {row.them}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Mid-page CTA — journey buttons */}
      <section className="max-w-[900px] mx-auto px-4 sm:px-6 pb-6">
        <div className="text-center text-[11px] mb-1" style={{ color: 'var(--tx3)' }}>Try each journey live — no signup needed</div>
        <TryJourneyBar router={router} />
      </section>

      {/* Pricing comparison */}
      <section className="max-w-[900px] mx-auto px-4 sm:px-6 py-10" style={{ borderTop: '1px solid var(--b1)' }}>
        <h2 className="text-center text-[22px] sm:text-[28px] font-bold mb-6">Pricing: AiIVRs vs {competitor}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-5 rounded-xl border" style={{ background: 'var(--s1)', borderColor: 'rgba(0,201,177,.3)' }}>
            <div className="text-[16px] font-bold mb-3" style={{ color: '#00c9b1' }}>AiIVRs</div>
            {pricing.map((p, i) => (
              <div key={i} className="flex justify-between py-2 border-b text-[11px]" style={{ borderColor: 'rgba(28,45,69,.3)' }}>
                <span style={{ color: 'var(--tx3)' }}>{p.label}</span>
                <span className="font-bold" style={{ color: '#00c9b1' }}>{p.aiivrs}</span>
              </div>
            ))}
            <button onClick={() => router.push('/')}
              className="w-full mt-4 py-2.5 rounded-lg text-[11px] font-bold cursor-pointer border-none"
              style={{ background: '#00c9b1', color: '#000' }}>
              ▶ Try Live Demo
            </button>
          </div>
          <div className="p-5 rounded-xl border" style={{ background: 'var(--s1)', borderColor: 'var(--b1)' }}>
            <div className="text-[16px] font-bold mb-3" style={{ color: 'var(--tx2)' }}>{competitor}</div>
            {pricing.map((p, i) => (
              <div key={i} className="flex justify-between py-2 border-b text-[11px]" style={{ borderColor: 'rgba(28,45,69,.3)' }}>
                <span style={{ color: 'var(--tx3)' }}>{p.label}</span>
                <span style={{ color: 'var(--tx3)' }}>{p.them}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why AiIVRs */}
      <section className="max-w-[900px] mx-auto px-4 sm:px-6 py-10" style={{ borderTop: '1px solid var(--b1)' }}>
        <h2 className="text-[18px] sm:text-[22px] font-bold mb-4" style={{ color: '#00c9b1' }}>Why CX managers choose AiIVRs over {competitor}</h2>
        {advantages.map((a, i) => (
          <div key={i} className="flex items-start gap-2 py-2 text-[11px] sm:text-[12px]" style={{ color: 'var(--tx2)' }}>
            <span className="flex-shrink-0 mt-0.5" style={{ color: '#00c9b1' }}>✓</span> {a}
          </div>
        ))}
        <div className="mt-4">
          <TryJourneyBar router={router} />
        </div>
      </section>

      {/* Minimal competitor note */}
      {theirStrengths.length > 0 && (
        <section className="max-w-[900px] mx-auto px-4 sm:px-6 py-6" style={{ borderTop: '1px solid var(--b1)' }}>
          <div className="text-[12px] font-semibold mb-2" style={{ color: 'var(--tx3)' }}>Where {competitor} may fit</div>
          {theirStrengths.map((s, i) => (
            <div key={i} className="text-[10px] py-1" style={{ color: 'var(--tx3)' }}>● {s}</div>
          ))}
        </section>
      )}

      {/* Verdict */}
      <section className="max-w-[900px] mx-auto px-4 sm:px-6 py-10" style={{ borderTop: '1px solid var(--b1)' }}>
        <div className="p-5 sm:p-6 rounded-xl" style={{ background: 'var(--s1)', border: '1px solid rgba(0,201,177,.2)' }}>
          <h2 className="text-[16px] font-bold mb-2" style={{ color: '#00c9b1' }}>Bottom line</h2>
          <p className="text-[12px] sm:text-[13px] leading-relaxed mb-4" style={{ color: 'var(--tx2)' }}>{verdict}</p>
          <button onClick={() => router.push('/')}
            className="px-6 py-2.5 rounded-[10px] text-[12px] font-bold border-none cursor-pointer"
            style={{ background: '#00c9b1', color: '#000' }}>
            ▶ See it live — Try the Demo
          </button>
        </div>
      </section>

      {/* Final CTA */}
      <section className="max-w-[900px] mx-auto px-4 sm:px-6 py-10 pb-16">
        <div className="text-center p-8 sm:p-10 rounded-2xl border" style={{ background: 'linear-gradient(135deg, rgba(59,130,246,.06), rgba(6,182,212,.04))', borderColor: 'rgba(59,130,246,.1)' }}>
          <h2 className="text-[18px] sm:text-[22px] font-bold mb-2">Don&apos;t compare on paper. Compare on a live call.</h2>
          <p className="text-[12px] sm:text-[13px] mb-5" style={{ color: 'var(--tx3)' }}>Try all 4 journeys. Watch per-intent cost calculate in real-time. No signup. No credit card.</p>
          <TryJourneyBar router={router} />
          <div className="mt-3">
            <button onClick={() => router.push('/contact-sales')}
              className="px-6 py-2.5 rounded-[10px] text-[12px] font-semibold cursor-pointer"
              style={{ background: 'transparent', color: 'var(--tx2)', border: '1px solid var(--b1)' }}>
              Or book a 15-min demo on YOUR IVR →
            </button>
          </div>
        </div>
      </section>
    </StaticPageShell>
  )
}

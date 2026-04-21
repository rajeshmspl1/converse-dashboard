'use client'
import { useState, useEffect } from 'react'
import { DEMO_SCENARIOS, CURRENCY_CONFIG, INFRA_CONFIG, DEPLOY_CONFIG } from '@/lib/data'
import type { Currency } from '@/types'

interface LiveIntent {
  key: string
  exp: number
  cost: number
  latencyMs: number
  wasPromoted: boolean
  ts: number
}

interface Props {
  demoStep: number
  intents: LiveIntent[]
  totalCost: number
  currency: Currency
  onTryNext: () => void
  callDuration: number
}

export default function PostCallCelebration({ demoStep, intents, totalCost, currency, onTryNext, callDuration }: Props) {
  const [phase, setPhase] = useState(0)

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 600)
    const t2 = setTimeout(() => setPhase(2), 1200)
    const t3 = setTimeout(() => setPhase(3), 1800)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [])

  const scenario = DEMO_SCENARIOS[demoStep]
  if (!scenario) return null

  const cc = CURRENCY_CONFIG[currency] ?? CURRENCY_CONFIG[currency.toLowerCase() as Currency] ?? CURRENCY_CONFIG["inr"]
  const fmt = (inr: number) => `${cc.symbol}${(inr * cc.rate).toFixed(2)}`
  const isLast = demoStep >= DEMO_SCENARIOS.length - 1
  const infraCfg = INFRA_CONFIG[scenario.infra]
  const deployCfg = DEPLOY_CONFIG[scenario.deploy]

  return (
    <div className="flex flex-col gap-3 mt-3">

      {/* PHASE 0: Summary */}
      <div className="rounded-xl border p-3 md:p-4" style={{
        borderColor: 'rgba(34,197,94,.3)',
        background: 'linear-gradient(135deg, rgba(34,197,94,.06), rgba(139,92,246,.04))',
        animation: 'fadeSlideIn 0.6s ease-out',
      }}>
        <div className="text-[9px] md:text-[10px] font-bold uppercase tracking-[.2em] text-center mb-3" style={{ color: '#22c55e' }}>
          Call Summary
        </div>
        <div className="flex items-center justify-around mb-3 flex-wrap gap-2">
          <div className="flex flex-col items-center">
            <div className="font-mono text-[24px] md:text-[32px] font-bold leading-none" style={{ color: '#a78bfa' }}>{intents.length}</div>
            <div className="text-[8px] md:text-[9px] uppercase mt-1" style={{ color: 'var(--dim)' }}>
              Intent{intents.length !== 1 ? 's' : ''}
            </div>
          </div>
          <div className="flex flex-col items-center">
            <div className="font-mono text-[24px] md:text-[32px] font-bold leading-none" style={{ color: '#34d399' }}>{fmt(totalCost)}</div>
            <div className="text-[8px] md:text-[9px] uppercase mt-1" style={{ color: 'var(--dim)' }}>Total cost</div>
          </div>
          {intents.length > 0 && (
            <div className="flex flex-col items-center">
              <div className="font-mono text-[24px] md:text-[32px] font-bold leading-none" style={{ color: '#fbbf24' }}>{fmt(totalCost / intents.length)}</div>
              <div className="text-[8px] md:text-[9px] uppercase mt-1" style={{ color: 'var(--dim)' }}>Avg/intent</div>
            </div>
          )}
        </div>

        {intents.map((intent, i) => (
          <div key={intent.key + i} className="flex items-center justify-between px-2 md:px-3 py-1.5 rounded mb-1 text-[10px] md:text-[11px] font-mono"
            style={{ background: 'rgba(255,255,255,.03)' }}>
            <span className="font-bold" style={{ color: 'var(--text)' }}>Intent {i + 1}</span>
            <span className="px-1.5 py-0.5 rounded text-[8px] md:text-[9px] font-bold" style={{ background: 'rgba(251,191,36,.1)', color: '#fbbf24' }}>Exp {intent.exp}</span>
            <span className="font-bold" style={{ color: '#34d399' }}>{fmt(intent.cost)}</span>
            <span style={{ color: 'var(--dim)' }}>{intent.latencyMs ? `${(intent.latencyMs / 1000).toFixed(1)}s` : ''}</span>
          </div>
        ))}
      </div>

      {/* PHASE 1: Industry First Badge + Infra context */}
      {phase >= 1 && (
        <div className="rounded-xl border p-3 md:p-4" style={{
          borderColor: 'rgba(245,158,11,.3)',
          background: 'linear-gradient(135deg, rgba(245,158,11,.06), rgba(236,72,153,.04))',
          animation: 'fadeSlideIn 0.5s ease-out',
        }}>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[18px] md:text-[20px]">{scenario.icon}</span>
            <div>
              <div className="text-[7px] md:text-[8px] font-bold uppercase tracking-[.25em] mb-0.5" style={{ color: '#f59e0b' }}>
                {scenario.industryFirst}
              </div>
              <div className="text-[14px] md:text-[16px] font-bold" style={{ color: 'var(--bright)' }}>
                {scenario.postBadgeTitle}
              </div>
            </div>
          </div>
          <div className="text-[12px] md:text-[13px] leading-relaxed mb-2" style={{ color: 'var(--text)' }}>
            {scenario.postBadgeBody}
          </div>

          {/* Infra context badge */}
          <div className="flex items-center gap-2 mt-2 px-2 py-1.5 rounded-lg text-[9px] md:text-[10px]"
            style={{ background: 'rgba(255,255,255,.03)', border: '1px solid var(--b1)' }}>
            <span>{infraCfg.icon}</span>
            <span style={{ color: infraCfg.color }}>{infraCfg.label}</span>
            <span style={{ color: 'var(--dim)' }}>·</span>
            <span>{deployCfg.icon}</span>
            <span style={{ color: deployCfg.color }}>{deployCfg.label}</span>
            <span style={{ color: 'var(--dim)' }}>·</span>
            <span style={{ color: 'var(--dim)' }}>Data: {scenario.dataResides.split('—')[0].trim()}</span>
          </div>

          {scenario.isSimulated && !scenario.isInfraDemo && (
            <div className="text-[8px] md:text-[9px] mt-2 px-2 py-1 rounded" style={{ background: 'rgba(255,255,255,.04)', color: 'var(--dim)' }}>
              Sales routing powered by CRM integration (Salesforce). Full version available in production.
            </div>
          )}
        </div>
      )}

      {/* PHASE 2: Cost Comparison */}
      {phase >= 2 && (
        <div className="rounded-xl border p-3 md:p-4" style={{
          borderColor: 'rgba(34,211,153,.2)',
          background: 'rgba(0,0,0,.15)',
          animation: 'fadeSlideIn 0.5s ease-out',
        }}>
          <div className="text-[7px] md:text-[8px] font-bold uppercase tracking-[.2em] mb-2" style={{ color: 'var(--dim)' }}>
            Cost Comparison
          </div>
          <div className="flex items-center gap-2 md:gap-3 mb-2">
            <div className="flex-1 rounded-lg p-2 md:p-2.5" style={{ background: 'rgba(220,38,38,.08)', border: '1px solid rgba(220,38,38,.2)' }}>
              <div className="text-[8px] md:text-[9px] font-bold uppercase mb-1" style={{ color: '#f87171' }}>Traditional IVR</div>
              <div className="font-mono text-[12px] md:text-[14px] font-bold" style={{ color: '#f87171' }}>
                {fmt(2.50 / 60 * 35)}
              </div>
              <div className="text-[7px] md:text-[8px]" style={{ color: 'var(--dim)' }}>~₹2.50/min × 35s</div>
            </div>
            <div className="text-[14px] md:text-[16px]" style={{ color: 'var(--dim)' }}>→</div>
            <div className="flex-1 rounded-lg p-2 md:p-2.5" style={{ background: 'rgba(34,197,94,.08)', border: '1px solid rgba(34,197,94,.2)' }}>
              <div className="text-[8px] md:text-[9px] font-bold uppercase mb-1" style={{ color: '#22c55e' }}>Converse AI</div>
              <div className="font-mono text-[12px] md:text-[14px] font-bold" style={{ color: '#22c55e' }}>
                {fmt(totalCost)}
              </div>
              <div className="text-[7px] md:text-[8px]" style={{ color: 'var(--dim)' }}>
                {intents.length} intent{intents.length !== 1 ? 's' : ''} · {callDuration}s
              </div>
            </div>
          </div>
          {totalCost > 0 && totalCost < (2.50 / 60 * 35) && (
            <div className="text-center text-[12px] md:text-[14px] font-bold" style={{ color: '#22c55e' }}>
              ▼ {Math.round((1 - totalCost / (2.50 / 60 * 35)) * 100)}% savings
            </div>
          )}
        </div>
      )}

      {/* PHASE 3: Try Next nudge (non-last scenarios only) */}
      {phase >= 3 && !isLast && (
        <div className="rounded-xl border p-3 md:p-4" style={{
          borderColor: 'rgba(99,102,241,.3)',
          background: 'linear-gradient(135deg, rgba(99,102,241,.06), rgba(6,182,212,.04))',
          animation: 'fadeSlideIn 0.5s ease-out',
        }}>
          {scenario.nextPrompt.map((p, i) => (
            <div key={i} className="text-[12px] md:text-[13px] leading-relaxed mb-2" style={{ color: 'var(--text)' }}>
              {p}
            </div>
          ))}
          <button onClick={onTryNext}
            className="w-full mt-2 py-2.5 md:py-3 rounded-lg font-bold text-[13px] md:text-[14px] transition-all hover:opacity-90 hover:scale-[1.01]"
            style={{
              background: 'linear-gradient(135deg, #6366f1, #06b6d4)',
              color: '#fff',
              boxShadow: '0 4px 20px rgba(99,102,241,.3)',
            }}>
            {scenario.nextButtonLabel}
          </button>
        </div>
      )}

      {/* PHASE 3: Sign-up CTA — EVERY scenario, always visible */}
      {phase >= 3 && (
        <div className="rounded-xl border p-3 md:p-4" style={{
          borderColor: 'rgba(24,196,138,.25)',
          background: 'linear-gradient(135deg, rgba(24,196,138,.04), rgba(51,112,232,.04))',
          animation: 'fadeSlideIn 0.5s ease-out',
        }}>
          <div className="text-[11px] md:text-[13px] leading-relaxed text-center mb-3" style={{ color: 'var(--text)' }}>
            {CTA_MESSAGES[demoStep % CTA_MESSAGES.length]}
          </div>
          <button onClick={() => alert('Coming soon — Import My IVR')}
            className="w-full py-2.5 md:py-3 rounded-lg font-bold text-[13px] md:text-[14px] transition-all hover:opacity-90 hover:scale-[1.01]"
            style={{ background: '#18c48a', color: '#050e1a' }}>
            Import My IVR — Free →
          </button>
          <div className="flex items-center justify-center gap-2 md:gap-3 mt-2 flex-wrap">
            {[
              { icon: '📞', label: 'Enter my IVR number' },
              { icon: '📄', label: 'Upload VoiceXML' },
              { icon: '🗓', label: 'Schedule a call' },
            ].map(btn => (
              <button key={btn.label} onClick={() => alert('Coming soon')}
                className="text-[8px] md:text-[9px] px-2 py-1 rounded-md border transition-colors hover:bg-white/5"
                style={{ borderColor: 'var(--b2)', color: 'var(--dim)' }}>
                {btn.icon} {btn.label}
              </button>
            ))}
          </div>
          <div className="flex items-center justify-center gap-1.5 md:gap-2 mt-2 flex-wrap">
            {['FREE', 'Zero migration cost', 'Zero integration', 'Under 30 minutes'].map(tag => (
              <span key={tag} className="text-[6px] md:text-[7px] font-bold px-1.5 py-0.5 rounded"
                style={{ background: tag === 'FREE' ? '#f59e0b' : 'rgba(255,255,255,.06)', color: tag === 'FREE' ? '#000' : 'var(--dim)' }}>
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// Contextual CTA message per scenario — gets more compelling as they see more
const CTA_MESSAGES = [
  'Liked per-intent pricing? Experience it with YOUR IVR — in 30 minutes. Free.',
  'Your Gold-tier customers deserve this. Import your IVR and see it with your own CRM data.',
  'Imagine this escalation on your live calls. Import your IVR — zero integration needed.',
  'Every service call is a revenue opportunity. Try it with your own IVR tree. Free.',
  'Your regional customers deserve native AI. Upload your IVR and go live in 30 minutes.',
  'You\'ve seen 6 Industry Firsts. Now experience them with YOUR customers. Free forever on demo tier.',
]

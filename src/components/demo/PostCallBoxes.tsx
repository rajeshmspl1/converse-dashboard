'use client'
import { useState } from 'react'
import { JOURNEY_CONFIGS, INDUSTRIES, CHIP_DATA } from '@/lib/journeyData'
import { DEMO_SCENARIOS, CURRENCY_CONFIG } from '@/lib/data'
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
  callDuration: number
  onTryNext: () => void
  onStartCall: () => void
  onNavigateJourney: (step: number) => void
  sessionDisplayId?: string
  onSignUp?: () => void
  onSelectIndustry?: (ivrKey: string) => void
  selectedIvr?: string
}

export default function PostCallBoxes({ demoStep, intents, totalCost, currency, callDuration, onTryNext, onStartCall, onNavigateJourney, sessionDisplayId, onSignUp, onSelectIndustry, selectedIvr }: Props) {
  const [panelOpen, setPanelOpen] = useState(false)

  const scenario = DEMO_SCENARIOS[demoStep]
  const jConfig = JOURNEY_CONFIGS[demoStep]
  const isLast = demoStep >= DEMO_SCENARIOS.length - 1
  const cc = CURRENCY_CONFIG[currency] ?? CURRENCY_CONFIG[currency.toLowerCase() as Currency] ?? CURRENCY_CONFIG["inr"]
  const fmt = (inr: number) => `${cc.symbol}${(inr * cc.rate).toFixed(2)}`

  // Next journey config
  const nextStep = jConfig?.next ?? 0
  const nextConfig = JOURNEY_CONFIGS[nextStep]

  if (!scenario || !jConfig) return null

  const durStr = `${Math.floor(callDuration / 60)}:${String(callDuration % 60).padStart(2, '0')}`

  return (
    <>
      <div className="mt-3" style={{ animation: 'fadeSlideIn 0.6s ease-out' }}>
        {/* ═══ SUMMARY LINER ═══ */}
        <div className="flex items-center justify-between gap-2 px-4 py-2.5 rounded-[10px] mb-4 flex-wrap"
          style={{ background: 'rgba(0,201,177,.04)', border: '1px solid rgba(0,201,177,.1)' }}>
          <div className="flex items-center gap-2 text-[12px]" style={{ color: 'var(--text, #a8c0e0)' }}>
            ✅ Call complete · <strong style={{ color: '#00c9b1' }}>{durStr}</strong> ·{' '}
            <strong style={{ color: '#00c9b1' }}>{intents.length} intent{intents.length !== 1 ? 's' : ''}</strong> ·{' '}
            <strong className="font-mono" style={{ color: '#00c9b1' }}>{fmt(totalCost)}</strong>
          </div>
          <div className="flex gap-1.5">
            <button onClick={() => { if (sessionDisplayId) window.location.href = `/dashboard/session/${sessionDisplayId}` }} className="text-[9px] font-semibold px-2.5 py-1 rounded border transition-all hover:bg-white/5"
              style={{ color: '#00c9b1', borderColor: 'rgba(0,201,177,.2)', background: 'transparent' }}>📊 Dashboard</button>
            <button onClick={() => onSignUp?.()} className="text-[9px] font-semibold px-2.5 py-1 rounded border transition-all hover:bg-white/5"
              style={{ color: '#00c9b1', borderColor: 'rgba(0,201,177,.2)', background: 'transparent' }}>📱 Migrate Your IVR</button>
          </div>
        </div>

        {/* ═══ INDUSTRY CHIPS ═══ */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-4">
          {CHIP_DATA.map(([key, label], i) => {
            const ivrKey = `global_${key}`
            const isActive = selectedIvr ? selectedIvr === ivrKey : i === 0
            return (
            <div key={key} onClick={() => {
                onSelectIndustry?.(ivrKey)
                onStartCall()
              }}
              className={`py-2.5 px-2 rounded-[10px] border text-center cursor-pointer transition-all hover:-translate-y-0.5 ${isActive ? 'border-[#00c9b1]' : ''}`}
              style={{
                background: isActive ? 'rgba(0,201,177,.1)' : 'var(--card, #0f1824)',
                borderColor: isActive ? '#00c9b1' : 'var(--b1)',
              }}>
              <div className="text-[20px] mb-1">{label.split(' ')[0]}</div>
              <div className="text-[10px] font-semibold">{label.split(' ').slice(1).join(' ')}</div>
            </div>
            )
          })}
        </div>

        {/* ═══ 3 BOXES ═══ */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">

          {/* BOX 1: See Your AI Bill */}
          <div onClick={() => setPanelOpen(true)}
            className="rounded-[14px] border cursor-pointer transition-all hover:-translate-y-1 hover:shadow-xl overflow-hidden"
            style={{ borderColor: 'rgba(0,201,177,.2)', background: 'var(--card, #0f1824)' }}>
            <div className="p-5 flex flex-col h-full">
              <span className="inline-block w-fit px-2.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wide mb-2"
                style={{ background: 'rgba(0,201,177,.1)', color: '#00c9b1' }}>📋 Your Bill</span>
              <div className="text-[28px] mb-2.5">📋</div>
              <h3 className="text-[15px] font-bold mb-1.5">See Your AI Bill</h3>

              {/* Billing preview */}
              <div className="border rounded-[7px] px-2.5 py-2 my-2" style={{ borderColor: 'var(--b1)', background: 'var(--card2, #121e2d)' }}>
                {[
                  { n: '⚡ Per-Intent', tested: intents.length > 0, val: `${intents.length} · ${fmt(totalCost)}` },
                  { n: '🔥 Escalation', tested: false, val: '0 · ₹0.00' },
                  { n: '💰 Sales', tested: false, val: '0 · ₹0.00' },
                  { n: '💎 Commission', tested: false, val: '0 · ₹0.00' },
                ].map((row, i) => (
                  <div key={i} className="flex justify-between py-0.5 text-[9px]">
                    <span style={{ color: row.tested ? 'var(--text)' : 'var(--dim)' }}>{row.n}</span>
                    <span className="font-mono font-semibold" style={{ color: row.tested ? '#00c9b1' : 'var(--dim)' }}>{row.val}</span>
                  </div>
                ))}
                <div className="flex justify-between pt-1.5 mt-1 text-[10px] font-bold" style={{ borderTop: '1.5px solid var(--b1)', color: '#00c9b1' }}>
                  <span>Total</span>
                  <span className="font-mono">{fmt(totalCost)}</span>
                </div>
              </div>

              <div className="mt-auto pt-2">
                <div className="w-full py-2.5 rounded-[9px] text-center text-[12px] font-bold cursor-pointer"
                  style={{ background: '#00c9b1', color: '#000' }}>
                  View Full Bill →
                </div>
              </div>
            </div>
          </div>

          {/* BOX 2: Try Next Journey */}
          {!isLast && nextConfig ? (
            <div onClick={onTryNext}
              className="rounded-[14px] border cursor-pointer transition-all hover:-translate-y-1 hover:shadow-xl overflow-hidden"
              style={{ borderColor: 'rgba(245,166,35,.2)', background: 'var(--card, #0f1824)' }}>
              <div className="p-5 flex flex-col h-full">
                <span className="inline-block w-fit px-2.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wide mb-2"
                  style={{ background: 'rgba(245,166,35,.12)', color: '#f5a623' }}>⏭ Next Journey</span>
                <div className="text-[28px] mb-2.5">{nextConfig.icon}</div>
                <h3 className="text-[15px] font-bold mb-1.5">{nextConfig.name}</h3>
                <div className="text-[11px] leading-relaxed" style={{ color: 'var(--text)' }}>
                  Try the next industry-first. {nextConfig.name} — live call, real AI.
                </div>
                <div className="mt-auto pt-2">
                  <div className="w-full py-3 rounded-[9px] text-center text-[13px] font-bold cursor-pointer"
                    style={{ background: '#f5a623', color: '#000' }}>
                    {nextConfig.icon} Try {nextConfig.name} →
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-[14px] border overflow-hidden"
              style={{ borderColor: 'rgba(245,166,35,.2)', background: 'var(--card, #0f1824)' }}>
              <div className="p-5 flex flex-col h-full">
                <span className="inline-block w-fit px-2.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wide mb-2"
                  style={{ background: 'rgba(245,166,35,.12)', color: '#f5a623' }}>🎉 All Done</span>
                <div className="text-[28px] mb-2.5">🎉</div>
                <h3 className="text-[15px] font-bold mb-1.5">All Journeys Complete</h3>
                <div className="text-[11px] leading-relaxed" style={{ color: 'var(--text)' }}>
                  You&apos;ve experienced all 4 industry firsts. Now try with YOUR IVR.
                </div>
              </div>
            </div>
          )}

          {/* BOX 3: Give Us Your IVR Number */}
          <div className="rounded-[14px] border overflow-hidden"
            style={{ borderColor: 'rgba(139,92,246,.2)', background: 'var(--card, #0f1824)' }}>
            <div className="p-5 flex flex-col h-full">
              <span className="inline-block w-fit px-2.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wide mb-2"
                style={{ background: 'rgba(139,92,246,.1)', color: '#8b5cf6' }}>📱 Migrate IVR</span>
              <div className="text-[28px] mb-2.5">📱</div>
              <h3 className="text-[15px] font-bold mb-1.5">Migrate Your IVR</h3>
              <div className="text-[11px] leading-relaxed mb-3" style={{ color: 'var(--text)' }}>
                AI connects in 17 min. Free. No code.
              </div>
              <div className="mt-auto">
                <input type="tel" placeholder="Enter your IVR number"
                  className="w-full px-3 py-3 rounded-lg border text-[13px] outline-none mb-1.5"
                  style={{ borderColor: 'var(--b2)', background: 'var(--card2, #121e2d)', color: 'var(--bright)', fontFamily: 'inherit' }}
                  onClick={e => e.stopPropagation()} />
                <button onClick={() => onSignUp?.()}
                  className="w-full py-3 rounded-lg border-none text-[12px] font-bold cursor-pointer"
                  style={{ background: '#8b5cf6', color: '#fff' }}>
                  📱 Migrate Your IVR →
                </button>
                <div className="text-[9px] text-center mt-1.5" style={{ color: 'var(--dim)' }}>
                  Zero integration · Zero cost · In 17 minutes
                </div>
                <div className="flex items-center justify-center gap-2 mt-1.5 text-[10px]" style={{ color: 'var(--dim)' }}>
                  <button onClick={() => onSignUp?.()} className="font-semibold cursor-pointer border-none bg-transparent" style={{ color: '#8b5cf6', fontSize: '10px' }}>📅 Book a Call</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ═══ SIGN UP STRIP ═══ */}
        <div className="flex flex-col items-center gap-1 px-4 py-2.5 rounded-lg mb-2"
          style={{ background: 'linear-gradient(135deg, rgba(0,201,177,.05), rgba(139,92,246,.03))', border: '1px solid rgba(0,201,177,.08)' }}>
          <div className="flex items-center gap-3">
            <span className="text-[10px]" style={{ color: 'var(--text)' }}>Ready to migrate?</span>
            <button onClick={() => onSignUp?.()}
              className="px-4 py-1.5 rounded-md border-none text-[10px] font-bold cursor-pointer"
              style={{ background: '#00c9b1', color: '#000' }}>
              📱 Migrate Your IVR
            </button>
          </div>
          <div className="text-[9px]" style={{ color: 'var(--dim)' }}>Zero integration · Zero cost · In 17 minutes</div>
        </div>
      </div>

      {/* ═══ BILLING SLIDE PANEL ═══ */}
      {panelOpen && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-[99] transition-opacity duration-300"
            style={{ background: 'rgba(0,0,0,.5)' }}
            onClick={() => setPanelOpen(false)} />

          {/* Panel */}
          <div className="fixed top-0 right-0 h-screen z-[100] overflow-y-auto shadow-2xl"
            style={{
              width: 440, maxWidth: '90vw',
              background: 'var(--s1, #0d1526)',
              borderLeft: '1px solid var(--b1)',
              animation: 'slideInRight .35s cubic-bezier(.4,0,.2,1)',
            }}>
            <style>{`@keyframes slideInRight { from { transform: translateX(100%); } to { transform: translateX(0); } }`}</style>

            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b sticky top-0 z-[1]"
              style={{ borderColor: 'var(--b1)', background: 'var(--s1, #0d1526)' }}>
              <h3 className="text-[14px] font-bold">📋 AI Billing Statement</h3>
              <button onClick={() => setPanelOpen(false)}
                className="w-7 h-7 rounded-md border flex items-center justify-center text-[14px] cursor-pointer hover:bg-red-500 hover:text-white transition-colors"
                style={{ borderColor: 'var(--b1)', background: 'var(--card2)', color: 'var(--text)' }}>
                ✕
              </button>
            </div>

            {/* Body */}
            <div className="p-4">
              <div className="text-[9px] mb-2.5" style={{ color: 'var(--dim)' }}>
                {jConfig.name} · {jConfig.exp} · {callDuration}s
              </div>

              {/* LLM Stack */}
              <div className="text-[8px] font-bold uppercase tracking-wide py-2" style={{ color: '#00c9b1' }}>Multi-Modal LLM Stack</div>
              <div className="flex gap-1.5 flex-wrap mb-2.5">
                {jConfig.stack.map(s => (
                  <span key={s} className="px-2 py-0.5 rounded text-[9px] font-semibold border"
                    style={{ background: 'rgba(0,201,177,.08)', color: '#00c9b1', borderColor: 'var(--b1)' }}>{s}</span>
                ))}
              </div>

              {/* Billing by Journey */}
              <div className="text-[8px] font-bold uppercase tracking-wide py-2" style={{ color: '#00c9b1' }}>Billing by Journey</div>
              <table className="w-full" style={{ borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    {['Journey', 'Status', 'Int', 'Amount'].map(h => (
                      <th key={h} className="text-left text-[7px] font-semibold uppercase tracking-wide py-1.5"
                        style={{ color: 'var(--dim)', borderBottom: '1px solid var(--b1)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    { n: '⚡ Per-Intent', j: 0 },
                    { n: '🎯 Value Routing', j: 1 },
                    { n: '🔥 Escalation', j: 2 },
                    { n: '💰 Sales', j: 3 },
                  ].map(row => {
                    const isCurrent = row.j === demoStep
                    return (
                      <tr key={row.j}
                        onClick={() => { if (!isCurrent) { setPanelOpen(false); onNavigateJourney(row.j) } }}
                        style={{ color: isCurrent ? '#00c9b1' : 'var(--dim)', cursor: isCurrent ? 'default' : 'pointer' }}>
                        <td className="py-1.5 text-[11px]" style={{ borderBottom: '1px solid rgba(28,45,69,.3)' }}>{row.n}</td>
                        <td className="py-1.5 text-[8px]" style={{ borderBottom: '1px solid rgba(28,45,69,.3)' }}>{isCurrent ? '✅ Tested' : <span className="text-[#00c9b1] font-semibold">— Try →</span>}</td>
                        <td className="py-1.5 text-[11px]" style={{ borderBottom: '1px solid rgba(28,45,69,.3)' }}>{isCurrent ? intents.length : 0}</td>
                        <td className="py-1.5 text-[11px] font-bold" style={{ borderBottom: '1px solid rgba(28,45,69,.3)' }}>{isCurrent ? fmt(totalCost) : '₹0.00'}</td>
                      </tr>
                    )
                  })}
                  <tr className="font-bold" style={{ color: 'var(--bright)' }}>
                    <td className="py-1.5" style={{ borderTop: '2px solid var(--b2)' }} colSpan={2}>Total</td>
                    <td className="py-1.5" style={{ borderTop: '2px solid var(--b2)' }}>{intents.length}</td>
                    <td className="py-1.5" style={{ borderTop: '2px solid var(--b2)' }}>{fmt(totalCost)}</td>
                  </tr>
                </tbody>
              </table>

              {/* Resolution */}
              <div className="text-[8px] font-bold uppercase tracking-wide py-2 mt-2" style={{ color: '#00c9b1' }}>Resolution</div>
              <div className="flex justify-between py-1 text-[11px]" style={{ color: '#00de7a' }}>
                <span>Resolved ✅</span><span className="font-mono">{intents.length} = {fmt(totalCost)}</span>
              </div>
              <div className="flex justify-between py-1 text-[11px]" style={{ color: '#f03060' }}>
                <span>Not Resolved ❌</span><span className="font-mono">0 = -₹0.00</span>
              </div>
              <div className="flex justify-between py-1.5 text-[11px] font-bold mt-1" style={{ borderTop: '1px solid var(--b1)', color: 'var(--bright)' }}>
                <span>Net Billable</span><span className="font-mono">{fmt(totalCost)}</span>
              </div>

              {/* Sales (Coming Soon) */}
              <div className="text-[8px] font-bold uppercase tracking-wide py-2 mt-2" style={{ color: '#00c9b1' }}>
                Sales <span className="px-1.5 py-px rounded text-[6px]" style={{ background: 'var(--card2)', color: 'var(--dim)' }}>Coming Soon</span>
              </div>
              <div className="flex justify-between py-1 text-[11px] opacity-40" style={{ color: 'var(--dim)' }}>
                <span>Sales Intents</span><span className="font-mono">₹0.00</span>
              </div>
              <div className="flex justify-between py-1 text-[11px] opacity-40" style={{ color: 'var(--dim)' }}>
                <span>Commission</span><span className="font-mono">₹0.00</span>
              </div>

              {/* Grand Total */}
              <div className="flex justify-between py-3 text-[16px] font-bold mt-1.5"
                style={{ borderTop: '3px solid #00c9b1', color: '#00c9b1' }}>
                <span>TOTAL</span><span className="font-mono">{fmt(totalCost)}</span>
              </div>

              <div className="text-[8px] mt-2 pt-1.5" style={{ color: 'var(--dim)', borderTop: '1px dashed var(--b1)' }}>
                Demo · Shared infra · No charge
              </div>

              {/* Action buttons */}
              <div className="flex gap-1.5 mt-2.5">
                <button onClick={() => alert('Download')} className="flex-1 py-2 rounded-md border text-[9px] font-semibold cursor-pointer"
                  style={{ borderColor: 'var(--b1)', background: 'var(--card2)', color: 'var(--text)' }}>📄 Download</button>
                <button onClick={() => alert('Email')} className="flex-1 py-2 rounded-md border text-[9px] font-semibold cursor-pointer"
                  style={{ borderColor: 'var(--b1)', background: 'var(--card2)', color: 'var(--text)' }}>📧 Email</button>
                <button onClick={() => { if (sessionDisplayId) window.location.href = `/dashboard/session/${sessionDisplayId}` }} className="flex-1 py-2 rounded-md border-none text-[9px] font-semibold cursor-pointer"
                  style={{ background: '#00c9b1', color: '#000' }}>📊 Dashboard</button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  )
}

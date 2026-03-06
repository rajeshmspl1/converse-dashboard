'use client'
import { useRef, useEffect } from 'react'
import type { LiveCallState, TxLine, LiveIntent } from '@/hooks/useLiveKitCall'
import IvrDialpad from './IvrDialpad'
import EngageBanner from '@/components/demo/EngageBanner'
import AskSteps from '@/components/demo/AskSteps'

interface Props {
  state: LiveCallState
  onDTMF: (digit: string) => void
  liveTranscript: TxLine[]
  liveIntents: LiveIntent[]
  liveCost: number
  currentExp: number | null
  crmName: string | null
  // demo context
  callActive: boolean
  callEnded: boolean
  scenarioSteps: string[]
}

export default function LiveCallPanel({
  state,
  onDTMF,
  liveTranscript,
  liveIntents,
  callActive,
  callEnded,
  scenarioSteps,
}: Props) {
  const txRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (txRef.current) txRef.current.scrollTop = txRef.current.scrollHeight
  }, [liveTranscript])

  // ── RIGHT PANEL: always flex-col, 280px wide ──────────────────────────────
  return (
    <div className="flex flex-col h-full overflow-hidden"
      style={{ borderLeft: '1px solid var(--b1)', background: 'var(--card)' }}>

      {/* ── ENGAGE BANNER — always pinned at top ── */}
      <EngageBanner />

      {/* ── PRE-CALL / POST-CALL: simple CTA block ── */}
      {!callActive && (
        <div className="flex-1 flex flex-col justify-center px-4 py-5 gap-3">
          <div className="text-[10px] font-semibold" style={{ color: 'var(--bright)' }}>
            {callEnded ? 'Ready for the next step?' : 'Try with your own IVR'}
          </div>
          <div className="text-[9px] leading-relaxed border-l-2 pl-2.5"
            style={{ borderColor: 'var(--b2)', color: 'var(--dim)' }}>
            {callEnded
              ? 'Import your live IVR number — we connect AI to it in 30 minutes. Free.'
              : 'Give us your IVR number — we connect AI to it in 30 minutes. Free, zero integration needed.'}
          </div>
          <button
            onClick={() => alert('Coming soon — IVR import')}
            className="w-full py-2.5 px-3 rounded-lg text-[11px] font-bold text-left transition-opacity hover:opacity-85"
            style={{ background: '#18c48a', color: '#050e1a' }}>
            📱 Give us your IVR number
          </button>
          <button
            onClick={() => alert('Opening calendar...')}
            className="w-full py-2.5 px-3 rounded-lg text-[11px] font-semibold text-left border transition-all hover:opacity-80"
            style={{ borderColor: 'var(--b2)', color: 'var(--text)', background: 'transparent' }}>
            📅 Contact Sales →
          </button>
          <div className="text-[8px] text-center" style={{ color: 'var(--dim)' }}>
            Free · Zero integration · 30 min setup
          </div>
        </div>
      )}

      {/* ── DURING CALL ── */}
      {callActive && (
        <div className="flex flex-col flex-1 overflow-hidden min-h-0">

          {/* Dialpad — visible when Service A sends ivr_mode signal */}
          {state.mode === 'ivr' && (
            <div className="px-3 pt-2 pb-1 flex-shrink-0 border-b" style={{ borderColor: 'var(--b1)' }}>
              <div className="text-[7.5px] font-bold uppercase tracking-widest mb-1.5" style={{ color: 'var(--dim)' }}>
                📟 IVR Dial Pad
              </div>
              <IvrDialpad
                visible={true}
                onPress={onDTMF}
                lastDigit={state.lastDigit}
                trigger="data_channel_signal"
              />
            </div>
          )}

          {/* Ask steps — driven by real intent count */}
          <AskSteps steps={scenarioSteps} completedCount={liveIntents.length} />

          {/* Live transcript */}
          <div ref={txRef} className="flex-1 overflow-y-auto px-2 py-2 flex flex-col gap-1.5">
            {liveTranscript.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-[9px] text-center" style={{ color: 'var(--dim)' }}>
                  Waiting for the call to start…
                </div>
              </div>
            ) : (
              liveTranscript.map((tx, i) => (
                <div key={i} className="flex gap-1.5 items-start">
                  <div
                    className="text-[7px] font-bold px-1 py-px rounded flex-shrink-0 mt-0.5"
                    style={{
                      background:
                        tx.who === 'user'
                          ? 'rgba(51,112,232,.15)'
                          : tx.who === 'ai'
                          ? 'rgba(24,196,138,.12)'
                          : 'rgba(255,255,255,.05)',
                      color:
                        tx.who === 'user'
                          ? '#80aaf4'
                          : tx.who === 'ai'
                          ? 'var(--green)'
                          : 'var(--dim)',
                    }}>
                    {tx.who === 'user' ? 'YOU' : tx.who === 'ai' ? 'AI' : '···'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] leading-snug" style={{ color: 'var(--text)' }}>
                      {tx.text}
                    </div>
                    {tx.meta && (
                      <div className="text-[8px] mt-0.5 font-mono" style={{ color: 'var(--amber)' }}>
                        {tx.meta}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Connection status strip */}
          <div className="px-3 py-1.5 border-t flex items-center gap-1.5 flex-shrink-0"
            style={{ borderColor: 'var(--b1)', background: 'rgba(0,0,0,.12)' }}>
            <div
              className="w-1.5 h-1.5 rounded-full flex-shrink-0"
              style={{
                background:
                  state.status === 'connected'
                    ? '#22c55e'
                    : state.status === 'connecting'
                    ? '#3b82f6'
                    : '#6b7280',
                animation: state.status === 'connected' ? 'pulse 2s infinite' : 'none',
              }}
            />
            <span className="text-[8px]" style={{ color: 'var(--dim)' }}>
              {state.status === 'connected'
                ? state.micEnabled
                  ? 'Mic active — AI is listening'
                  : 'Connected — mic off'
                : state.status === 'connecting'
                ? 'Connecting…'
                : 'Idle'}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

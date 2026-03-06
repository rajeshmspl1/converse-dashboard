'use client'
import { useStore } from '@/lib/store'
import { MODE_COLOR, MODE_LABELS } from '@/lib/data'
import type { RoutingMode } from '@/types'

const MODES: RoutingMode[] = ['premium', 'complexity', 'sales', 'hybrid']

export default function FocusStage({ onStart }: { onStart: () => void }) {
  const mode    = useStore(s => s.mode)
  const setMode = useStore(s => s.setMode)
  const mc      = MODE_COLOR[mode]

  return (
    <div className="flex flex-col items-center justify-center flex-1 gap-6 px-6 py-10 text-center">
      <h1 className="font-extrabold text-[20px] leading-tight tracking-tight"
        style={{ color: 'var(--bright)', animation: 'fadeUp .5s ease .1s both' }}>
        Start a call.<br />
        <span style={{ color: 'var(--green)' }}>See AI route it.</span>
      </h1>

      <p className="text-[11px] max-w-sm leading-relaxed" style={{ color: 'var(--dim)', animation: 'fadeUp .5s ease .2s both' }}>
        Pick a routing mode — then hit Start Call. The interface reveals itself as the call unfolds.
      </p>

      {/* Mode buttons */}
      <div className="flex flex-wrap gap-2 justify-center" style={{ animation: 'fadeUp .5s ease .35s both' }}>
        {MODES.map(m => {
          const c = MODE_COLOR[m]
          const active = mode === m
          return (
            <button key={m} onClick={() => setMode(m)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg border-[1.5px] font-semibold text-[11px] transition-all duration-200"
              style={{
                borderColor: c.border, color: c.text,
                background: active ? c.bg : 'transparent',
                boxShadow: active ? `0 0 18px ${c.bg}` : 'none',
                transform: active ? 'translateY(-2px)' : 'none',
              }}>
              <span>{MODE_LABELS[m].icon}</span>
              <span>{MODE_LABELS[m].label}</span>
              <span className="text-[9px] opacity-60 font-normal">{MODE_LABELS[m].sub}</span>
            </button>
          )
        })}
      </div>

      {/* Start CTA */}
      <div className="flex flex-col items-center gap-2" style={{ animation: 'fadeUp .5s ease .5s both' }}>
        <button onClick={onStart}
          className="flex items-center gap-2 px-9 py-3.5 rounded-xl font-extrabold text-[13px] tracking-tight transition-all duration-300 hover:opacity-85 hover:scale-[1.03] active:scale-[.98]"
          style={{ background: mc.start, color: mc.startText }}>
          📞 Start Call
        </button>
        <p className="text-[9px]" style={{ color: 'var(--dim)' }}>Click to begin — the UI reveals itself as you call</p>
      </div>
    </div>
  )
}

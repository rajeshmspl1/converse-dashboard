'use client'
import type { CallMode, LiveCallStatus } from '@/hooks/useLiveKitCall'

interface Props {
  mode: CallMode
  status: LiveCallStatus
}

export default function ModeIndicator({ mode, status }: Props) {
  const isIvr = mode === 'ivr'
  const isConnected = status === 'connected'

  return (
    <div
      className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl border-2 transition-all duration-500"
      style={{
        background: isIvr ? '#0a1a0f' : 'var(--card)',
        borderColor: isIvr ? '#22c55e' : 'var(--b1)',
        boxShadow: isIvr ? '0 0 20px rgba(34,197,94,0.15)' : 'none',
      }}
    >
      {/* Mode dot */}
      <div
        className="w-3.5 h-3.5 rounded-full flex-shrink-0 transition-all duration-500"
        style={{
          background: isIvr ? '#22c55e' : isConnected ? '#ef4444' : '#6b7280',
          animation: isIvr ? 'modePulseGreen 1.5s infinite' : isConnected ? 'modePulseRed 2s infinite' : 'none',
        }}
      />

      {/* Text */}
      <div className="flex-1 min-w-0">
        <div
          className="text-[13px] font-bold transition-colors duration-500"
          style={{ color: isIvr ? '#22c55e' : isConnected ? '#ef4444' : 'var(--dim)' }}
        >
          {isIvr
            ? 'IVR Mode — Dial Pad Active'
            : isConnected
            ? 'AI Mode — Voice Agent Active'
            : 'Not Connected'}
        </div>
        <div className="text-[10px] font-mono mt-0.5" style={{ color: 'var(--dim)' }}>
          {isIvr
            ? 'AI transferred to IVR. Navigate with keypad.'
            : isConnected
            ? 'Speak naturally. AI handles your request.'
            : 'Connect to start a live call'}
        </div>
      </div>

      {/* Badge */}
      <div
        className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider flex-shrink-0 transition-all duration-500"
        style={{
          background: isIvr ? '#0a1a0f' : isConnected ? '#1c1517' : 'var(--card2)',
          color: isIvr ? '#22c55e' : isConnected ? '#ef4444' : 'var(--dim)',
          border: `1px solid ${isIvr ? '#22c55e33' : isConnected ? '#ef444433' : 'var(--b1)'}`,
        }}
      >
        {isIvr ? 'IVR' : isConnected ? 'AI' : 'OFF'}
      </div>

    </div>
  )
}

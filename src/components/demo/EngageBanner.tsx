'use client'

interface Props {
  compact?: boolean
}

export default function EngageBanner({ compact }: Props) {
  const handleIVR = () => alert('Coming soon — give us your IVR number and we will connect in 30 minutes')
  const handleSales = () => alert('Opening calendar — book a call with us')

  if (compact) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 border-b flex-shrink-0"
        style={{ borderColor: 'var(--b1)', background: 'linear-gradient(90deg, rgba(24,196,138,.06), rgba(51,112,232,.04))' }}>
        <span className="text-[9px] font-semibold flex-1" style={{ color: 'var(--dim)' }}>
          📞 Talk to us anytime
        </span>
        <button
          onClick={handleIVR}
          className="text-[8px] font-bold px-2 py-1 rounded transition-opacity hover:opacity-80"
          style={{ background: 'var(--green)', color: '#050e1a' }}>
          Give us your IVR #
        </button>
        <button
          onClick={handleSales}
          className="text-[8px] font-bold px-2 py-1 rounded border transition-all hover:opacity-80"
          style={{ borderColor: 'var(--b2)', color: 'var(--text)', background: 'transparent' }}>
          Contact Sales
        </button>
      </div>
    )
  }

  return (
    <div className="px-4 py-3 border-b flex-shrink-0"
      style={{
        borderColor: 'var(--b1)',
        background: 'linear-gradient(135deg, rgba(24,196,138,.07), rgba(51,112,232,.04))',
      }}>
      <div className="text-[11px] font-extrabold mb-0.5" style={{ color: 'var(--bright)' }}>
        📞 Talk to us — anytime
      </div>
      <div className="text-[9px] mb-2.5 leading-snug" style={{ color: 'var(--dim)' }}>
        Import your IVR · Get a live demo · Ask anything
      </div>
      <div className="flex flex-col gap-2">
        <button
          onClick={handleIVR}
          className="w-full py-2 px-3 rounded-lg text-[11px] font-bold text-left transition-opacity hover:opacity-85"
          style={{ background: '#18c48a', color: '#050e1a' }}>
          📱 Give us your IVR number
        </button>
        <button
          onClick={handleSales}
          className="w-full py-2 px-3 rounded-lg text-[11px] font-semibold text-left border transition-all hover:opacity-80"
          style={{ borderColor: 'var(--b2)', color: 'var(--text)', background: 'transparent' }}>
          📅 Contact Sales →
        </button>
      </div>
      <div className="text-[8px] mt-1.5 text-center" style={{ color: 'var(--dim)' }}>
        Free · Zero integration · 30 min setup
      </div>
    </div>
  )
}

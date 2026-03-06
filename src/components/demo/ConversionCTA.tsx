'use client'
import { useState, useEffect } from 'react'
import { ROTATING_CTAS } from '@/lib/data'

export default function ConversionCTA() {
  const [idx, setIdx] = useState(0)
  const [fade, setFade] = useState(true)

  useEffect(() => {
    const iv = setInterval(() => {
      setFade(false)
      setTimeout(() => {
        setIdx(i => (i + 1) % ROTATING_CTAS.length)
        setFade(true)
      }, 400)
    }, 6000)
    return () => clearInterval(iv)
  }, [])

  const handleDummy = (label: string) => {
    alert(`Coming soon — "${label}" will be available in your next update!`)
  }

  return (
    <div className="rounded-xl border p-4 md:p-6 mt-3" style={{
      borderColor: 'rgba(34,197,94,.3)',
      background: 'linear-gradient(135deg, rgba(34,197,94,.04), rgba(99,102,241,.04), rgba(245,158,11,.04))',
      animation: 'fadeSlideIn 0.8s ease-out',
    }}>
      <div className="flex items-center justify-center gap-2 mb-4">
        <span className="text-[20px] md:text-[24px]">🎉</span>
        <div className="text-[10px] md:text-[12px] font-bold uppercase tracking-[.3em]" style={{ color: '#22c55e' }}>
          6 Industry Firsts Completed
        </div>
        <span className="text-[20px] md:text-[24px]">🎉</span>
      </div>

      <div className="text-center mb-4" style={{ minHeight: '50px' }}>
        <div className="text-[14px] md:text-[18px] leading-relaxed font-semibold transition-opacity duration-400"
          style={{ color: 'var(--bright)', opacity: fade ? 1 : 0 }}>
          {ROTATING_CTAS[idx].message}
        </div>
      </div>

      <button onClick={() => handleDummy('Import My IVR')}
        className="w-full py-3 md:py-4 rounded-xl font-extrabold text-[14px] md:text-[18px] transition-all hover:opacity-90 hover:scale-[1.005] mb-4"
        style={{
          background: 'linear-gradient(135deg, #22c55e, #06b6d4)',
          color: '#fff',
          boxShadow: '0 6px 30px rgba(34,197,94,.3)',
        }}>
        Import My IVR — Free →
      </button>

      <div className="flex flex-col md:flex-row gap-2 md:gap-3 mb-4">
        {[
          { icon: '📞', label: 'Enter my IVR phone number' },
          { icon: '📄', label: 'Upload VoiceXML / IVR document' },
          { icon: '🗓', label: 'Schedule a call with us' },
        ].map(opt => (
          <button key={opt.label}
            onClick={() => handleDummy(opt.label)}
            className="flex-1 py-2.5 md:py-3 px-3 rounded-lg border text-[10px] md:text-[11px] font-semibold flex items-center md:flex-col gap-2 md:gap-1.5 transition-all hover:opacity-80"
            style={{ borderColor: 'var(--b2)', background: 'rgba(255,255,255,.03)', color: 'var(--text)' }}
            title="Coming soon">
            <span className="text-[14px] md:text-[16px]">{opt.icon}</span>
            <span>{opt.label}</span>
          </button>
        ))}
      </div>

      <div className="flex items-center justify-center gap-2 md:gap-3 flex-wrap">
        {[
          { text: 'FREE', highlight: true },
          { text: 'Zero migration cost' },
          { text: 'Zero integration' },
          { text: 'Zero tech team' },
          { text: 'Under 30 minutes' },
        ].map(b => (
          <span key={b.text} className="text-[8px] md:text-[9px] font-bold px-2 py-0.5 rounded"
            style={b.highlight
              ? { background: '#f59e0b', color: '#080d18' }
              : { background: 'rgba(255,255,255,.06)', color: 'var(--dim)' }
            }>{b.text}</span>
        ))}
      </div>
    </div>
  )
}

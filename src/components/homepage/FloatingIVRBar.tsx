'use client'
import { useState } from 'react'

interface Props {
  visible: boolean
  onClose: () => void
}

export default function FloatingIVRBar({ visible, onClose }: Props) {
  const [ivrNumber, setIvrNumber] = useState('')

  if (!visible) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[45] px-5 py-2.5 flex items-center justify-center gap-2.5 flex-wrap"
      style={{
        background: 'rgba(13,21,38,.96)',
        backdropFilter: 'blur(12px)',
        borderTop: '1px solid var(--b1)',
        animation: 'slideUp .3s ease',
      }}>
      <style>{`@keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }`}</style>

      <span className="text-[11px]" style={{ color: 'var(--tx2, #7a90b5)' }}>📱 Connect your IVR:</span>
      <input
        type="tel"
        placeholder="Enter your IVR number"
        value={ivrNumber}
        onChange={e => setIvrNumber(e.target.value)}
        className="px-3.5 py-2.5 rounded-[7px] border text-[13px] outline-none w-[280px]"
        style={{
          borderColor: 'var(--b2, #243558)',
          background: 'var(--s2, #111d30)',
          color: 'var(--tx, #dde6f5)',
          fontFamily: 'inherit',
        }}
      />
      <button
        onClick={() => alert('Connecting IVR: ' + ivrNumber)}
        className="px-5 py-2.5 rounded-[7px] border-none text-[12px] font-bold cursor-pointer"
        style={{ background: '#8b5cf6', color: '#fff' }}>
        Connect →
      </button>
      <span className="text-[10px]" style={{ color: 'var(--tx3)' }}>or</span>
      <button
        onClick={() => alert('Contact Sales')}
        className="px-4 py-2.5 rounded-[7px] border text-[10px] font-semibold cursor-pointer"
        style={{ background: 'transparent', borderColor: 'var(--b1)', color: 'var(--tx2)' }}>
        📅 Sales
      </button>
      <button onClick={onClose}
        className="px-2.5 py-1.5 rounded text-[11px] cursor-pointer border"
        style={{ background: 'transparent', borderColor: 'var(--b1)', color: 'var(--tx3)' }}>
        ✕
      </button>
    </div>
  )
}

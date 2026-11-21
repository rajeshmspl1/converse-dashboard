'use client'
import { T, tint } from '@/lib/theme'

const KEYS = [
  { digit: '1', sub: '' },
  { digit: '2', sub: 'ABC' },
  { digit: '3', sub: 'DEF' },
  { digit: '4', sub: 'GHI' },
  { digit: '5', sub: 'JKL' },
  { digit: '6', sub: 'MNO' },
  { digit: '7', sub: 'PQRS' },
  { digit: '8', sub: 'TUV' },
  { digit: '9', sub: 'WXYZ' },
  { digit: '*', sub: '' },
  { digit: '0', sub: '+' },
  { digit: '#', sub: '' },
]

interface Props {
  visible: boolean
  onPress: (digit: string) => void
  lastDigit: string | null
  trigger?: string
}

export default function IvrDialpad({ visible, onPress, lastDigit, trigger }: Props) {
  return (
    <div
      className="overflow-hidden transition-all duration-500"
      style={{
        maxHeight: visible ? '420px' : '0',
        opacity: visible ? 1 : 0,
        pointerEvents: visible ? 'auto' : 'none',
      }}
    >
      <div
        className="rounded-xl border-2 p-4 mt-2"
        style={{
          background: T.padBg,
          borderColor: T.ok,
          boxShadow: `0 0 24px ${tint('ok', '.1')}`,
        }}
      >
        {/* Header */}
        <div className="text-center mb-3">
          <div className="text-[12px] font-bold uppercase tracking-widest" style={{ color: T.ok }}>
            IVR Navigation Active
          </div>
          <div className="text-[10px] mt-0.5" style={{ color: 'var(--dim)' }}>
            Press digits to navigate the bank menu
          </div>
          {trigger && (
            <div
              className="inline-block mt-1.5 px-2 py-px rounded text-[9px] font-mono"
              style={{ background: T.padKeyHi, color: T.padLit }}
            >
              trigger: {trigger}
            </div>
          )}
        </div>

        {/* Grid */}
        <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
          {KEYS.map(({ digit, sub }) => (
            <button
              key={digit}
              onMouseDown={() => onPress(digit)}
              className="rounded-xl border flex flex-col items-center justify-center py-3 transition-all active:scale-95 select-none cursor-pointer"
              style={{
                background: lastDigit === digit ? T.ok : T.padKey,
                borderColor: lastDigit === digit ? T.ok : T.padEdge,
                color: lastDigit === digit ? T.onColor : T.padText,
                fontSize: '22px',
                fontWeight: 700,
                minHeight: '56px',
              }}
            >
              {digit}
              {sub && (
                <span
                  className="text-[7px] font-normal tracking-widest mt-0.5"
                  style={{ color: lastDigit === digit ? T.padSub : T.padDim }}
                >
                  {sub}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Last digit feedback */}
        <div className="text-center mt-2.5 h-5">
          {lastDigit && (
            <span
              className="font-mono text-[11px] px-2.5 py-0.5 rounded"
              style={{ background: T.padKey, color: T.ok }}
            >
              Sent: {lastDigit}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

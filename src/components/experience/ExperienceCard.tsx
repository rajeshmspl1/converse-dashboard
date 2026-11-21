'use client'
import { useStore } from '@/lib/store'
import { EXP_COLOR, MODE_RATES } from '@/lib/data'
import { formatCost } from '@/lib/utils'
import type { Experience } from '@/types'

interface Props {
  exp: Experience
  visible: boolean
  delay: number
  compact?: boolean
  isActive?: boolean
  isAutoConfigured?: boolean
}

export default function ExperienceCard({ exp, visible, delay, compact, isActive, isAutoConfigured }: Props) {
  const currency = useStore(s => s.currency)
  const baseExp  = useStore(s => s.baseExp)
  const mode     = useStore(s => s.mode)
  const callStatus = useStore(s => s.callStatus)
  const setBaseExp = useStore(s => s.setBaseExp)

  const isActiveResolved = isActive ?? (baseExp === exp.level)
  const color    = EXP_COLOR[exp.level]
  const rate     = MODE_RATES[mode][exp.level]

  // COMPACT PILL MODE
  if (compact) {
    if (exp.comingSoon) {
      return (
        <div className="w-9 h-9 rounded-full border flex items-center justify-center text-[10px] font-bold opacity-30 pointer-events-none"
          style={{ borderColor: 'var(--b2)', color: 'var(--dim)' }}>
          {exp.level}
        </div>
      )
    }

    return (
      <div
        onClick={() => callStatus !== 'active' && setBaseExp(exp.level)}
        className="group relative cursor-pointer transition-all duration-300"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? 'scale(1)' : 'scale(0.8)',
          transition: `opacity .3s ease ${delay}ms, transform .3s ease ${delay}ms`,
        }}
      >
        <div className="w-9 h-9 md:w-10 md:h-10 rounded-full border-2 flex items-center justify-center text-[11px] md:text-[12px] font-bold transition-all duration-300"
          style={{
            borderColor: isActiveResolved ? color : 'var(--b2)',
            background: isActiveResolved ? `${color}22` : 'transparent',
            color: isActiveResolved ? color : 'var(--dim)',
            boxShadow: isActiveResolved ? `0 0 14px ${color}44` : 'none',
          }}>
          {exp.level}
        </div>

        {isActiveResolved && (
          <div className="absolute -right-0.5 -top-0.5 w-2.5 h-2.5 rounded-full border-2 transition-all duration-500"
            style={{ background: color, borderColor: 'var(--bg)' }} />
        )}

        <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 rounded-lg border p-2 whitespace-nowrap z-50 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200"
          style={{ background: 'var(--card)', borderColor: 'var(--b2)', minWidth: '160px' }}>
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="text-[10px] font-bold" style={{ color }}>{exp.name}</span>
            {isAutoConfigured && isActiveResolved && (
              <span className="text-[6px] font-bold px-1 py-px rounded" style={{ background: 'rgba(245,158,11,.15)', color: '#f59e0b' }}>AUTO</span>
            )}
          </div>
          <div className="text-[8px]" style={{ color: 'var(--dim)' }}>{exp.persona}</div>
          <div className="font-mono text-[9px] font-bold mt-0.5" style={{ color }}>{formatCost(rate, currency, 4)}/intent</div>
          {exp.idealFor && (
            <div className="text-[7px] mt-0.5" style={{ color: '#6ee7b7' }}>{exp.idealFor}</div>
          )}
        </div>
      </div>
    )
  }

  // FULL CARD MODE
  if (exp.comingSoon) return (
    <div className="rounded-lg border p-2 opacity-40 pointer-events-none relative"
      style={{ borderColor: 'var(--b1)', background: 'var(--card)' }}>
      <div className="absolute top-1 right-1.5 text-[7px] px-1 py-px rounded" style={{ background: 'rgba(255,255,255,.06)', color: 'var(--dim)' }}>Soon</div>
      <div className="font-bold text-[11px] mb-0.5" style={{ color }}>{exp.badge}</div>
      <div className="font-semibold text-[10px]" style={{ color: 'var(--bright)' }}>{exp.name}</div>
      <div className="font-mono text-[10px] mt-1 font-semibold" style={{ color }}>{formatCost(rate, currency, 4)}/intent</div>
    </div>
  )

  return (
    <div className="rounded-lg border p-2 cursor-pointer relative overflow-hidden transition-all duration-200"
      style={{
        borderColor: isActiveResolved ? color : 'var(--b1)',
        background: isActiveResolved ? 'rgba(255,255,255,.025)' : 'var(--card)',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateX(0)' : 'translateX(-10px)',
        transition: `opacity .4s ease ${delay}ms, transform .4s ease ${delay}ms, border-color .2s`,
      }}
      onClick={() => callStatus !== 'active' && setBaseExp(exp.level)}
    >
      <div className="absolute top-0 left-0 right-0 h-[2px] transition-opacity duration-200"
        style={{ background: color, opacity: isActiveResolved ? 1 : 0 }} />
      <div className="flex items-start justify-between mb-0.5">
        <div className="font-bold text-[11px]" style={{ color }}>{exp.badge}</div>
      </div>
      <div className="font-semibold text-[10px] mb-0.5" style={{ color: 'var(--bright)' }}>{exp.name}</div>
      <div className="text-[9px] leading-snug mb-1" style={{ color: 'var(--dim)' }}>{exp.persona}</div>
      {exp.idealFor && (
        <div className="text-[8px] leading-snug mb-1 px-1.5 py-0.5 rounded" style={{ background: 'rgba(34,197,94,.06)', color: '#6ee7b7' }}>{exp.idealFor}</div>
      )}
      <div className="font-mono text-[10px] font-semibold" style={{ color }}>{formatCost(rate, currency, 4)}/intent</div>
    </div>
  )
}

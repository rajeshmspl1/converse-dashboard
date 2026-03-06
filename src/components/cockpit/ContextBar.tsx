'use client'
import { useStore } from '@/lib/store'
import { JOURNEY_STAGES } from '@/lib/data'
import type { InfraLevel, DeployModel } from '@/types'
import { useEffect, useState } from 'react'

interface Props { journeyVisible: boolean; securityVisible: boolean; deployVisible: boolean }

export default function ContextBar({ journeyVisible, securityVisible, deployVisible }: Props) {
  if (!journeyVisible) return null

  return (
    <div className="flex items-stretch border-b flex-shrink-0"
      style={{ borderColor: 'var(--b1)', background: 'var(--surf)', padding: '8px 20px 18px' }}>
      <JourneyCol />
      {securityVisible && <SecurityCol />}
      {deployVisible && <DeployCol />}
    </div>
  )
}

function JourneyCol() {
  const [visibleDots, setVisibleDots]   = useState<boolean[]>(Array(7).fill(false))
  const [visibleLines, setVisibleLines] = useState<boolean[]>(Array(6).fill(false))
  const [highlighted, setHighlighted]   = useState(false)
  const [subVisible, setSubVisible]     = useState(false)

  useEffect(() => {
    // Demo dot appears first
    setTimeout(() => setVisibleDots(d => { const n=[...d]; n[0]=true; return n }), 100)
    // Line then dot for stages 1-6
    for (let i = 0; i < 6; i++) {
      const lineAt = 380 + i * 500
      const dotAt  = lineAt + 320
      setTimeout(() => setVisibleLines(l => { const n=[...l]; n[i]=true; return n }), lineAt)
      setTimeout(() => setVisibleDots(d => { const n=[...d]; n[i+1]=true; return n }), dotAt)
    }
    // After all dots: highlight Demo dot in purple
    const highlightAt = 380 + 5 * 500 + 320 + 350
    setTimeout(() => setHighlighted(true), highlightAt)
    // Then sub label
    setTimeout(() => setSubVisible(true), highlightAt + 300)
  }, [])

  return (
    <div className="flex-1 pr-4 border-r flex flex-col justify-center" style={{ borderColor: 'var(--b1)' }}>
      <div className="text-[7.5px] font-bold tracking-widest uppercase mb-2" style={{ color: 'var(--dim)' }}>Your Journey</div>
      <div className="flex items-center pb-4">
        {JOURNEY_STAGES.map((s, i) => (
          <div key={s.n} className="flex items-center flex-1 last:flex-none">
            {i > 0 && (
              <div className="h-px" style={{
                flex: 1, background: 'var(--b1)',
                opacity: visibleLines[i-1] ? 1 : 0,
                transform: `scaleX(${visibleLines[i-1] ? 1 : 0})`,
                transformOrigin: 'left',
                transition: 'opacity .3s ease, transform .35s ease',
              }} />
            )}
            <div className="relative flex items-center justify-center w-[22px] h-[22px] rounded-full text-[8px] font-bold flex-shrink-0"
              style={{
                opacity: visibleDots[i] ? 1 : 0,
                transform: visibleDots[i] ? 'scale(1)' : 'scale(0.4)',
                background: highlighted && i === 0 ? 'var(--purple)' : 'var(--card)',
                border: highlighted && i === 0 ? 'none' : '1px solid var(--b1)',
                boxShadow: highlighted && i === 0 ? '0 0 12px rgba(138,78,232,.5)' : 'none',
                color: highlighted && i === 0 ? '#fff' : 'var(--dim)',
                transition: 'opacity .3s ease, transform .3s ease, background .45s ease, box-shadow .45s ease, color .3s ease',
              }}>
              {s.n}
              <div className="absolute whitespace-nowrap text-[7.5px] text-center left-1/2 -translate-x-1/2"
                style={{ top: '26px', color: 'var(--dim)' }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-1.5 text-[8px]"
        style={{ color: 'var(--amber)', opacity: subVisible ? 1 : 0, transform: subVisible ? 'translateY(0)' : 'translateY(4px)', transition: 'opacity .4s ease, transform .4s ease' }}>
        <div className="w-[5px] h-[5px] rounded-full flex-shrink-0" style={{ background: 'var(--amber)' }} />
        Currently at Demo — <strong>Stage 1 (Pre-UAT) is a free upgrade →</strong>
      </div>
    </div>
  )
}

const INFRA_OPTS: { key: InfraLevel; icon: string; name: string; desc: string; tag?: string; free?: boolean }[] = [
  { key: 'shared',  icon: '🔓', name: 'Shared',  desc: 'Shared svc, DB, VM', tag: '● Current' },
  { key: 'secure',  icon: '🔒', name: 'Secure',  desc: 'Dedicated DB',       tag: '✦ Free upgrade', free: true },
  { key: 'premium', icon: '🛡', name: 'Premium', desc: 'Dedicated svc+DB',   tag: '✦ Upgrade',      free: true },
  { key: 'owned',   icon: '🏛', name: 'Owned',   desc: 'Full isolation' },
]

function SecurityCol() {
  const infraLevel = useStore(s => s.infraLevel)
  const setInfra   = useStore(s => s.setInfra)
  const [visible, setVisible]   = useState<boolean[]>(Array(4).fill(false))
  const [activeKey, setActiveKey] = useState<InfraLevel | null>(null)

  useEffect(() => {
    // Cards appear one by one
    INFRA_OPTS.forEach((_, i) => {
      setTimeout(() => setVisible(v => { const n=[...v]; n[i]=true; return n }), 150 + i * 460)
    })
    // After last card: highlight "shared" with green border
    setTimeout(() => setActiveKey('shared'), 150 + 3 * 460 + 380)
  }, [])

  return (
    <div className="flex-1 px-4 border-r flex flex-col justify-center" style={{ borderColor: 'var(--b1)' }}>
      <div className="text-[7.5px] font-bold tracking-widest uppercase mb-2" style={{ color: 'var(--dim)' }}>Data Security &amp; Infrastructure</div>
      <div className="flex gap-1">
        {INFRA_OPTS.map((o, i) => {
          const isSelected = infraLevel === o.key
          const isHighlighted = activeKey === o.key
          return (
            <div key={o.key} onClick={() => setInfra(o.key)}
              className="flex-1 p-1.5 rounded-md border cursor-pointer"
              style={{
                borderColor: isSelected || isHighlighted ? 'var(--green)' : 'var(--b1)',
                background: 'var(--card)',
                opacity: visible[i] ? 1 : 0,
                transform: visible[i] ? 'translateY(0)' : 'translateY(7px)',
                transition: `opacity .35s ease, transform .35s ease, border-color .45s ease`,
              }}>
              <div className="text-[9px] mb-0.5">{o.icon}</div>
              <div className="text-[8px] font-semibold" style={{ color: 'var(--bright)' }}>{o.name}</div>
              <div className="text-[7px] leading-snug" style={{ color: 'var(--dim)' }}>{o.desc}</div>
              {o.tag && <div className="text-[7px] font-semibold mt-0.5"
                style={{ color: isSelected ? 'var(--green)' : o.free ? 'var(--amber)' : 'var(--green)' }}>{o.tag}</div>}
            </div>
          )
        })}
      </div>
    </div>
  )
}

const DEPLOY_OPTS: { key: DeployModel; icon: string; name: string; desc: string; tag?: string; upgrade?: boolean }[] = [
  { key: 'cloud',  icon: '☁',  name: 'Cloud',   desc: 'Converse hosted', tag: '● Current' },
  { key: 'onprem', icon: '🏢', name: 'On-Prem', desc: 'Your data center' },
  { key: 'hybrid', icon: '🔄', name: 'Hybrid',  desc: 'Cloud + On-Prem', tag: '✦ Upgrade', upgrade: true },
]

function DeployCol() {
  const deployModel = useStore(s => s.deployModel)
  const setDeploy   = useStore(s => s.setDeploy)
  const [visible, setVisible]     = useState<boolean[]>(Array(3).fill(false))
  const [activeKey, setActiveKey] = useState<DeployModel | null>(null)

  useEffect(() => {
    DEPLOY_OPTS.forEach((_, i) => {
      setTimeout(() => setVisible(v => { const n=[...v]; n[i]=true; return n }), 150 + i * 460)
    })
    // After last card: highlight "cloud"
    setTimeout(() => setActiveKey('cloud'), 150 + 2 * 460 + 380)
  }, [])

  return (
    <div className="flex-1 pl-4 flex flex-col justify-center">
      <div className="text-[7.5px] font-bold tracking-widest uppercase mb-2" style={{ color: 'var(--dim)' }}>Deployment Model</div>
      <div className="flex gap-1">
        {DEPLOY_OPTS.map((o, i) => {
          const isSelected = deployModel === o.key
          const isHighlighted = activeKey === o.key
          return (
            <div key={o.key} onClick={() => setDeploy(o.key)}
              className="flex-1 p-1.5 rounded-md border cursor-pointer"
              style={{
                borderColor: isSelected || isHighlighted ? 'var(--green)' : 'var(--b1)',
                background: 'var(--card)',
                opacity: visible[i] ? 1 : 0,
                transform: visible[i] ? 'translateY(0)' : 'translateY(7px)',
                transition: `opacity .35s ease, transform .35s ease, border-color .45s ease`,
              }}>
              <div className="text-[9px] mb-0.5">{o.icon}</div>
              <div className="text-[8px] font-semibold" style={{ color: 'var(--bright)' }}>{o.name}</div>
              <div className="text-[7px] leading-snug" style={{ color: 'var(--dim)' }}>{o.desc}</div>
              {o.tag && <div className="text-[7px] font-semibold mt-0.5"
                style={{ color: isSelected ? 'var(--green)' : o.upgrade ? 'var(--amber)' : 'var(--green)' }}>{o.tag}</div>}
            </div>
          )
        })}
      </div>
    </div>
  )
}

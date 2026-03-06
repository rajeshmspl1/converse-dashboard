'use client'
import { useState, useCallback } from 'react'
import { INFRA_CONFIG, DEPLOY_CONFIG, DEMO_SCENARIOS } from '@/lib/data'
import type { InfraLevel, DeployModel } from '@/types'

interface Props {
  onComplete: () => void
}

const INFRA_TIERS: InfraLevel[] = ['shared', 'secure', 'premium', 'owned']
const DEPLOY_MODELS: DeployModel[] = ['cloud', 'hybrid', 'onprem']

const DATA_LOCATIONS: Record<InfraLevel, string> = {
  shared: 'Converse shared DB — Azure India West',
  secure: 'Your own dedicated DB — data isolated',
  premium: 'Your compute + storage — fully dedicated',
  owned: 'Your data center — complete sovereignty',
}

const DEPLOY_DETAILS: Record<DeployModel, string> = {
  cloud: 'Converse-hosted cloud infrastructure',
  hybrid: 'Cloud AI + your on-prem data node',
  onprem: 'Your hardware, your network, nothing leaves',
}

export default function InfraMigrationDemo({ onComplete }: Props) {
  const [currentInfra, setCurrentInfra] = useState<InfraLevel>('shared')
  const [currentDeploy, setCurrentDeploy] = useState<DeployModel>('cloud')
  const [migrating, setMigrating] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)
  const [migrations, setMigrations] = useState<string[]>([])

  const migrate = useCallback((type: 'infra' | 'deploy', target: string) => {
    const key = `${type}:${target}`
    if (migrating) return
    setMigrating(key)
    setProgress(0)

    const isInfra = type === 'infra'
    const simMs = isInfra ? 3000 : 5000
    const label = isInfra ? '15 min' : '2 hrs'
    const startTime = Date.now()

    const iv = setInterval(() => {
      const elapsed = Date.now() - startTime
      const pct = Math.min(elapsed / simMs * 100, 100)
      setProgress(pct)
      if (pct >= 100) {
        clearInterval(iv)
        if (isInfra) setCurrentInfra(target as InfraLevel)
        else setCurrentDeploy(target as DeployModel)
        setMigrating(null)
        setMigrations(prev => [...prev, `${isInfra ? 'Data' : 'Deploy'}: ${target} (${label} simulated)`])
      }
    }, 50)
  }, [migrating])

  const infraCfg = INFRA_CONFIG[currentInfra]
  const deployCfg = DEPLOY_CONFIG[currentDeploy]

  return (
    <div className="flex-1 overflow-y-auto p-3 md:p-6 flex flex-col gap-3 md:gap-4">

      {/* Header */}
      <div className="text-center">
        <div className="text-[24px] md:text-[28px] mb-1">🏗</div>
        <div className="text-[14px] md:text-[18px] font-bold mb-1" style={{ color: 'var(--bright)' }}>
          Live Infrastructure Migration
        </div>
        <div className="text-[11px] md:text-[13px]" style={{ color: 'var(--dim)' }}>
          Click any tier to migrate — watch it happen in real-time
        </div>
      </div>

      {/* Current status */}
      <div className="rounded-xl border p-3" style={{ borderColor: 'var(--b1)', background: 'rgba(255,255,255,.02)' }}>
        <div className="text-[8px] font-bold uppercase tracking-[.2em] mb-2" style={{ color: 'var(--dim)' }}>Current</div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="text-[14px]">{infraCfg.icon}</span>
            <div>
              <div className="text-[12px] font-bold" style={{ color: infraCfg.color }}>{infraCfg.label}</div>
              <div className="text-[8px]" style={{ color: 'var(--dim)' }}>{DATA_LOCATIONS[currentInfra].split('—')[0].trim()}</div>
            </div>
          </div>
          <div className="text-[10px]" style={{ color: 'var(--b2)' }}>·</div>
          <div className="flex items-center gap-1.5">
            <span className="text-[14px]">{deployCfg.icon}</span>
            <div>
              <div className="text-[12px] font-bold" style={{ color: deployCfg.color }}>{deployCfg.label}</div>
              <div className="text-[8px]" style={{ color: 'var(--dim)' }}>{DEPLOY_DETAILS[currentDeploy].split(',')[0]}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Migration progress */}
      {migrating && (
        <div className="rounded-lg border p-3" style={{
          borderColor: 'rgba(245,158,11,.3)',
          background: 'rgba(245,158,11,.05)',
          animation: 'fadeSlideIn 0.3s ease-out',
        }}>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-bold" style={{ color: '#f59e0b' }}>
              Migrating {migrating.startsWith('infra') ? 'data infrastructure' : 'deployment model'}…
            </span>
            <span className="text-[10px] font-mono" style={{ color: '#f59e0b' }}>{Math.round(progress)}%</span>
          </div>
          <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,.06)' }}>
            <div className="h-full rounded-full transition-all duration-100"
              style={{ width: `${progress}%`, background: 'linear-gradient(90deg, #f59e0b, #22c55e)' }} />
          </div>
          <div className="text-[8px] mt-1" style={{ color: 'var(--dim)' }}>
            Zero downtime · {migrating.startsWith('infra') ? 'Simulating 15 min' : 'Simulating 2 hrs'}
          </div>
        </div>
      )}

      {/* Data Infrastructure */}
      <div className="rounded-xl border p-3" style={{ borderColor: 'var(--b1)', background: 'var(--card)' }}>
        <div className="text-[9px] font-bold uppercase tracking-[.15em] mb-2" style={{ color: 'var(--bright)' }}>
          Data Infrastructure
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {INFRA_TIERS.map(tier => {
            const cfg = INFRA_CONFIG[tier]
            const isCurrent = currentInfra === tier
            return (
              <button key={tier}
                onClick={() => !isCurrent && !migrating && migrate('infra', tier)}
                disabled={isCurrent || !!migrating}
                className="rounded-lg border p-2.5 text-left transition-all hover:scale-[1.02] disabled:hover:scale-100"
                style={{
                  borderColor: isCurrent ? cfg.color : 'var(--b2)',
                  background: isCurrent ? `${cfg.color}15` : 'transparent',
                  opacity: migrating && !isCurrent ? 0.4 : 1,
                }}>
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-[11px]">{cfg.icon}</span>
                  <span className="text-[10px] font-bold" style={{ color: isCurrent ? cfg.color : 'var(--text)' }}>{cfg.label}</span>
                </div>
                <div className="text-[7px] leading-snug" style={{ color: 'var(--dim)' }}>
                  {DATA_LOCATIONS[tier].split('—')[0].trim()}
                </div>
                {isCurrent
                  ? <div className="text-[7px] font-bold mt-1 px-1.5 py-0.5 rounded inline-block" style={{ background: `${cfg.color}22`, color: cfg.color }}>Current</div>
                  : !migrating && <div className="text-[7px] mt-1" style={{ color: 'var(--dim)' }}>Upgrade — 15 min</div>
                }
              </button>
            )
          })}
        </div>
      </div>

      {/* Deployment Model */}
      <div className="rounded-xl border p-3" style={{ borderColor: 'var(--b1)', background: 'var(--card)' }}>
        <div className="text-[9px] font-bold uppercase tracking-[.15em] mb-2" style={{ color: 'var(--bright)' }}>
          Deployment Model
        </div>
        <div className="grid grid-cols-3 gap-2">
          {DEPLOY_MODELS.map(model => {
            const cfg = DEPLOY_CONFIG[model]
            const isCurrent = currentDeploy === model
            return (
              <button key={model}
                onClick={() => !isCurrent && !migrating && migrate('deploy', model)}
                disabled={isCurrent || !!migrating}
                className="rounded-lg border p-2.5 text-left transition-all hover:scale-[1.02] disabled:hover:scale-100"
                style={{
                  borderColor: isCurrent ? cfg.color : 'var(--b2)',
                  background: isCurrent ? `${cfg.color}15` : 'transparent',
                  opacity: migrating && !isCurrent ? 0.4 : 1,
                }}>
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-[11px]">{cfg.icon}</span>
                  <span className="text-[10px] font-bold" style={{ color: isCurrent ? cfg.color : 'var(--text)' }}>{cfg.label}</span>
                </div>
                <div className="text-[7px] leading-snug" style={{ color: 'var(--dim)' }}>{DEPLOY_DETAILS[model].split(',')[0]}</div>
                {isCurrent
                  ? <div className="text-[7px] font-bold mt-1 px-1.5 py-0.5 rounded inline-block" style={{ background: `${cfg.color}22`, color: cfg.color }}>Current</div>
                  : !migrating && <div className="text-[7px] mt-1" style={{ color: 'var(--dim)' }}>Switch — 2 hrs</div>
                }
              </button>
            )
          })}
        </div>
      </div>

      {/* Migration log */}
      {migrations.length > 0 && (
        <div className="rounded-lg border p-3" style={{ borderColor: 'var(--b1)', background: 'rgba(0,0,0,.15)' }}>
          <div className="text-[8px] font-bold uppercase tracking-wide mb-1.5" style={{ color: 'var(--dim)' }}>Migration Log</div>
          {migrations.map((m, i) => (
            <div key={i} className="flex items-center gap-2 text-[9px] py-0.5">
              <span style={{ color: '#22c55e' }}>✓</span>
              <span style={{ color: 'var(--text)' }}>{m}</span>
              <span style={{ color: 'var(--dim)' }}>· Zero downtime</span>
            </div>
          ))}
        </div>
      )}

      {/* Journey recap */}
      <div className="rounded-xl border p-3" style={{ borderColor: 'rgba(34,197,94,.2)', background: 'rgba(34,197,94,.03)' }}>
        <div className="text-[8px] font-bold uppercase tracking-[.2em] mb-2" style={{ color: '#22c55e' }}>Your Infrastructure Journey</div>
        {DEMO_SCENARIOS.slice(0, 5).map((sc, i) => (
          <div key={sc.id} className="flex items-center gap-2 text-[9px] py-0.5 font-mono">
            <span>{sc.icon}</span>
            <span style={{ color: 'var(--text)' }}>#{i + 1}</span>
            <span style={{ color: INFRA_CONFIG[sc.infra].color }}>{sc.infraIcon} {INFRA_CONFIG[sc.infra].label}</span>
            <span style={{ color: 'var(--dim)' }}>·</span>
            <span style={{ color: DEPLOY_CONFIG[sc.deploy].color }}>{sc.deployIcon} {DEPLOY_CONFIG[sc.deploy].label}</span>
          </div>
        ))}
      </div>

      {/* Complete */}
      {migrations.length >= 1 && (
        <button onClick={onComplete}
          className="w-full py-3 rounded-xl font-bold text-[13px] transition-all hover:opacity-90"
          style={{
            background: 'linear-gradient(135deg, #22c55e, #06b6d4)',
            color: '#fff',
            boxShadow: '0 4px 20px rgba(34,197,94,.3)',
            animation: 'fadeSlideIn 0.5s ease-out',
          }}>
          Complete Journey — See What's Next →
        </button>
      )}
    </div>
  )
}

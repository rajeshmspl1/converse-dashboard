'use client'
import { DEMO_SCENARIOS } from '@/lib/data'

interface Props {
  demoStep: number
  scenarioTimes: (number | null)[]
  totalElapsed: number
  isCallActive: boolean
}

export default function DemoTimeline({ demoStep, scenarioTimes, totalElapsed, isCallActive }: Props) {
  const fmtTime = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  return (
    <div className="flex items-center gap-0 px-3 md:px-5 py-1.5 border-b flex-shrink-0 overflow-x-auto"
      style={{ borderColor: 'var(--b1)', background: 'rgba(7,13,26,.6)' }}>

      {DEMO_SCENARIOS.map((sc, i) => {
        const isDone = i < demoStep
        const isActive = i === demoStep
        const isPending = i > demoStep
        const time = scenarioTimes[i]

        return (
          <div key={sc.id} className="flex items-center" style={{ flex: i < DEMO_SCENARIOS.length - 1 ? 1 : undefined }}>
            <div className="flex flex-col items-center gap-0.5 min-w-[48px] md:min-w-[56px]">
              <div className="flex items-center gap-0.5">
                <span className="text-[10px] md:text-[12px]">{sc.icon}</span>
                <div
                  className="w-4 h-4 md:w-5 md:h-5 rounded-full flex items-center justify-center text-[7px] md:text-[8px] font-bold border-2 transition-all duration-500"
                  style={
                    isDone
                      ? { background: '#22c55e', borderColor: '#22c55e', color: '#fff' }
                      : isActive
                        ? { background: 'transparent', borderColor: '#f59e0b', color: '#f59e0b', animation: 'pulse 2s infinite' }
                        : { background: 'transparent', borderColor: 'var(--b2)', color: 'var(--dim)' }
                  }
                >
                  {isDone ? '✓' : i + 1}
                </div>
              </div>
              <div className="text-[6px] md:text-[7px] font-bold text-center whitespace-nowrap transition-colors duration-500"
                style={{ color: isDone ? '#22c55e' : isActive ? '#f59e0b' : 'var(--dim)' }}>
                {sc.title.length > 12 ? sc.title.slice(0, 10) + '…' : sc.title}
              </div>
              {isDone && time !== null && (
                <div className="text-[6px] font-mono" style={{ color: 'var(--dim)' }}>{fmtTime(time)}</div>
              )}
              {isActive && isCallActive && (
                <div className="text-[6px] font-mono" style={{ color: '#f59e0b' }}>●</div>
              )}
            </div>

            {i < DEMO_SCENARIOS.length - 1 && (
              <div className="flex-1 h-[2px] mx-0.5 md:mx-1 rounded-full transition-colors duration-500"
                style={{
                  background: i < demoStep
                    ? '#22c55e'
                    : i === demoStep
                      ? 'linear-gradient(90deg, #f59e0b 50%, var(--b2) 50%)'
                      : 'var(--b2)',
                  minWidth: '8px',
                }} />
            )}
          </div>
        )
      })}

      <div className="flex flex-col items-center ml-2 md:ml-3 pl-2 md:pl-3 border-l flex-shrink-0" style={{ borderColor: 'var(--b2)' }}>
        <div className="text-[6px] md:text-[7px] font-bold uppercase tracking-wide" style={{ color: 'var(--dim)' }}>Total</div>
        <div className="font-mono text-[12px] md:text-[14px] font-bold" style={{ color: totalElapsed > 0 ? 'var(--bright)' : 'var(--dim)' }}>
          {fmtTime(totalElapsed)}
        </div>
      </div>
    </div>
  )
}

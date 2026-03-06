'use client'

interface Props {
  steps: string[]
  completedCount: number   // driven by liveIntents.length from useLiveKitCall
}

export default function AskSteps({ steps, completedCount }: Props) {
  if (!steps || steps.length === 0) return null

  return (
    <div className="px-3 py-2.5 border-b flex-shrink-0"
      style={{ borderColor: 'var(--b1)', background: 'rgba(0,0,0,.08)' }}>
      <div className="text-[7.5px] font-bold tracking-widest uppercase mb-2"
        style={{ color: 'var(--dim)' }}>
        💬 Say this next
      </div>
      <div className="flex flex-col gap-1.5">
        {steps.map((step, i) => {
          const isDone    = i < completedCount
          const isCurrent = i === completedCount

          return (
            <div
              key={i}
              className="flex items-start gap-2 px-2.5 py-2 rounded-lg border transition-all duration-300"
              style={{
                borderColor: isCurrent
                  ? 'rgba(6,182,212,.4)'
                  : isDone
                  ? 'rgba(34,197,94,.2)'
                  : 'var(--b2)',
                background: isCurrent
                  ? 'rgba(6,182,212,.06)'
                  : isDone
                  ? 'rgba(34,197,94,.03)'
                  : 'transparent',
                opacity: isDone ? 0.45 : 1,
              }}>
              {/* Step number / checkmark */}
              <div
                className="w-[15px] h-[15px] rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-[8px] font-bold"
                style={{
                  background: isDone
                    ? 'rgba(34,197,94,.15)'
                    : isCurrent
                    ? 'rgba(6,182,212,.15)'
                    : 'rgba(255,255,255,.04)',
                  color: isDone ? '#22c55e' : isCurrent ? '#06b6d4' : 'var(--dim)',
                }}>
                {isDone ? '✓' : i + 1}
              </div>

              {/* Text */}
              <div className="flex-1 text-[9.5px] leading-snug"
                style={{ color: isCurrent ? 'var(--bright)' : 'var(--dim)', fontWeight: isCurrent ? 600 : 400 }}>
                {step}
              </div>

              {/* Arrow on current */}
              {isCurrent && (
                <div className="text-[9px] flex-shrink-0 mt-0.5" style={{ color: '#06b6d4' }}>→</div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

'use client'

interface LogoProps {
  size?: number
  showWordmark?: boolean
  showTagline?: boolean
  className?: string
}

export default function Logo({ size = 32, showWordmark = false, showTagline = false, className = '' }: LogoProps) {
  const scale = size / 32

  if (!showWordmark) {
    return (
      <div className={`flex items-center ${className}`}>
        <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="2" y="4" width="28" height="24" rx="8" stroke="#00C9B1" strokeWidth="1.8" fill="none" />
          <text x="16" y="20" textAnchor="middle" fontFamily="Inter, system-ui, sans-serif" fontWeight="700" fontSize="14" fill="#00C9B1">Ai</text>
        </svg>
      </div>
    )
  }

  return (
    <div className={`flex items-center ${className}`}>
      <div className="flex flex-col">
        <div className="flex items-center gap-0.5">
          <svg width={Math.round(30 * scale)} height={Math.round(18 * scale)} viewBox="0 0 30 18" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="1" y="1" width="28" height="16" rx="5" stroke="#00C9B1" strokeWidth="1.2" fill="none" />
            <text x="15" y="13" textAnchor="middle" fontFamily="Inter, system-ui, sans-serif" fontWeight="700" fontSize="11.5" fill="#00C9B1">Ai</text>
          </svg>
          <span
            className="font-black tracking-tight leading-none"
            style={{
              fontSize: Math.round(18 * scale),
              letterSpacing: '-0.5px',
              color: 'var(--bright, #DDE6F5)',
            }}
          >
            IVRs
          </span>
        </div>
        {showTagline && (
          <span
            className="leading-none"
            style={{
              fontSize: Math.max(5.5, Math.round(6 * scale)),
              fontWeight: 500,
              letterSpacing: '1.2px',
              color: 'var(--bright, #DDE6F5)',
              marginTop: Math.round(2 * scale),
            }}
          >
            ZERO INTEGRATION
          </span>
        )}
      </div>
    </div>
  )
}

export function GoldRule({ faint = false }: { faint?: boolean }) {
  return <div className={faint ? 'gold-rule-faint' : 'gold-rule'} />
}

export function OrnamentalDivider({ children }: { children?: React.ReactNode }) {
  return (
    <div className="ornamental-divider">
      {children ?? <span className="text-sm select-none">✦</span>}
    </div>
  )
}

/** Arch window silhouette — rendered in header backgrounds */
export function ArchWindow({
  width = 260,
  height = 340,
  opacity = 0.12,
}: {
  width?: number
  height?: number
  opacity?: number
}) {
  const cx = width / 2
  const archTop = height * 0.3
  const pillarX = width * 0.12

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ opacity }}
      aria-hidden
    >
      {/* Outer arch */}
      <path
        d={`M${pillarX} ${height} V${archTop} Q${cx} 0 ${width - pillarX} ${archTop} V${height}`}
        stroke="#C9A84C"
        strokeWidth="1.5"
      />
      {/* Inner arch */}
      <path
        d={`M${pillarX + 12} ${height} V${archTop + 14} Q${cx} ${16} ${width - pillarX - 12} ${archTop + 14} V${height}`}
        stroke="#C9A84C"
        strokeWidth="0.6"
      />
      {/* Keystone */}
      <path
        d={`M${cx - 10} ${archTop} L${cx} ${archTop - 16} L${cx + 10} ${archTop} Z`}
        stroke="#C9A84C"
        strokeWidth="0.8"
      />
      {/* Horizontal rails */}
      <line x1={pillarX} y1={height * 0.55} x2={width - pillarX} y2={height * 0.55} stroke="#C9A84C" strokeWidth="0.6" />
      <line x1={pillarX} y1={height * 0.75} x2={width - pillarX} y2={height * 0.75} stroke="#C9A84C" strokeWidth="0.6" />
      {/* Pillar details */}
      <line x1={pillarX} y1={height * 0.3} x2={pillarX} y2={height} stroke="#C9A84C" strokeWidth="0.4" strokeDasharray="3 4" />
      <line x1={width - pillarX} y1={height * 0.3} x2={width - pillarX} y2={height} stroke="#C9A84C" strokeWidth="0.4" strokeDasharray="3 4" />
    </svg>
  )
}

/** Floral ornament for section breaks */
export function FloralOrnament({ className = '' }: { className?: string }) {
  return (
    <svg
      width="160"
      height="32"
      viewBox="0 0 160 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      {/* Left branch */}
      <path d="M0 16 Q18 6 36 16" stroke="#C9A84C" strokeWidth="0.75" opacity="0.7" />
      <path d="M8 16 Q12 8 18 12" stroke="#C9A84C" strokeWidth="0.5" opacity="0.5" />
      <path d="M20 16 Q26 8 32 12" stroke="#C9A84C" strokeWidth="0.5" opacity="0.5" />
      {/* Right branch */}
      <path d="M160 16 Q142 6 124 16" stroke="#C9A84C" strokeWidth="0.75" opacity="0.7" />
      <path d="M152 16 Q148 8 142 12" stroke="#C9A84C" strokeWidth="0.5" opacity="0.5" />
      <path d="M140 16 Q134 8 128 12" stroke="#C9A84C" strokeWidth="0.5" opacity="0.5" />
      {/* Center petals */}
      <path d="M80 8 Q84 12 80 16 Q76 12 80 8Z" fill="rgba(201,168,76,0.55)" />
      <path d="M88 16 Q84 20 80 16 Q84 12 88 16Z" fill="rgba(201,168,76,0.45)" />
      <path d="M80 24 Q76 20 80 16 Q84 20 80 24Z" fill="rgba(201,168,76,0.55)" />
      <path d="M72 16 Q76 12 80 16 Q76 20 72 16Z" fill="rgba(201,168,76,0.45)" />
      <circle cx="80" cy="16" r="2.5" fill="#C9A84C" opacity="0.8" />
      {/* Connecting lines */}
      <line x1="44" y1="16" x2="66" y2="16" stroke="#C9A84C" strokeWidth="0.6" opacity="0.5" />
      <line x1="94" y1="16" x2="116" y2="16" stroke="#C9A84C" strokeWidth="0.6" opacity="0.5" />
    </svg>
  )
}

/** Corner frame decoration (top-left, rotatable) */
export function CornerOrnament({ className = '' }: { className?: string }) {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden>
      <path d="M2 38 V8 Q2 2 8 2 H38" stroke="#C9A84C" strokeWidth="0.75" opacity="0.6" />
      <path d="M6 38 V10 Q6 6 10 6 H38" stroke="#C9A84C" strokeWidth="0.4" opacity="0.4" />
      <circle cx="4" cy="4" r="2" stroke="#C9A84C" strokeWidth="0.6" fill="none" opacity="0.5" />
    </svg>
  )
}

/** Fondo decorativo: barras del monograma E + línea ascendente */
interface BrandPatternProps {
  className?: string;
  opacity?: number;
}

export function BrandPattern({ className = '', opacity = 0.06 }: BrandPatternProps) {
  return (
    <div
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
      aria-hidden>
      <svg
        className="absolute inset-0 h-full w-full"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id="brand-pattern-grad" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#8A2BE2" />
            <stop offset="50%" stopColor="#C026D3" />
            <stop offset="100%" stopColor="#00E5FF" />
          </linearGradient>
        </defs>
        <rect x="8%" y="18%" width="12%" height="2" fill="url(#brand-pattern-grad)" opacity={opacity} />
        <rect x="8%" y="22%" width="18%" height="2" fill="url(#brand-pattern-grad)" opacity={opacity * 0.85} />
        <rect x="8%" y="26%" width="14%" height="2" fill="url(#brand-pattern-grad)" opacity={opacity * 0.7} />
        <line
          x1="70%"
          y1="75%"
          x2="92%"
          y2="12%"
          stroke="url(#brand-pattern-grad)"
          strokeWidth="1"
          opacity={opacity * 1.2}
        />
        <circle cx="92%" cy="12%" r="3" fill="#00E5FF" opacity={opacity * 2} />
      </svg>
    </div>
  );
}

type BrandLogoSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'hero';

const heights: Record<BrandLogoSize, number> = {
  xs: 32,
  sm: 48,
  md: 72,
  lg: 120,
  xl: 180,
  hero: 240,
};

interface BrandLogoProps {
  size?: BrandLogoSize;
  className?: string;
  animate?: boolean;
  breathe?: boolean;
}

function Monogram({ h }: { h: number }) {
  const w = h * 0.85;
  return (
    <svg width={w} height={h} viewBox="0 0 48 56" fill="none" aria-hidden>
      <defs>
        <linearGradient id="ascendx-grad" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#8A2BE2" />
          <stop offset="35%" stopColor="#C026D3" />
          <stop offset="70%" stopColor="#00A3FF" />
          <stop offset="100%" stopColor="#00E5FF" />
        </linearGradient>
      </defs>
      <rect x="4" y="8" width="28" height="4" rx="2" fill="url(#ascendx-grad)" opacity="0.9" />
      <rect x="4" y="18" width="20" height="4" rx="2" fill="url(#ascendx-grad)" opacity="0.75" />
      <rect x="4" y="28" width="24" height="4" rx="2" fill="url(#ascendx-grad)" opacity="0.85" />
      <path d="M28 8 L40 28 L34 28 L38 44 L24 24 L30 24 L22 8 Z" fill="url(#ascendx-grad)" />
    </svg>
  );
}

export function BrandLogo({
  size = 'md',
  className = '',
  animate: _animate = false,
  breathe = false,
}: BrandLogoProps) {
  const h = heights[size];
  const showText = size !== 'xs';

  return (
    <div
      className={`inline-flex items-center gap-2 select-none ${breathe ? 'brand-logo-breathe' : ''} ${className}`}
      style={{ height: h }}>
      <Monogram h={Math.min(h, 56)} />
      {showText && (
        <div className="flex flex-col leading-none">
          <span
            className="brand-gradient-text font-bold tracking-tight"
            style={{ fontSize: Math.max(14, h * 0.22) }}>
            ASCENDX
          </span>
          <span className="text-cyan-400/90 font-semibold" style={{ fontSize: Math.max(10, h * 0.12) }}>
            AI
          </span>
        </div>
      )}
    </div>
  );
}

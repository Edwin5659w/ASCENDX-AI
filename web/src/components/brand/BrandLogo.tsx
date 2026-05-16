import { motion } from 'framer-motion';

type BrandLogoSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'hero';

const sizeMap: Record<BrandLogoSize, string> = {
  xs: 'h-8',
  sm: 'h-12',
  md: 'h-[72px]',
  lg: 'h-[120px]',
  xl: 'h-[180px]',
  hero: 'h-[240px]',
};

interface BrandLogoProps {
  size?: BrandLogoSize;
  className?: string;
  /** Microanimación al montar (auth, headers) */
  animate?: boolean;
  /** Pulso sutil continuo (pantallas auth) */
  breathe?: boolean;
}

export function BrandLogo({
  size = 'md',
  className = '',
  animate = false,
  breathe = false,
}: BrandLogoProps) {
  const img = (
    <img
      src="/brand/logo-full.png"
      alt="ASCENDX AI"
      className={`w-auto object-contain ${sizeMap[size]} ${breathe ? 'brand-logo-breathe' : ''} ${className}`}
      draggable={false}
    />
  );

  if (!animate) return img;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}>
      {img}
    </motion.div>
  );
}

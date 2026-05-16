/** Tokens de identidad visual ASCENDX AI — derivados del logo oficial */
export const brand = {
  colors: {
    bg: '#0a0a0f',
    surface: '#14141f',
    surfaceLight: '#1c1c2e',
    white: '#ffffff',
    /** Magenta / púrpura (esquina inferior-izquierda del gradiente del logo) */
    magenta: '#C026D3',
    magentaDeep: '#8A2BE2',
    /** Cyan eléctrico (esquina superior-derecha) */
    cyan: '#00E5FF',
    cyanDeep: '#00A3FF',
    /** Primario de UI: punto medio del gradiente de marca */
    primary: '#7C3AED',
    primaryLight: '#A78BFA',
    accent: '#00E5FF',
    border: 'rgba(255, 255, 255, 0.08)',
  },
  gradient: {
    /** Diagonal logo: púrpura abajo-izq → cyan arriba-der */
    stops: ['#8A2BE2', '#C026D3', '#00A3FF', '#00E5FF'] as const,
    css: 'linear-gradient(135deg, #8A2BE2 0%, #C026D3 35%, #00A3FF 70%, #00E5FF 100%)',
    cssSubtle: 'linear-gradient(135deg, rgba(138,43,226,0.15) 0%, rgba(0,229,255,0.08) 100%)',
  },
  logo: {
    pathWeb: '/brand/logo-full.png',
    minClearSpacePx: 16,
    sizes: {
      xs: 32,
      sm: 48,
      md: 72,
      lg: 120,
      xl: 180,
      hero: 240,
    },
  },
  splash: {
    durationMs: 2600,
    sessionKey: 'ascendx_splash_seen',
  },
  motion: {
    easePremium: [0.22, 1, 0.36, 1] as const,
    durationFast: 200,
    durationNormal: 400,
    durationSplash: 2600,
  },
} as const;

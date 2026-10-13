import { useId } from 'react';
import Svg, { Defs, LinearGradient, Path, Stop } from 'react-native-svg';

/**
 * Símbolo oficial de ASCENDX AI, vectorizado a partir del logo del autor
 * (docs/marca/logo-original.png). Se divide en piezas para poder animarlas
 * por separado en la animación de inicio; todas comparten el mismo
 * degradado en coordenadas absolutas, así que superpuestas se ven como una
 * sola figura.
 *
 * Mismas formas que apps/mobile/assets/brand/symbol.svg.
 */

export const LOGO_VIEWBOX = { width: 760, height: 630 } as const;
export const LOGO_ASPECT = LOGO_VIEWBOX.width / LOGO_VIEWBOX.height;

export const LOGO_PARTS = {
  /** Barra superior, diagonal y «M» */
  base: 'M20 182 L318 182 L508 357 L733 182 L733 472 L657 540 L657 323 L502 440 L300 248 L95 248 Z',
  /** Flecha que asciende */
  arrow: 'M425 280 L425 117 L342 143 L462 20 L590 143 L508 117 L508 357 Z',
  /** Barra central de la «E» */
  bar: 'M62 320 H282 V388 H62 Z',
  /** Barra inferior de la «E» con su gancho */
  hook: 'M62 455 L300 455 L340 490 L340 345 L415 410 L415 608 L318 522 L125 522 Z',
} as const;

export type LogoPart = keyof typeof LOGO_PARTS;

/** Colores del degradado del logo: magenta → violeta → azul → cian. */
export const LOGO_GRADIENT = [
  { offset: 0, color: '#D21DFC' },
  { offset: 0.2, color: '#7A18FA' },
  { offset: 0.4, color: '#3532F8' },
  { offset: 0.58, color: '#2069FB' },
  { offset: 0.8, color: '#08B6FC' },
  { offset: 1, color: '#3EF4FE' },
] as const;

interface LogoSymbolProps {
  /** Ancho en puntos; el alto se calcula con la proporción del logo. */
  width: number;
  /** Piezas a dibujar (por defecto, todas). */
  parts?: readonly LogoPart[];
  /** Color sólido en lugar del degradado (p. ej. ícono monocromo). */
  color?: string;
  accessibilityLabel?: string;
}

export function LogoSymbol({ width, parts = ['base', 'arrow', 'bar', 'hook'], color, accessibilityLabel }: LogoSymbolProps) {
  const gradientId = `logo-${useId().replace(/:/g, '')}`;
  const fill = color ?? `url(#${gradientId})`;
  return (
    <Svg
      width={width}
      height={width / LOGO_ASPECT}
      viewBox={`0 0 ${LOGO_VIEWBOX.width} ${LOGO_VIEWBOX.height}`}
      accessibilityLabel={accessibilityLabel}
      accessible={Boolean(accessibilityLabel)}
    >
      {color ? null : (
        <Defs>
          <LinearGradient id={gradientId} x1="70" y1="590" x2="740" y2="120" gradientUnits="userSpaceOnUse">
            {LOGO_GRADIENT.map((stop) => (
              <Stop key={stop.offset} offset={stop.offset} stopColor={stop.color} />
            ))}
          </LinearGradient>
        </Defs>
      )}
      {parts.map((part) => (
        <Path key={part} d={LOGO_PARTS[part]} fill={fill} />
      ))}
    </Svg>
  );
}

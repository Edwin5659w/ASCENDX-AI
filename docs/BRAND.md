# Guía de marca — ASCENDX AI

Identidad visual derivada del **logo oficial** (monograma geométrico + tipografía ASCENDX AI).

## Análisis del logo

| Elemento | Descripción |
|----------|-------------|
| **Forma** | Monograma angular: barras horizontales (E) + estructura en M + flecha ascendente central |
| **Gradiente** | Diagonal púrpura/magenta (abajo-izq) → cyan eléctrico (arriba-der) |
| **Tipografía** | Sans geométrica; la **X** repite el gradiente; **AI** con líneas decorativas |
| **Fondo** | Negro profundo `#0A0A0F` — contraste premium |
| **Concepto** | Ascenso, progreso, inteligencia, tecnología |

## Paleta oficial

| Token | Hex | Uso |
|-------|-----|-----|
| Fondo | `#0A0A0F` | App, splash, auth |
| Superficie | `#14141F` | Cards, sidebar |
| Púrpura marca | `#8A2BE2` | Gradiente inicio |
| Magenta | `#C026D3` | Acentos, glow |
| Cyan | `#00E5FF` | CTAs, links activos |
| Cyan profundo | `#00A3FF` | Gradientes |
| Primario UI | `#7C3AED` | Botones, navegación |
| Texto | `#F4F4F5` | Cuerpo |
| Texto muted | `#A1A1AA` | Secundario |

Gradiente CSS: `linear-gradient(135deg, #8A2BE2 0%, #C026D3 35%, #00A3FF 70%, #00E5FF 100%)`

## Tamaños del logo

| Variante | Altura | Contexto |
|----------|--------|----------|
| `xs` | 32px | Header móvil compacto |
| `sm` | 48px | Sidebar web |
| `md` | 72px | Auth (login/registro) |
| `lg` | 120px | Splash animado |
| `xl` | 180px | Marketing / hero |

**Zona de respiro:** mínimo 16px alrededor del logo. No recortar ni deformar.

## Usos permitidos

- Sobre fondo oscuro `#0A0A0F` o `#14141F`
- Versión completa (icono + texto) en auth y splash
- Versión compacta (`sm`/`xs`) en navegación

## Usos prohibidos

- Deformar proporciones o rotar
- Añadir sombras duras, brillos exagerados o outlines baratos
- Colocar sobre fondos claros sin versión adaptada
- Separar la flecha del monograma de forma que pierda identidad

## App icon y favicon (recomendaciones)

### Favicon web
- Usar solo el **monograma** (sin texto), centrado en canvas 32×32 o 48×48
- Fondo `#0A0A0F`, icono con gradiente marca
- Archivo actual: `web/public/favicon.svg` (motivo E + flecha)

### App icon iOS / Android
1. Exportar el **símbolo** del logo (solo icono superior) en **1024×1024** PNG
2. Dejar ~12% de margen seguro (Apple HIG)
3. Fondo sólido `#0A0A0F` (no transparente en iOS store)
4. Reemplazar:
   - `mobile/assets/images/icon.png`
   - `mobile/assets/images/adaptive-icon.png` (foreground solo el símbolo)
   - `mobile/assets/images/splash-icon.png` (versión centrada para splash nativo Expo)

### Android adaptive icon
- **Foreground:** monograma con gradiente, 108×108 dp safe zone
- **Background:** `#0A0A0F` en `app.json` → `android.adaptiveIcon.backgroundColor`

### iOS splash estático
- Mantener `splash.backgroundColor: #0A0A0F`
- `splash-icon.png`: monograma centrado, ~40% del alto de pantalla

> **Nota:** El splash **animado** en app usa `BrandSplash` (Reanimated / Framer Motion). El splash nativo de Expo actúa como frame hasta que cargan fuentes.

## Componentes implementados

| Plataforma | Componente | Función |
|------------|------------|---------|
| Web | `BrandSplash` | Splash 2.6s (Framer Motion), 1× por sesión |
| Web | `BrandLogo` | Imagen oficial responsive |
| Web | `AuthLayout` | Auth con patrón + logo animado |
| Web | `BrandLoader` / `BrandSkeleton` | Loading con gradiente marca |
| Web | `BrandPattern` | Fondo geométrico sutil |
| Móvil | `BrandSplash` | Splash Reanimated |
| Móvil | `BrandLogo` / `AuthScreenShell` | Auth + microanimación |
| Móvil | `BrandLoader` | Spinner cyan/magenta |

## Microinteracciones

- **Auth:** logo con `breathe` (pulso 4s) y entrada fade+scale
- **Botones primarios:** gradiente púrpura→cyan, glow suave en hover (web)
- **Nav activo:** cyan en lugar de violeta genérico
- **Empty states:** contenedor con gradiente marca
- **Skeleton:** shimmer diagonal púrpura/cyan (`brand-skeleton` en CSS)

## Archivos de assets

- Web: `web/public/brand/logo-full.png`
- Móvil: `mobile/assets/brand/logo-full.png`
- Tokens compartidos: `shared/brand.ts`

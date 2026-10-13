# ASCENDX AI

> Convierte tu situación financiera en un plan claro para avanzar hacia tus metas.

Aplicación móvil **Android** de planificación financiera personal asistida por inteligencia artificial. Proyecto de grado de Tecnología en Desarrollo de Software.

ASCENDX AI ayuda a registrar ingresos, gastos y deudas, crear varias metas financieras al mismo tiempo, comparar escenarios de **ahorro frente a financiación** y recibir explicaciones de una IA que trabaja **sobre cálculos verificables del sistema**, nunca inventando cifras.

> ⚠️ Herramienta educativa y de apoyo a la decisión. No es asesoría financiera profesional, no garantiza aprobaciones de crédito ni promete rendimientos.

## Estado del proyecto

Fase actual del cronograma del anteproyecto: **Fase 2 — Fundamentos y pruebas técnicas**. La trazabilidad completa por requisito (RF-01 a RF-34) está en [`docs/estado.md`](docs/estado.md).

| Módulo | Estado |
|---|---|
| Monorepo, integración continua y arranque con un clic | ✅ Terminado |
| Modelo de datos v2 (Anexo G, montos en pesos enteros) | ✅ Terminado |
| Reglas financieras `finance-core` (sección 6 / Anexo H) | ✅ 49 pruebas, ~99 % de cobertura |
| Cuenta: registro, sesión, bloqueo, recuperación, perfil, permisos, eliminar (RF-01 a RF-06) | ✅ Terminado (falta elegir proveedor de correo) |
| Simulador ahorro / crédito / mixto (RF-20, RF-21) | ✅ API + pantalla |
| Movimientos, categorías, deudas, panel, metas (fase 3) | ⏳ Planificado |
| Asistente de IA (fase 4) | ⏳ Planificado |
| OCR, sin conexión, gamificación P2 (fases 4–5) | ⏳ Planificado |

## Arquitectura

```
┌──────────────────────────────┐   HTTPS + JWT   ┌──────────────────────────────┐
│ App Android  (apps/mobile)   │ ──────────────▶ │ API  (apps/api)              │
│ React Native · Expo · TS     │                 │ Node.js · Express · TS · Zod │
│ Expo Router · SecureStore    │ ◀────────────── │ Auth · reglas · IA (futuro)  │
└──────────────┬───────────────┘                 └──────────────┬───────────────┘
               │        packages/finance-core (cálculos)        │ Prisma
               └──────────────── compartido ───────────────────┘
                                                        ┌───────▼───────┐
                                                        │  PostgreSQL   │
                                                        └───────────────┘
```

- La app nunca habla directamente con la IA ni con la base de datos: todo pasa por la API.
- Las cifras (capacidad de ahorro, metas, cuotas, intereses) se calculan con funciones puras y probadas en `packages/finance-core`; la IA solo las explicará.
- Secretos y claves solo en el servidor.

## Estructura

```
apps/api/                API REST: Express + TypeScript + Prisma + Zod
apps/mobile/             App Android: React Native + Expo + TypeScript
packages/finance-core/   Reglas financieras compartidas (sección 6 del Documento Maestro v2)
docs/                    Documento maestro, decisiones, modelo de datos, API y estado
scripts/                 Arranque y apagado en Windows
```

## Inicio rápido

### Opción fácil (Windows)

Doble clic en **`INICIAR.bat`** (o `npm start` desde la carpeta raíz). El script instala Node.js si falta, crea los `.env`, instala dependencias, levanta una base de datos PostgreSQL local con `prisma dev` (no hace falta instalar PostgreSQL), crea las tablas y abre la API y la app. Para apagar la base de datos: **`DETENER.bat`** (o `npm run stop`).

### Opción manual

Requisitos: Node.js 20+, PostgreSQL (local, `npx prisma dev` o en la nube) y Expo Go o un emulador Android.

```bash
npm install                          # una sola instalación para todo el monorepo
cp apps/api/.env.example apps/api/.env      # DATABASE_URL y JWT_ACCESS_SECRET
npm run db:deploy -w @ascendx/api    # crea las tablas
npm run db:seed -w @ascendx/api      # categorías por defecto y configuración
npm run api                          # http://localhost:4000/api/health
npm run app                          # en otra terminal: abre Expo
npm test                             # pruebas de finance-core y de la API
npm run test:coverage                # cobertura de finance-core (umbral 90 %)
```

Mientras no se elija el proveedor de correo, el código de recuperación de contraseña aparece en la consola de la API (solo en desarrollo).

## Documentación

- [`docs/documento-maestro.md`](docs/documento-maestro.md) — alcance y objetivos
- [`docs/decisiones.md`](docs/decisiones.md) — decisiones técnicas
- [`docs/modelo-datos.md`](docs/modelo-datos.md) — modelo de datos
- [`docs/api.md`](docs/api.md) — referencia de la API
- [`docs/estado.md`](docs/estado.md) — qué está terminado y qué falta

## Convención de commits

Usamos [Conventional Commits](https://www.conventionalcommits.org/es/):
`feat`, `fix`, `docs`, `refactor`, `test`, `chore`, con alcance opcional: `feat(api): ...`, `feat(mobile): ...`, `feat(core): ...`.

## Historial

El repositorio contenía un proyecto anterior (Life OS). Ese código se retiró al reiniciar ASCENDX AI como aplicación de finanzas personales; su último estado queda preservado en la etiqueta `legacy-life-os`.

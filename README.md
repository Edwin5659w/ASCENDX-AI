# ASCENDX AI

> Convierte tu situación financiera en un plan claro para avanzar hacia tus metas.

Aplicación móvil **Android** de planificación financiera personal asistida por inteligencia artificial. Proyecto de grado de Tecnología en Desarrollo de Software.

ASCENDX AI ayuda a registrar ingresos, gastos y deudas, crear varias metas financieras al mismo tiempo, comparar escenarios de **ahorro frente a financiación** y recibir explicaciones de una IA que trabaja **sobre cálculos verificables del sistema**, nunca inventando cifras.

> ⚠️ Herramienta educativa y de apoyo a la decisión. No es asesoría financiera profesional, no garantiza aprobaciones de crédito ni promete rendimientos.

## Estado del proyecto

| Módulo | Estado |
|---|---|
| Estructura del repositorio | ✅ Terminado |
| Backend base (Express + TypeScript) | ✅ Terminado |
| Modelo de datos (Prisma + PostgreSQL) | ✅ Esquema inicial |
| Motor de cálculos financieros | ✅ Con pruebas unitarias |
| Autenticación propia (JWT + refresh rotativo) | ✅ Con pruebas de integración |
| App móvil: sesión, navegación y tema visual | ✅ Primera versión |
| Simulador ahorro vs financiación | ✅ API + pantalla |
| Movimientos, categorías, deudas | ⏳ Planificado |
| Panel financiero y metas | ⏳ Planificado |
| IA contextual | ⏳ Planificado |
| OCR de recibos | ⏳ Planificado |
| Sincronización híbrida (SQLite) | ⏳ Planificado |

Se distingue siempre entre **planificado**, **en desarrollo** y **terminado**. Ver [`docs/estado.md`](docs/estado.md).

## Arquitectura

```
┌──────────────────────────┐      HTTPS + JWT      ┌───────────────────────────┐
│  App Android (mobile/)   │ ────────────────────▶ │  API (backend/)           │
│  React Native · Expo     │                       │  Node.js · Express · TS   │
│  TypeScript · Expo Router│ ◀──────────────────── │  Zod · reglas financieras │
│  SQLite (caché, futuro)  │                       │  Auth · IA · OCR (futuro) │
└──────────────────────────┘                       └─────────────┬─────────────┘
                                                                 │ Prisma ORM
                                                         ┌───────▼───────┐
                                                         │  PostgreSQL   │
                                                         └───────────────┘
```

- Las **claves de IA y secretos viven solo en el backend**.
- Los **cálculos financieros** (cuotas, intereses, proyecciones) son funciones deterministas y probadas en `backend/src/modules/finance/calculations`.
- La IA recibirá únicamente el contexto autorizado y preparado por el backend.

## Estructura

```
backend/   API REST: Express + TypeScript + Prisma + Zod
mobile/    App Android: React Native + Expo + TypeScript
docs/      Documentación del proyecto de grado y decisiones técnicas
```

## Inicio rápido

### Opción fácil (Windows)

Doble clic en **`INICIAR.bat`** (o `npm start` desde la carpeta raíz). El script instala Node.js si falta, crea los `.env`, instala dependencias, levanta una base de datos PostgreSQL local con `prisma dev` (no hace falta instalar PostgreSQL), crea las tablas y abre la API y la app. Para apagar la base de datos: **`DETENER.bat`** (o `npm run stop`).

### Opción manual

### Requisitos

- Node.js 20 o superior
- PostgreSQL 15+ (local o en la nube)
- Android Studio con emulador, o la app **Expo Go** en un teléfono Android

### Backend

```bash
cd backend
cp .env.example .env        # completa DATABASE_URL y los secretos JWT
npm install
npm run db:generate         # genera el cliente de Prisma
npm run db:migrate          # crea las tablas
npm run db:seed             # categorías por defecto (solo desarrollo)
npm run dev                 # http://localhost:4000/api/health
npm test                    # pruebas unitarias (no requieren base de datos)
npm run test:int            # pruebas de integración (requieren la base ascendx_test)
```

### App móvil

```bash
cd mobile
cp .env.example .env        # EXPO_PUBLIC_API_URL (ver mobile/README.md)
npm install
npx expo start              # "a" abre el emulador Android
```

## Documentación

- [`docs/documento-maestro.md`](docs/documento-maestro.md) — alcance y objetivos
- [`docs/decisiones.md`](docs/decisiones.md) — decisiones técnicas
- [`docs/modelo-datos.md`](docs/modelo-datos.md) — modelo de datos
- [`docs/api.md`](docs/api.md) — referencia de la API
- [`docs/estado.md`](docs/estado.md) — qué está terminado y qué falta

## Convención de commits

Usamos [Conventional Commits](https://www.conventionalcommits.org/es/):
`feat`, `fix`, `docs`, `refactor`, `test`, `chore`, con alcance opcional: `feat(backend): ...`, `feat(mobile): ...`.

## Historial

El repositorio contenía un proyecto anterior (Life OS). Ese código se retiró al reiniciar ASCENDX AI como aplicación de finanzas personales; su último estado queda preservado en la etiqueta `legacy-life-os`.

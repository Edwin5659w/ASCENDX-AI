# ASCENDX AI

Plataforma Life OS: objetivos, tareas, hábitos, finanzas y mentor IA personal (web + móvil).

**Comercial:** landing pública, planes Gratis/Pro, referidos (+50 XP), escudos de racha, resumen semanal Pro, 12 logros, foco diario, privacidad/GDPR (eliminar cuenta).

## Estructura

```
/backend   → API Node.js + Express + Prisma + PostgreSQL
/mobile    → Expo React Native + TypeScript
/web       → React + Vite + Tailwind
/shared    → Validadores Zod, plantillas onboarding, prompts IA
/docs      → Guía para defensa universitaria
```

## Inicio rápido

### Backend

```bash
cd backend
cp .env.example .env
# DATABASE_URL (Neon), JWT secrets (≥32 chars), OPENAI_API_KEY
npm install
npx prisma generate
npx prisma migrate deploy
npm run db:seed    # solo desarrollo — bloqueado si NODE_ENV=production
npm run dev        # http://localhost:4000
```

### Web

```bash
cd web
cp .env.example .env
npm install
npm run dev        # http://localhost:5173
```

### Móvil

```bash
cd mobile
cp .env.example .env
# En Expo Go la IP se detecta desde Metro (no suele hacer falta .env)
# EXPO_PUBLIC_WEB_URL=https://tu-web.vercel.app  (enlace a precios desde Perfil)
# Si falla: EXPO_PUBLIC_API_URL=http://TU_IP:4000 y npx expo start -c
npm install
npm start
```

**Paridad web ↔ móvil (v1.1):** foco diario, resumen semanal Pro, banner upgrade, 12 logros, referidos, escudos de racha, activar Pro, eliminar cuenta, deep link `ascendx://register?ref=CODIGO`.

## Endpoints principales

| Área | Rutas |
|------|--------|
| Sistema | `GET /health` |
| Auth | `POST /auth/register`, `/login`, `/refresh`, `/logout`, `/forgot-password`, `/reset-password` |
| Usuario | `GET /user/me`, `/stats`, `/weekly-recap`, `/referral`, `/plan`, `PATCH /user/me`, `POST /user/daily-focus`, `/upgrade-pro`, `DELETE /user/account`, onboarding, push/test |
| Público | `GET /public/stats` |
| Objetivos | `CRUD /goals` |
| Tareas | `CRUD /tasks` |
| Hábitos | `CRUD /habits`, `POST /habits/:id/complete` |
| Finanzas | `CRUD /finance`, `GET /finance/summary` |
| IA | `GET /ai/context`, `/daily-plan`, `/insights`, `/chat-history`, `DELETE /chat-history`, `POST /ai/chat` |

## Usuario demo (desarrollo)

Tras `npm run db:seed` en backend:

- **Email:** `demo@ascendx.ai`
- **Contraseña:** `Demo1234!`

## Tests

```bash
cd backend
npm test
```

Incluye validadores, utilidades de dinero/fechas, contexto IA y pruebas de integración (`/health`, auth 401/400).

## Deploy — checklist producción

### Base de datos (Neon)

1. Crear proyecto en [neon.tech](https://neon.tech)
2. `DATABASE_URL` en el hosting del backend
3. `npx prisma migrate deploy` (nunca `db:seed` en producción)

### Backend (Render / Railway)

- Build: `npm run build --workspace=@ascendx/shared && npm run build --workspace=ascendx-ai-backend`
- Start: `npm run start --workspace=ascendx-ai-backend`
- Variables: ver `backend/.env.example`
- `CORS_ORIGIN`: URL de la web desplegada + origen Expo si aplica
- `WEB_APP_ORIGIN`: URL pública de la web (enlaces de reset password)

### Web (Vercel)

- Root: `web`
- Build: `npm run build`
- `VITE_API_URL`: URL pública del backend

### Móvil (Expo EAS)

- `EXPO_PUBLIC_API_URL` en build de producción
- Push: configurar `EXPO_ACCESS_TOKEN` y `projectId` en EAS

### Seguridad en producción

- Rotar `JWT_ACCESS_SECRET` y `JWT_REFRESH_SECRET`
- No commitear `.env`
- No ejecutar seed con datos demo en producción
- Revisar límites de rate en `/ai` según uso esperado

## Defensa universitaria

Ver **[docs/GUIA-DEFENSA.md](docs/GUIA-DEFENSA.md)** — guion de demo, preguntas del jurado y checklist del día.

Sobre la sugerencia de «Trading» del profesor: **[docs/TRADING.md](docs/TRADING.md)** — tracking vs. trading financiero y cuándo tiene sentido cada uno.

## Scripts SQL manual

`backend/prisma/neon-full-reset.sql` — solo desarrollo; preferir migraciones Prisma en bases nuevas.

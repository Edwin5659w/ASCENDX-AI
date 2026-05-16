# ASCENDX AI

Plataforma Life OS: objetivos, tareas, hábitos, finanzas y mentor IA personal (web + móvil).

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
# EXPO_PUBLIC_API_URL → IP de tu PC o 10.0.2.2:4000 (emulador Android)
npm install
npm start
```

## Endpoints principales

| Área | Rutas |
|------|--------|
| Sistema | `GET /health` |
| Auth | `POST /auth/register`, `/login`, `/refresh`, `/logout`, `/forgot-password`, `/reset-password` |
| Usuario | `GET /user/me`, `/stats`, `PATCH /user/me`, `POST /user/onboarding-setup`, `/onboarding-complete`, `/push/test` |
| Objetivos | `CRUD /goals` |
| Tareas | `CRUD /tasks` |
| Hábitos | `CRUD /habits`, `POST /habits/:id/complete` |
| Finanzas | `CRUD /finance`, `GET /finance/summary` |
| IA | `GET /ai/context`, `/daily-plan`, `/insights`, `POST /ai/chat` |

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

## Scripts SQL manual

`backend/prisma/neon-full-reset.sql` — solo desarrollo; preferir migraciones Prisma en bases nuevas.

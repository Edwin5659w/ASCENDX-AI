# ASCENDX AI

Plataforma Life OS: objetivos, tareas, hábitos, finanzas y mentor IA personal.

## Estructura

```
/backend   → API Node.js + Express + Prisma + PostgreSQL
/mobile    → Expo React Native + TypeScript
/web       → React + Vite + Tailwind (dashboard SaaS)
/shared    → Validadores Zod y tipos compartidos
```

## Backend — inicio rápido

```bash
cd backend
cp .env.example .env
# Configura DATABASE_URL (Neon), JWT secrets y OPENAI_API_KEY
npm install
npx prisma generate
npx prisma migrate dev --name init
npm run dev
```

API: `http://localhost:4000`

## Endpoints principales

| Módulo   | Rutas |
|----------|-------|
| Auth     | `POST /auth/register`, `/login`, `/refresh` |
| Usuario  | `GET /user/me`, `/user/stats` |
| Objetivos| `CRUD /goals` |
| Tareas   | `CRUD /tasks` |
| Hábitos  | `CRUD /habits` + `POST /habits/:id/complete` |
| Finanzas | `CRUD /finance` + `GET /finance/summary` |
| IA       | `GET /ai/daily-plan`, `POST /ai/chat`, `GET /ai/insights` |

## Mobile — inicio rápido

```bash
cd mobile
cp .env.example .env
# EXPO_PUBLIC_API_URL → IP de tu PC o 10.0.2.2:4000 en Android emulator
npm install
npm start
```

Pantallas: Login/Register, Dashboard, Objetivos, Tareas, Mentor IA, Finanzas, Perfil.

## Web — inicio rápido

```bash
cd web
cp .env.example .env
npm install
npm run dev
```

Dashboard: `http://localhost:5173`

## Base de datos (Neon PostgreSQL)

1. Crea un proyecto en [neon.tech](https://neon.tech)
2. Copia la **Connection String** (`postgresql://...`)
3. En `backend/.env` configura `DATABASE_URL=...`
4. Ejecuta:

```bash
cd backend
npx prisma migrate deploy
npm run db:seed
```

**Script SQL manual:** `backend/prisma/NEON_SETUP.sql` (pegar en SQL Editor de Neon)

**Usuario demo tras seed:** `demo@ascendx.ai` / `Demo1234!`

## Deploy

- **Backend:** Render / Railway (`npm run build && npm start`)
- **DB:** Neon PostgreSQL
- **Web:** Vercel (`npm run build`)
- **Mobile:** Expo EAS Build

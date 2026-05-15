# ASCENDX AI

Plataforma Life OS: objetivos, tareas, hábitos, finanzas y mentor IA personal.

## Estructura

```
/backend   → API Node.js + Express + Prisma + PostgreSQL
/mobile    → Expo React Native + TypeScript
/web       → React + Vite (próximo)
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

## Deploy

- **Backend:** Render / Railway (`npm run build && npm start`)
- **DB:** Neon PostgreSQL
- **Web:** Vercel (próximo)
- **Mobile:** Expo EAS Build

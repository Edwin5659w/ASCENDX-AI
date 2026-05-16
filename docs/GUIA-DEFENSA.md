# ASCENDX AI — Guía para defensa de proyecto de grado

## Elevator pitch (30 segundos)

ASCENDX AI es un **Life OS** con web y móvil que centraliza objetivos, tareas, hábitos y finanzas personales, con **mentor IA contextual**, **gamificación** (XP, niveles, insignias) y **sincronización** vía API REST. El valor diferencial es unificar el crecimiento personal en un solo flujo con datos reales que alimentan la IA.

## Arquitectura (qué mostrar en diapositiva)

```
[ Web React ]     [ App Expo ]
       \              /
        \   HTTPS    /
         [ API Express + JWT ]
                |
         [ PostgreSQL Neon ]
                |
            [ OpenAI ]
```

- **Monorepo:** `backend`, `web`, `mobile`, `shared` (validadores Zod compartidos).
- **Seguridad:** Helmet, CORS, rate limiting, bcrypt, refresh rotado, sesión única por login.
- **Calidad:** 22+ tests Vitest, integración ligera con Supertest.

## Demo sugerida (8–10 min)

1. **Usuario nuevo:** registro → onboarding con plantilla (objetivo + tareas + hábito).
2. **Dashboard:** checklist de primeros pasos, plan IA, KPIs con datos.
3. **Tarea:** completar una → +10 XP, progreso de objetivo.
4. **Hábito:** marcar del día → +15 XP, racha.
5. **Mentor IA:** chip de pregunta sugerida según contexto.
6. **Móvil (opcional):** mismo usuario, push en perfil.
7. **Cuenta demo:** `demo@ascendx.ai` / `Demo1234!` si falla la red.

## Preguntas frecuentes del jurado

| Pregunta | Respuesta breve |
|----------|-----------------|
| ¿Por qué no solo Notion/Todoist? | Integra **metas + hábitos + finanzas + IA** con gamificación y doble cliente nativo. |
| ¿La IA inventa datos? | Con perfil vacío usa mensajes guía; con datos usa JSON del usuario; no se acepta `progress`/`streak` por API. |
| ¿Seguridad? | JWT, refresh con rotación, validación Zod, rate limits, campos de juego bloqueados en servidor. |
| ¿Escalabilidad? | API stateless; DB Neon; límites en rutas `/ai` y `/auth`. |
| ¿Limitaciones? | Sin modo offline; IA depende de OpenAI; push requiere dispositivo físico. |
| ¿Pruebas? | Tests unitarios de validadores, dinero, fechas, contexto IA; integración `/health` y auth. |

## Riesgos y mitigaciones (mencionar con madurez)

- **Datos sensibles:** política de privacidad; no asesoría financiera/médica profesional.
- **Coste OpenAI:** rate limit, plan cacheado por día, fallback sin API key.
- **Producción:** no ejecutar `db:seed` con `NODE_ENV=production`.

## Comandos útiles antes de la sustentación

```bash
cd backend && npm run dev
cd web && npm run dev
cd mobile && npm start
cd backend && npm test
```

## Checklist el día de la defensa

- [ ] Backend `.env` con `DATABASE_URL`, JWT y `OPENAI_API_KEY`
- [ ] Web `VITE_API_URL` apuntando al backend
- [ ] Móvil `EXPO_PUBLIC_API_URL` = IP del PC en WiFi
- [ ] Migraciones aplicadas: `npx prisma migrate deploy`
- [ ] Probar login demo y usuario recién registrado

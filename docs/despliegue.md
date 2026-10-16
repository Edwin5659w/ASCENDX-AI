# Despliegue en la nube

La API se publica en **Render** (plan gratis) y la base de datos PostgreSQL en **Neon** (plan gratis). Ninguno pide tarjeta. Decisión: D-009.

| Pieza | Servicio | Notas del plan gratis |
|---|---|---|
| API (Node + Express) | Render, región Ohio | Se duerme tras 15 min sin uso; la primera petición tarda ~1 min. 750 h/mes. |
| PostgreSQL | Neon, región AWS US East 2 (Ohio) | 1 GB por proyecto, se suspende tras 5 min sin uso y despierta solo. |

## Pasos (una sola vez)

1. **Neon:** crear cuenta en neon.com → *New project* → nombre `ascendx`, PostgreSQL más reciente, región **AWS US East 2 (Ohio)** (la misma región que Render). En *Connect* copiar la *connection string* (`postgresql://…`).
2. **Render:** crear cuenta en render.com con GitHub → *New* → *Blueprint* → elegir el repositorio `ASCENDX-AI`. Render lee `render.yaml` y pide `DATABASE_URL`: pegar la dirección de Neon. *Deploy*.
3. Dirección del servicio: **https://ascendx-api.onrender.com** (salud: `/api/health`). Desplegado y verificado el 2026-10-13 (registro, sesión y borrado de cuenta).
4. En el computador: `npm start` (o `INICIAR.bat`). La app usa esta dirección por defecto (`apps/mobile/src/lib/api.ts`) y la despierta al abrir.

## Qué hace Render en cada despliegue

- **Build:** instala dependencias, compila `packages/finance-core`, genera el cliente de Prisma y compila la API.
- **Arranque:** `prisma migrate deploy` (usa la conexión directa de Neon aunque se pegue la agrupada), seed idempotente de categorías y configuración (`ALLOW_PROD_SEED=true`) y `node dist/server.js`.
- Cada `git push` a `main` vuelve a desplegar.
- `JWT_ACCESS_SECRET` lo genera Render; nunca está en el repositorio.

## Limitaciones conocidas

- **Recuperar contraseña** no envía correo en producción hasta elegir proveedor de correo (pendiente del Documento Maestro v2).
- El plan gratis no es para producción comercial; es suficiente para pruebas y la sustentación.

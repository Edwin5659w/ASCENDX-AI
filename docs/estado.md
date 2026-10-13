# Estado del desarrollo

Este archivo distingue lo **terminado**, lo **en desarrollo** y lo **planificado**. Se actualiza con cada avance importante.

Última actualización: 2026-10-13

## Terminado

**Repositorio**
- Reinicio del repositorio; el proyecto anterior queda en la etiqueta `legacy-life-os`.
- Estructura `backend/`, `mobile/`, `docs/` e integración continua en GitHub Actions.

**Backend** (`backend/`)
- API Express 5 + TypeScript con configuración validada, helmet, CORS, límite de solicitudes y logs sin datos sensibles.
- Modelo de datos completo en Prisma (10 entidades del Documento Maestro + sesiones) y migración inicial.
- Motor de cálculos financieros: tasas E.A./M.V., cuota fija y amortización, proyección de ahorro, capacidad de ahorro, metas y comparación ahorro vs financiación.
- Autenticación propia: registro, inicio y cierre de sesión, refresh token rotativo con detección de reutilización.
- Cuenta: perfil, consentimientos de IA y OCR, eliminación de cuenta en cascada.
- Endpoint del simulador `POST /api/simulator/compare`.
- Pruebas: 36 unitarias + 15 de integración contra PostgreSQL.

**App móvil** (`mobile/`)
- Expo SDK 57 + Expo Router con rutas protegidas por sesión.
- Sistema visual (modo claro y oscuro) y componentes base.
- Bienvenida, registro (con autorización de datos) e inicio de sesión.
- Sesión segura: refresh token cifrado y renovación automática.
- Simulador ahorro vs financiación conectado al backend.
- Perfil con estado de consentimientos y cierre de sesión.

## En desarrollo (siguiente etapa)

- Categorías y movimientos (API + pantallas).
- Deudas.

## Planificado

- Panel financiero con datos reales y capacidad de ahorro.
- Metas múltiples con aportes y proyección.
- Guardar escenarios del simulador y tabla de amortización en la app.
- Recuperación de contraseña por correo.
- IA contextual desde el backend (analista, planificador, chat).
- OCR de recibos con revisión.
- Almacenamiento local SQLite y sincronización.
- Pruebas con usuarios e instrumento de evaluación.

## Verificado en esta etapa

- `backend`: `npm run typecheck`, `npm test`, `npm run test:int`, `npm run build` y arranque del servidor.
- `mobile`: `npm run typecheck`, `npm run lint`, exportación del bundle de Android y recorrido completo en vista previa web (registro → inicio → simulador → perfil).
- Pendiente: probar en un emulador o teléfono Android real.

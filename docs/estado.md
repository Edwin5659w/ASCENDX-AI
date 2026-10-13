# Estado del desarrollo

Referencia: **anteproyecto** (`Anteproyecto_ASCENDX_AI.docx`) y **Documento Maestro v2** (`docs/documento-maestro.md`).
Convención: *terminado* = implementado y probado; *parcial* = parte hecha; *planificado* = aún no existe. Solo lo terminado se presenta como resultado.

Última actualización: 2026-10-13 · Fase actual del cronograma: **Fase 2 — Fundamentos y pruebas técnicas** (sprints 3–4).

## Trazabilidad de requisitos funcionales (Anexo C)

| RF | Requisito | Prioridad | Estado | Dónde |
|---|---|---|---|---|
| RF-01 | Registro con correo, contraseña, nombre y mayoría de edad | P1 | Terminado | `POST /auth/register`, pantalla Registro |
| RF-02 | Iniciar y cerrar sesión; bloqueo 15 min tras 5 intentos | P1 | Terminado | `POST /auth/login`, `/auth/logout` |
| RF-03 | Recuperar contraseña con código al correo | P1 | Parcial | Flujo completo hecho; falta elegir el proveedor de correo (en desarrollo el código sale en la consola de la API) |
| RF-04 | Editar perfil y perfil financiero | P1 | Terminado | `PATCH /me/profile`, onboarding y Perfil |
| RF-05 | Eliminar cuenta y todos sus datos | P1 | Terminado | `DELETE /me`, pantalla Eliminar cuenta |
| RF-06 | Consentimientos separados de IA y OCR | P1 | Terminado | `PATCH /me/consents`, onboarding y Perfil |
| RF-07 | Crear, editar y borrar movimientos | P1 | Planificado | Fase 3 (reglas ya en `finance-core`) |
| RF-08 | Historial con filtros | P1 | Planificado | Fase 3 |
| RF-09 | Aviso de duplicados | P1 | Parcial | Regla `isPossibleDuplicate` en `finance-core`; falta API y pantalla |
| RF-10 | Categorías por defecto y personalizadas | P1 | Parcial | 15 categorías por defecto en el seed; falta API y pantalla |
| RF-11 | Registrar deudas | P1 | Planificado | Fase 3 (tabla `debts` lista) |
| RF-12 | Pagos de deuda que actualizan el saldo | P1 | Planificado | Fase 3 |
| RF-13 | Panel del mes | P1 | Parcial | Regla `monthlyIndicators` lista; el panel aún no tiene movimientos |
| RF-14 | Capacidad de ahorro y su base de cálculo | P1 | Parcial | Se muestra con base «perfil»; con movimientos llegará la base «historial» |
| RF-15 | Gastos por categoría y evolución 6 meses | P1 | Planificado | Fase 3 |
| RF-16 | Varias metas con valor, fecha y prioridad | P1 | Planificado | Fase 3 (tabla y reglas listas) |
| RF-17 | Aportes y retiros a metas | P1 | Parcial | Regla `applyGoalMovement` lista |
| RF-18 | Progreso y fecha proyectada | P1 | Parcial | Reglas `goalProgress` y `allocateGoals` listas |
| RF-19 | Metas en riesgo con sugerencias | P1 | Parcial | Regla `allocateGoals` lista |
| RF-20 | Simular ahorro, crédito y mixto | P1 | Terminado | `POST /simulator/compare`, pantalla Simulador |
| RF-21 | Convertir tasas EA ↔ MV | P1 | Terminado | `finance-core` (TC-03 verificado) |
| RF-22 | Guardar y consultar escenarios | P1 | Planificado | Fase 3 (tabla `credit_scenarios` lista) |
| RF-23 a RF-26 | Resumen, plan, chat e historial de IA | P1 | Planificado | Fase 4 |
| RF-27 | Datos en caché sin conexión | P1 | Planificado | Fase 3 |
| RF-28 a RF-34 | OCR, sin conexión, recurrentes, cuentas, gamificación, recordatorios, comparar escenarios | P2 | Planificado | Fases 4–5 |

## Requisitos no funcionales con evidencia

| RNF | Estado | Evidencia |
|---|---|---|
| RNF-01 Sin acceso entre usuarios | En curso | Pruebas de integración de cuenta; se ampliará a cada módulo nuevo |
| RNF-02 Argon2id, secretos en el servidor | Terminado | `apps/api/src/modules/auth/password.ts`; HTTPS se aplica al desplegar |
| RNF-03 100 solicitudes/min por usuario y 10 intentos de login por IP | Terminado | `apps/api/src/app.ts`, `auth.routes.ts` |
| RNF-09 Cobertura ≥ 90 % en `finance-core` | Terminado | 49 pruebas, ~99 % de cobertura (`npm run test:coverage`) |
| RNF-10 Logs sin datos sensibles | Terminado | Redacción en `apps/api/src/lib/logger.ts` |
| RNF-13 Español y formato $ 1.250.000 | Terminado | `formatCop` en la app y en `finance-core` |

## Casos de prueba del Anexo J

| Caso | Estado |
|---|---|
| TC-01 Correo ya registrado | Pasa (prueba de integración) |
| TC-02 Usuario A pide datos de B | Pendiente hasta tener movimientos (fase 3) |
| TC-03 Conversión EA = 26,82 % | Pasa (prueba unitaria) |
| TC-04 Cuota P = $5.000.000, 2 %, 24 meses | Pasa (prueba unitaria) |
| TC-05 Metas en riesgo | Pasa (prueba unitaria de `allocateGoals`) |
| TC-06 a TC-10 | Pendientes (fases 3 a 5) |

## Pendientes de decisión (sprint 1 del cronograma)

- Proveedor de correo transaccional (para RF-03 en producción).
- Proveedor de IA (comparar 2 en costo, calidad en español y política de datos).
- Alojamiento de la API y de PostgreSQL (Render, Railway o Fly.io; Neon o Supabase).
- Tasa de usura de referencia: se registra a mano en `app_settings` con su fecha de vigencia.
- Prueba técnica de ML Kit en un *development build* (puerta G2).

## Verificado en esta entrega

- `finance-core`: 49 pruebas unitarias (incluidos TC-03, TC-04 y TC-05). `api`: 4 pruebas unitarias y 22 de integración contra PostgreSQL. Tipos sin errores en todo el monorepo; lint de la app sin errores.
- Exportación del bundle de Android correcta.
- Recorrido en la vista previa web: registro con los tres consentimientos → onboarding (IA activada, perfil con $ 2.800.000 de ingreso y $ 1.650.000 de gastos fijos) → Inicio con capacidad de $ 1.150.000 y prudente de $ 920.000 → Perfil → Asistente → bloqueo tras 5 intentos → recuperación con código.
- Pendiente: probar en un teléfono Android real.

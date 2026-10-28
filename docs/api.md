# API REST — referencia

Base en la nube: `https://ascendx-api.onrender.com/api` · en desarrollo: `http://localhost:4000/api`. JSON en todas las respuestas. Los montos van en **pesos enteros**.

Errores con un único formato:

```json
{ "error": { "code": "VALIDATION_ERROR", "message": "Los datos enviados no son válidos", "details": [ { "path": "email", "message": "Escribe un correo válido" } ] } }
```

Rutas protegidas: cabecera `Authorization: Bearer <accessToken>`. Límite de 100 solicitudes por minuto por usuario (RNF-03).

## Autenticación

| Método | Ruta | Cuerpo | Respuesta |
|---|---|---|---|
| POST | `/auth/register` | `name`, `email`, `password`, `isAdult: true`, `acceptTerms: true`, `acceptDataPolicy: true`, `deviceName?` | 201 `{ user, accessToken, refreshToken }` |
| POST | `/auth/login` | `email`, `password`, `deviceName?` | 200 sesión · 401 `INVALID_CREDENTIALS` · 423 `ACCOUNT_LOCKED` |
| POST | `/auth/refresh` | `refreshToken` | 200 sesión nueva (el token anterior queda revocado) |
| POST | `/auth/logout` | `refreshToken` | 204 |
| POST | `/auth/password/forgot` | `email` | 202 (igual exista o no la cuenta) |
| POST | `/auth/password/reset` | `email`, `code` (6 dígitos), `newPassword` | 204 · 400 `INVALID_RESET_CODE` |

- Contraseñas con **Argon2id**; 8–72 caracteres con letras y números.
- Token de acceso JWT de 15 min; token de renovación de 30 días, rotativo, guardado como hash y ligado a un dispositivo. Reutilizar un token revocado cierra todas las sesiones.
- **Bloqueo:** 5 intentos fallidos seguidos bloquean la cuenta 15 min (RF-02). Además, 10 intentos por IP cada 15 min.
- **Recuperación:** código de 6 dígitos, válido 15 min, un solo uso, máximo 5 intentos; al cambiar la contraseña se cierran todas las sesiones. Mientras no haya proveedor de correo, en desarrollo el código aparece en la consola de la API.

## Cuenta (protegido)

| Método | Ruta | Cuerpo | Descripción |
|---|---|---|---|
| GET | `/me` | — | Usuario, consentimientos y perfil financiero |
| PATCH | `/me/profile` | `name?`, `estimatedIncome?`, `estimatedFixedExpenses?`, `payDay?` | RF-04 (montos ≥ 0) |
| PATCH | `/me/consents` | `ia?: boolean`, `ocr?: boolean` | RF-06 (autorizar o revocar por separado) |
| DELETE | `/me` | `password` | RF-05 (borra todo en cascada) |

`consents` devuelve, para `terminos`, `datos`, `ia` y `ocr`: `{ granted, version, grantedAt }`.

## Simulador (protegido)

`POST /simulator/compare` — RF-20. Calcula crédito hoy, ahorro y mixto con `@ascendx/finance-core`. No guarda nada.

| Campo | Tipo | Obligatorio |
|---|---|---|
| `price` | pesos | sí |
| `downPayment` | pesos (cuota inicial deseada) | no (0) |
| `currentSavings` | pesos | no (0) |
| `monthlySaving` | pesos | sí |
| `rate` | fracción (0.18 = 18 %) | sí, ≤ 100 % E.A. |
| `rateType` | `EA` \| `MV` | sí |
| `termMonths` | 1–360 | sí |
| `monthlyFees`, `oneTimeFees` | pesos | no (0) |
| `includeSchedule` | booleano | no |

Respuesta: `credit`, `saving`, `mixed` (o `null`), `warnings` (usura, cuota mayor al ahorro, cuota inicial faltante), `assumptions`, `disclaimer` y `engineVersion`.

### Escenarios guardados (RF-22, RF-34)

| Método | Ruta | Cuerpo | Descripción |
|---|---|---|---|
| POST | `/simulator/scenarios` | `name`, `goalId?`, `input` (mismos campos de `/simulator/compare`) | 201; guarda entradas, resultados y `engineVersion` |
| GET | `/simulator/scenarios` | — | Lista con el resumen de cada escenario |
| GET | `/simulator/scenarios/:id` | — | Escenario completo |
| DELETE | `/simulator/scenarios/:id` | — | 204 |

## Categorías (RF-10, protegido)

| Método | Ruta | Cuerpo | Descripción |
|---|---|---|---|
| GET | `/categories` | — | 15 por defecto + las propias |
| POST | `/categories` | `name`, `kind` (`ingreso` \| `gasto`), `icon?`, `color?` (#RRGGBB) | 201 · 409 si el nombre ya existe (reactiva una archivada) |
| PATCH | `/categories/:id` | `name?`, `icon?`, `color?` | Solo las propias |
| DELETE | `/categories/:id` | — | Se archiva si tiene movimientos |

## Movimientos (RF-07 a RF-09, protegido)

Tipos: `ingreso`, `gasto`, `pago_deuda`, `aporte_meta`, `retiro_meta`. Fechas `AAAA-MM-DD` (hora de Bogotá).

| Método | Ruta | Cuerpo / consulta | Descripción |
|---|---|---|---|
| POST | `/transactions` | `type`, `amount`, `date`, `categoryId?` (obligatoria en ingreso y gasto), `debtId?`, `goalId?`, `accountId?`, `description?`, `source?` (`manual` \| `ocr` \| `recurrente`), `clientOpId?`, `confirmDuplicate?`, `receipt?` (`merchant`, `date`, `total`) | 201 creado · 200 si el `clientOpId` ya existía (RNF-12) · 409 `POSSIBLE_DUPLICATE` (RF-09) · 403 `CONSENT_REQUIRED` si `source=ocr` sin autorización |
| GET | `/transactions` | `month?`, `from?`, `to?`, `type?`, `categoryId?`, `debtId?`, `goalId?`, `q?`, `limit?` (≤ 100), `cursor?` | `{ transactions, totals, count, nextCursor }` |
| GET | `/transactions/:id` | — | Un movimiento |
| PATCH | `/transactions/:id` | `amount?`, `date?`, `categoryId?`, `description?`, `accountId?` | Recalcula los efectos en deuda o meta |
| DELETE | `/transactions/:id` | — | 204; revierte el efecto en la deuda o la meta |

## Deudas (RF-11, RF-12, protegido)

| Método | Ruta | Cuerpo | Descripción |
|---|---|---|---|
| GET | `/debts` | — | Deudas con `percentPaid`, `effectiveAnnualRate` y `nextPaymentDate` |
| POST | `/debts` | `creditor`, `name?`, `originalAmount`, `balance?`, `rate?` (fracción), `rateType?` (`EA` \| `MV`), `installment?`, `termMonths?`, `paymentDay?` | 201; si hay tasa y plazo sin cuota, la cuota se calcula |
| GET | `/debts/:id` | — | Deuda con sus pagos |
| PATCH | `/debts/:id` | mismos campos | — |
| DELETE | `/debts/:id` | — | Borrado lógico |
| POST | `/debts/:id/payments` | `amount`, `date?`, `clientOpId?` | Separa intereses y capital; al llegar a 0 la deuda queda `pagada` |

## Metas (RF-16 a RF-19, protegido)

| Método | Ruta | Cuerpo | Descripción |
|---|---|---|---|
| GET | `/goals` | — | `{ goals, allocation, capacity }`: reparto de la capacidad prudente, estado (`en_curso`, `en_riesgo`…) y sugerencias |
| POST | `/goals` | `name`, `targetAmount`, `targetDate?`, `priority?`, `icon?`, `isEmergencyFund?`, `initialSavedAmount?` | 201; lo ya ahorrado no crea un movimiento |
| GET | `/goals/:id` | — | Meta con plan y aportes |
| PATCH | `/goals/:id` | `name?`, `targetAmount?`, `targetDate?`, `priority?`, `status?` (`activa` \| `pausada` \| `cancelada`), `isEmergencyFund?` | 409 si ya hay otro fondo de emergencia |
| DELETE | `/goals/:id` | — | Borrado lógico |
| POST | `/goals/:id/movements` | `kind` (`aporte` \| `retiro`), `amount`, `date?`, `description?`, `clientOpId?` | El ahorrado nunca queda negativo; al llegar al objetivo la meta queda `completada` |

## Panel (RF-13 a RF-15, protegido)

`GET /dashboard?month=AAAA-MM` — indicadores del mes, capacidad de ahorro (base `perfil` o `historial`), promedios, carga de deuda, fondo de emergencia, gastos por categoría, evolución de 6 meses, próximas cuotas, metas con su plan, `priorityGoal` y los 5 movimientos recientes. Antes de calcular crea los movimientos recurrentes vencidos.

## Asistente de IA (RF-23 a RF-26, protegido)

Requiere la autorización `ia` (403 `CONSENT_REQUIRED`). El contexto que recibe el modelo solo tiene totales y promedios: nunca nombre, correo, descripciones ni identificadores. Cada cifra de la respuesta se compara con ese contexto; si no coincide se reintenta una vez y luego se usa la explicación con reglas.

| Método | Ruta | Cuerpo | Respuesta |
|---|---|---|---|
| GET | `/ai/status` | — | `{ consent, external, provider, limits: { chat, analysis } }` |
| POST | `/ai/summary` | — | `{ answer: { resumen, recomendacion, pasos, alternativas, supuestos }, dataUsed, source, external, verification, generatedAt }` |
| POST | `/ai/plan` | `goalId?` | Igual que el resumen |
| POST | `/ai/chat` | `message` (2–500), `conversationId?` | `{ conversationId, message: { content, meta: { funcion, source, verification, dataUsed } }, remaining }` |
| GET | `/ai/conversations` | — | Últimas 30 conversaciones |
| GET | `/ai/conversations/:id` | — | Mensajes de una conversación |
| DELETE | `/ai/conversations` | — | 204; borra todo el historial (RF-26) |
| DELETE | `/ai/conversations/:id` | — | 204 |

Errores propios: 429 `AI_DAILY_LIMIT`, 504 `AI_TIMEOUT`, 503 si se alcanzó el tope mensual de tokens. Configuración: `docs/despliegue.md`.

## Cuentas (RF-31, protegido)

| Método | Ruta | Cuerpo | Descripción |
|---|---|---|---|
| GET | `/accounts` | — | `{ accounts, total }`; saldo = saldo inicial + movimientos asociados |
| POST | `/accounts` | `name`, `kind` (`efectivo` \| `banco` \| `billetera`), `initialBalance?` | 201 · 409 `ACCOUNT_EXISTS` |
| PATCH | `/accounts/:id` | `name?`, `kind?`, `initialBalance?` | — |
| DELETE | `/accounts/:id` | — | Se archiva; los movimientos se conservan |

## Movimientos recurrentes (RF-30, protegido)

| Método | Ruta | Cuerpo | Descripción |
|---|---|---|---|
| GET | `/recurring` | — | `{ rules, monthly: { income, expenses } }` |
| POST | `/recurring` | `type` (`ingreso` \| `gasto`), `amount`, `categoryId`, `frequency` (`semanal` \| `quincenal` \| `mensual`), `startDate`, `description?`, `accountId?` | 201 `{ rule, created }`; crea de una vez las fechas que ya llegaron |
| PATCH | `/recurring/:id` | `amount?`, `categoryId?`, `description?`, `accountId?`, `active?`, `nextDate?` | Al reanudar no crea las fechas que pasaron en pausa |
| DELETE | `/recurring/:id` | — | No borra los movimientos ya creados |
| POST | `/recurring/run` | — | `{ created }`; la app lo llama al abrirse |

Cada fecha usa un `client_op_id` determinista, así que dos ejecuciones a la vez no duplican. La quincena cae en el día ancla y 15 días después (p. ej. 15 y 30; en febrero, 28).

## Hábitos (RF-32, protegido)

`GET /habits` — `{ streak: { current, best, activeThisWeek }, achievements, earnedCount, newlyEarned }`. La racha cuenta semanas seguidas (lunes a domingo) con al menos un registro hecho por el usuario; los recurrentes automáticos no cuentan. Un logro ganado se conserva aunque cambien los datos.

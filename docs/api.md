# API REST — referencia

Base: `http://localhost:4000/api` (desarrollo). Todas las respuestas son JSON.

Errores con formato único:

```json
{ "error": { "code": "VALIDATION_ERROR", "message": "Los datos enviados no son válidos", "details": [ { "path": "email", "message": "Correo electrónico inválido" } ] } }
```

Rutas protegidas: cabecera `Authorization: Bearer <accessToken>`.

## Salud

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/health` | Estado del servicio |

## Autenticación

| Método | Ruta | Cuerpo | Respuesta |
|---|---|---|---|
| POST | `/auth/register` | `email`, `password`, `fullName`, `acceptPrivacyPolicy: true` | 201 `{ user, accessToken, refreshToken }` |
| POST | `/auth/login` | `email`, `password` | 200 `{ user, accessToken, refreshToken }` |
| POST | `/auth/refresh` | `refreshToken` | 200 sesión nueva (el token anterior queda revocado) |
| POST | `/auth/logout` | `refreshToken` | 204 |

- Token de acceso: JWT HS256, 15 minutos.
- Token de renovación: aleatorio, 30 días, rotativo. Si se reutiliza uno ya usado, se cierran todas las sesiones del usuario.
- Registro e inicio de sesión: máximo 10 intentos cada 15 minutos por IP.
- Contraseña: 8–72 caracteres, con al menos una letra y un número.

## Cuenta (protegido)

| Método | Ruta | Cuerpo | Descripción |
|---|---|---|---|
| GET | `/me` | — | Datos del usuario y consentimientos |
| PATCH | `/me/consents` | `ai?: boolean`, `ocr?: boolean` | Otorga o retira consentimientos |
| DELETE | `/me` | `password` | Elimina la cuenta y todos sus datos |

## Simulador (protegido)

`POST /simulator/compare` — compara ahorrar vs financiar. No guarda nada.

| Campo | Tipo | Obligatorio | Nota |
|---|---|---|---|
| `assetPrice` | número | sí | Precio del bien hoy |
| `downPayment` | número | no (0) | Cuota inicial |
| `interestRate` | número | sí | Fracción: 0.18 = 18 % |
| `rateType` | `EFFECTIVE_ANNUAL` \| `MONTHLY` | sí | E.A. o M.V. |
| `termMonths` | entero 1–360 | sí | Plazo del crédito |
| `monthlyFees` | número | no (0) | Seguros y cargos mensuales |
| `monthlySavingAmount` | número | sí | Ahorro mensual posible |
| `currentSavings` | número | no (0) | Ahorro ya disponible |
| `annualPriceIncrease` | número | no (0) | Aumento anual del precio del bien |
| `monthlyIncome` | número | no | Para calcular qué parte del ingreso se va en la cuota |
| `includeSchedule` | booleano | no (false) | Incluir tabla de amortización |

Respuesta: `financing` (cuota, intereses, costo total, meses hasta tener el bien), `saving` (meses para ahorrar, precio al comprar), `difference`, `assumptions`, `warnings` y `disclaimer`.

# API REST — referencia

Base en desarrollo: `http://localhost:4000/api`. JSON en todas las respuestas. Los montos van en **pesos enteros**.

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

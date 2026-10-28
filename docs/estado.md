# Estado del desarrollo

Referencia: **anteproyecto** (`Anteproyecto_ASCENDX_AI.docx`) y **Documento Maestro v2** (`docs/documento-maestro.md`).
Convención: *terminado* = implementado y probado; *parcial* = parte hecha; *planificado* = aún no existe. Solo lo terminado se presenta como resultado.

Última actualización: 2026-10-27 · **Desarrollo funcional completo (fases 1 a 5).** Sigue la validación: pruebas en teléfonos Android reales, prueba con usuarios (SUS) y medición de desempeño.

## Resumen

| Prioridad | Total | Terminado | Parcial | Planificado |
|---|---|---|---|---|
| P1 | 27 | 26 | 1 (RF-03, falta proveedor de correo) | 0 |
| P2 | 7 | 7 | 0 | 0 |

Las funciones que dependen del teléfono (cámara con ML Kit y recordatorios) están implementadas, pero solo se pueden probar en la app de Android compilada con EAS; en la vista web se ofrece pegar el texto del recibo y la configuración de recordatorios.

## Trazabilidad de requisitos funcionales (Anexo C)

| RF | Requisito | Prioridad | Estado | Dónde |
|---|---|---|---|---|
| RF-01 | Registro con correo, contraseña, nombre y mayoría de edad | P1 | Terminado | `POST /auth/register`, pantalla Registro |
| RF-02 | Iniciar y cerrar sesión; bloqueo 15 min tras 5 intentos | P1 | Terminado | `POST /auth/login`, `/auth/logout` |
| RF-03 | Recuperar contraseña con código al correo | P1 | Parcial | Flujo completo hecho; falta el proveedor de correo (en desarrollo el código sale en la consola de la API) |
| RF-04 | Editar perfil y perfil financiero | P1 | Terminado | `PATCH /me/profile`, onboarding y Perfil |
| RF-05 | Eliminar cuenta y todos sus datos | P1 | Terminado | `DELETE /me`, pantalla Eliminar cuenta |
| RF-06 | Consentimientos separados de IA y OCR | P1 | Terminado | `PATCH /me/consents`; la IA y el OCR responden 403 `CONSENT_REQUIRED` sin autorización |
| RF-07 | Crear, editar y borrar movimientos | P1 | Terminado | `/transactions`, pantalla Nuevo movimiento |
| RF-08 | Historial con filtros | P1 | Terminado | `GET /transactions` (mes, fechas, tipo, categoría, deuda, meta, texto, paginación), pestaña Movimientos |
| RF-09 | Aviso de duplicados | P1 | Terminado | 409 `POSSIBLE_DUPLICATE` y tarjeta de confirmación |
| RF-10 | Categorías por defecto y personalizadas | P1 | Terminado | `/categories`, pantalla Categorías (las usadas se archivan) |
| RF-11 | Registrar deudas | P1 | Terminado | `/debts`; si se conoce tasa y plazo, la cuota se calcula con sistema francés |
| RF-12 | Pagos de deuda que actualizan el saldo | P1 | Terminado | `POST /debts/:id/payments`; separa intereses y capital; al borrar el pago se revierte |
| RF-13 | Panel del mes | P1 | Terminado | `GET /dashboard`, pestaña Inicio |
| RF-14 | Capacidad de ahorro y su base de cálculo | P1 | Terminado | Base «perfil» o «historial» (meses completos), con margen prudente |
| RF-15 | Gastos por categoría y evolución 6 meses | P1 | Terminado | Barras por categoría y gráfico de 6 meses en Inicio |
| RF-16 | Varias metas con valor, fecha y prioridad | P1 | Terminado | `/goals`, pestaña Metas; un solo fondo de emergencia |
| RF-17 | Aportes y retiros a metas | P1 | Terminado | `POST /goals/:id/movements`; el ahorrado nunca queda negativo |
| RF-18 | Progreso y fecha proyectada | P1 | Terminado | Detalle de meta con el aporte asignado por el reparto |
| RF-19 | Metas en riesgo con sugerencias | P1 | Terminado | Estado «en riesgo» con fecha alcanzable y aporte necesario |
| RF-20 | Simular ahorro, crédito y mixto | P1 | Terminado | `POST /simulator/compare`, pantalla Simulador |
| RF-21 | Convertir tasas EA ↔ MV | P1 | Terminado | `finance-core` (TC-03) |
| RF-22 | Guardar y consultar escenarios | P1 | Terminado | `/simulator/scenarios` (guarda entradas, resultados y versión del motor) |
| RF-23 | Resumen financiero explicado por la IA | P1 | Terminado | `POST /ai/summary`, Asistente → Diagnóstico |
| RF-24 | Plan de acción con la IA | P1 | Terminado | `POST /ai/plan` (opcionalmente para una meta), Asistente → Plan |
| RF-25 | Chat con límite diario | P1 | Terminado | `POST /ai/chat`; 429 `AI_DAILY_LIMIT` al superar el límite |
| RF-26 | Borrar el historial de conversaciones | P1 | Terminado | `DELETE /ai/conversations`, botón «Borrar historial» |
| RF-27 | Datos en caché sin conexión | P1 | Terminado | Las consultas principales se guardan en el teléfono; aviso «Sin conexión» con la fecha; la app abre sin red con la última copia |
| RF-28 | Escanear un recibo y revisar los campos | P2 | Terminado | Cámara/galería + ML Kit en el dispositivo; total, fecha y comercio con nivel de confianza; se confirma en el formulario |
| RF-29 | Crear movimientos sin conexión y sincronizar | P2 | Terminado | Cola local con `client_op_id`; se envía al volver la red; posibles duplicados quedan para revisión (pantalla Pendientes) |
| RF-30 | Movimientos recurrentes | P2 | Terminado | `/recurring` semanal, quincenal o mensual; se crean al abrir la app, una sola vez |
| RF-31 | Cuentas (efectivo, banco, billetera) | P2 | Terminado | `/accounts`; saldo calculado; se eligen en el formulario de movimiento |
| RF-32 | Hitos, racha semanal e insignias | P2 | Terminado | `GET /habits`, pantalla Logros y racha en Inicio; solo premian registrar, ahorrar y cumplir |
| RF-33 | Recordatorios locales | P2 | Terminado | Diario, día antes de cada pago de deuda y día de pago (expo-notifications, sin servidor) |
| RF-34 | Comparar dos escenarios lado a lado | P2 | Terminado | Pantalla Escenarios guardados |

## Requisitos no funcionales con evidencia

| RNF | Estado | Evidencia |
|---|---|---|
| RNF-01 Sin acceso entre usuarios | Terminado | Pruebas de acceso cruzado en movimientos, deudas, metas, escenarios, conversaciones y cuentas (TC-02) |
| RNF-02 Argon2id, secretos en el servidor, HTTPS | Terminado | `password.ts`; claves de IA solo en Render; HTTPS de Render |
| RNF-03 Límites de solicitudes | Terminado | `app.ts`, `auth.routes.ts` |
| RNF-04 95 % < 1 s con 1.000 movimientos | Planificado | Prueba de carga pendiente |
| RNF-05 IA < 15 s o cancelable | Parcial | Tiempo máximo de 15 s (`AI_TIMEOUT_MS`) con respuesta de reglas como respaldo; falta medir con el banco de 30 preguntas |
| RNF-06 Android 8+ en dos teléfonos | Planificado | Pendiente compilar con EAS y probar |
| RNF-07 SUS ≥ 68 | Planificado | Prueba con 10–15 participantes |
| RNF-08 Accesibilidad | Parcial | Áreas táctiles de 48 dp, etiquetas accesibles y modo oscuro/claro; falta la lista de chequeo completa |
| RNF-09 Cobertura | Terminado en el motor | `finance-core`: 77 pruebas, 97 % de instrucciones y 100 % de funciones |
| RNF-10 Logs sin datos sensibles | Terminado | Redacción en `logger.ts` (incluye claves de IA) |
| RNF-11 Límite diario de IA y tope mensual | Terminado | Límites en `app_settings`, registro de tokens en `ai_usage`, 503 al llegar al tope mensual |
| RNF-12 Idempotencia | Terminado | `client_op_id` en movimientos, cola sin conexión y recurrentes (identificador determinista por fecha) |
| RNF-13 Español y formato $ 1.250.000 | Terminado | `formatCop` en la app y en `finance-core` |

## Casos de prueba del Anexo J

| Caso | Resultado | Prueba |
|---|---|---|
| TC-01 Correo ya registrado | Pasa | `auth.int.test.ts` |
| TC-02 Usuario A pide datos de B | Pasa | `finance.int.test.ts`, `ai.int.test.ts`, `habits.int.test.ts` |
| TC-03 2 % MV = 26,82 % EA | Pasa | Prueba unitaria |
| TC-04 Cuota de $ 5.000.000 al 2 % en 24 meses | Pasa | Prueba unitaria |
| TC-05 Metas en riesgo | Pasa | Unitaria e integración |
| TC-06 Pago igual al saldo → deuda pagada | Pasa | «marca la deuda como pagada cuando el saldo llega a 0» |
| TC-07 IA: flujo neto igual al del panel | Pasa | `ai.int.test.ts` |
| TC-08 IA: pregunta fuera de finanzas → rechazo cortés | Pasa | `ai.int.test.ts` |
| TC-09 OCR de recibo legible | Pasa con texto; falta con fotos reales | El intérprete de recibos (`parseReceiptText`) pasa sus pruebas; la foto con ML Kit se probará en la app de Android |
| TC-10 Mismo lote enviado dos veces | Pasa | «un reintento con el mismo client_op_id no duplica» y recurrentes sin duplicar |

## Decisiones vigentes

- **IA:** por defecto «reglas» (`AI_PROVIDER=local`), sin enviar datos a terceros. Se puede activar Anthropic o un proveedor compatible con OpenAI desde Render; cada cifra se verifica contra el contexto, con un reintento y respaldo de reglas.
- **Alojamiento:** Render (API) y Neon (PostgreSQL), ver `docs/despliegue.md`.
- **OCR:** ML Kit en el dispositivo; la imagen no sale del teléfono y no se guarda.

## Pendientes

- Proveedor de correo transaccional (RF-03 en producción).
- Compilar la app de Android con EAS y probar en dos teléfonos (RNF-06, TC-09 con fotos, recordatorios).
- Prueba de carga (RNF-04), banco de 30 preguntas para la IA (RNF-05) y prueba de usabilidad SUS (RNF-07).
- Lista de chequeo de accesibilidad (RNF-08).

## Verificado en esta entrega

- `finance-core`: 77 pruebas unitarias. `api`: 4 pruebas unitarias y 52 de integración contra PostgreSQL. Tipos y lint sin errores en todo el monorepo.
- Recorrido en la vista web con datos de demostración: Inicio, Movimientos, Metas, Deudas, Simulador y escenarios, Asistente (diagnóstico, plan y chat), Escanear recibo (texto pegado → formulario), Cuentas, Recurrentes, Logros, Recordatorios y registro sin conexión que se sincroniza al volver la red.
- API desplegada en Render con las migraciones aplicadas en Neon.

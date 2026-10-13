# ASCENDX AI — Documento Maestro v2

> Copia en el repositorio del Documento Maestro v2 (12 de octubre de 2026, Edwin Molina), guardado en el proyecto de Claude como `ASCENDX_AI_Documento_Maestro_v2`. Es la **referencia principal** para programar: si el código y este documento se contradicen, se corrige el código o se registra el cambio en [`decisiones.md`](decisiones.md).

## 0. Estado del documento

Esta versión 2 cierra las decisiones que la v1 dejó abiertas y es la referencia para el anteproyecto y para programar. El estado real de cada función se lleva en [`estado.md`](estado.md).

- **Convención de estados:** cada función se marca como *planificado*, *en desarrollo* o *terminado*. Solo lo terminado y probado se presenta como resultado.
- **Prioridades:** P1 = obligatorio para el MVP; P2 = dentro del alcance académico, se implementa después del núcleo; P3 = trabajo futuro, no se promete.
- **Supuestos:** equipo de 1 o 2 personas, usuarios en Colombia, moneda COP, idioma español.

## 1. Resumen, problema y propuesta de valor

ASCENDX AI es una app Android que convierte los ingresos, gastos y deudas de una persona en un plan concreto para alcanzar varias metas, y le muestra con números verificables si le conviene ahorrar o financiar una compra.

**Problema.** Muchas personas registran gastos (o no registran nada) pero no saben cuánto pueden ahorrar de verdad, cuánto tardarán en alcanzar una meta ni cuánto les cuesta realmente un crédito. Las tasas se expresan de formas distintas (efectiva anual, mensual vencida) y el costo total de financiar suele quedar oculto detrás de la cuota.

**Propuesta de valor.**

1. Capacidad de ahorro calculada con reglas explícitas, no adivinada.
2. Metas múltiples con reparto del ahorro según prioridad y fecha, y aviso cuando una meta no es alcanzable.
3. Simulador ahorro vs. financiación que muestra el costo total y los intereses, explicado por una IA que solo usa cifras del sistema.

## 2. Objetivos

**General.** Desarrollar una aplicación móvil Android de planificación financiera personal que integre registro de movimientos y deudas, metas múltiples, simulación de ahorro frente a financiación, lectura asistida de recibos mediante OCR e inteligencia artificial contextual, validada con un grupo de usuarios de prueba.

**Específicos.**

1. Especificar requisitos, arquitectura y modelo de datos. *Entregable: documento de requisitos y diseño.*
2. Implementar registro y consulta de ingresos, gastos, categorías y deudas con autenticación y autorización por usuario. *Entregable: módulos y pruebas de acceso entre usuarios.*
3. Implementar un motor de cálculo determinista para capacidad de ahorro, metas múltiples y simulación de financiación. *Entregable: biblioteca de cálculo con pruebas unitarias.*
4. Integrar un asistente de IA que explique la situación y los escenarios usando solo datos calculados. *Entregable: asistente con banco de pruebas.*
5. Incorporar OCR de recibos con revisión obligatoria. *Entregable: flujo de escaneo y medición de precisión.*
6. Evaluar usabilidad y utilidad percibida con un instrumento estandarizado. *Entregable: informe de resultados.*

## 3. Usuarios, alcance y límites

Usuario objetivo: persona mayor de 18 años en Colombia, con ingresos propios, que quiere ordenar sus finanzas y alcanzar una compra o meta concreta. Perfiles de prueba: estudiante que trabaja, empleado joven, independiente.

**Dentro del alcance:** Android, español, COP, un usuario por cuenta, registro manual y por OCR, metas, deudas, simulador, IA y caché sin conexión limitada.

**Fuera del alcance:** iOS y web; conexión con bancos; varias monedas; cuentas compartidas; inversiones; extractos y contratos; ofertas reales de crédito; suscripciones.

**Límites de responsabilidad:** herramienta educativa y de apoyo a la decisión; no es asesoría financiera profesional; no garantiza créditos ni rendimientos; toda simulación muestra sus supuestos.

## 4. Decisiones cerradas

| Tema | Decisión |
| --- | --- |
| Autenticación | Propia: correo + contraseña, hash Argon2id (o bcrypt), token de acceso de 15 min y de renovación de 30 días con rotación, guardado en SecureStore |
| Recuperación de acceso | Código de 6 dígitos por correo, válido 15 min, máximo 5 intentos |
| Alojamiento | PaaS gratuito o de bajo costo (Render, Railway, Fly.io) y PostgreSQL administrado (Neon o Supabase) — a verificar |
| Proveedor de IA | Capa `AiProvider` intercambiable; se comparan 2 proveedores en el sprint 1 |
| Sin conexión | La nube es la fuente de verdad. Sin conexión: caché de lectura y cola de movimientos nuevos |
| Moneda e idioma | Solo COP y español |
| Dinero en la base de datos | Enteros en pesos (`BIGINT`); `DECIMAL(9,6)` para tasas. Nunca `float` |
| Android mínimo | Android 8.0 (API 26) o el mínimo de la versión de Expo, lo que sea mayor |
| Estructura del código | Monorepo: `apps/mobile`, `apps/api` y `packages/finance-core` |
| Edad mínima | 18 años, declarada en el registro |

## 5. Funcionalidades por prioridad

Si el tiempo no alcanza, se recorta de abajo hacia arriba: primero P3, luego P2.

| Módulo | P1 — MVP | P2 — académico | P3 — futuro |
| --- | --- | --- | --- |
| Cuenta | Registro, sesión, recuperación de contraseña, perfil, eliminar cuenta | Cambio de correo | Inicio con Google |
| Onboarding | Consentimientos, perfil financiero inicial | Recorrido guiado | — |
| Movimientos | Crear, editar, borrar, filtrar; categorías; detección de duplicados | Recurrentes; cuentas | Exportar CSV |
| Deudas | Registrar deuda, tasa, cuota, plazo; pagos; saldo | Tabla de amortización por deuda | Bola de nieve / avalancha |
| Panel | Resumen del mes, flujo neto, capacidad de ahorro, gráfico por categoría, evolución 6 meses | Carga de deuda | Presupuestos por categoría |
| Metas | Varias metas con prioridad, aportes, retiros, progreso, fecha proyectada, alerta de meta inalcanzable | Sugerencias automáticas | Metas compartidas |
| Simulador | Ahorro vs. crédito vs. mixto, conversión de tasas, cuota, intereses, total, guardar escenario | Comparar 2 escenarios; aviso de usura | Inflación del precio |
| IA | Resumen explicado, plan de acción, chat con contexto controlado | Explicar escenario guardado | Notificaciones proactivas |
| OCR | — | Escanear recibo y revisar | QR de factura DIAN |
| Sin conexión | Caché de lectura | Cola de movimientos | Edición completa |
| Gamificación | Progreso e hitos de metas (25/50/75/100 %) | Racha semanal, insignias | Niveles y retos |
| Recordatorios | — | Recordatorio local | Push desde servidor |

## 6. Reglas financieras y fórmulas

Viven en `packages/finance-core` como funciones puras con pruebas. La IA nunca calcula.

### 6.1 Tipos de movimiento

| Tipo | Ejemplo | Saldo | ¿Es gasto? |
| --- | --- | --- | --- |
| `ingreso` | Salario | Suma | No |
| `gasto` | Mercado | Resta | Sí |
| `pago_deuda` | Cuota de tarjeta | Resta y reduce la deuda vinculada | No (servicio de deuda) |
| `aporte_meta` | Ahorro para la moto | Resta del disponible y suma a la meta | No |
| `retiro_meta` | Usar ahorro de la meta | Suma al disponible y resta de la meta | No |

### 6.2 Indicadores del mes

```
Flujo neto_m  = I_m − G_m − PD_m
Disponible_m  = Flujo neto_m − AM_m        (AM = aportes netos a metas)
```

- **Capacidad de ahorro (CA):** promedio del flujo neto de los últimos 3 meses completos. Con menos de 1 mes: perfil (ingreso estimado − gastos fijos estimados − cuotas de deudas). Con 1 o 2 meses: se promedia lo disponible y se marca «estimación con pocos datos».
- **Capacidad prudente (CP):** 0,8 × CA (margen configurable). Si CA ≤ 0, no se proponen aportes y se muestra una alerta.
- **Carga de deuda:** cuotas mensuales ÷ ingreso mensual promedio. < 30 % verde, 30–40 % amarillo, > 40 % rojo («referencia educativa, no diagnóstico»).
- **Fondo de emergencia:** meses cubiertos = saldo de la meta de emergencia ÷ gasto mensual promedio.

### 6.3 Metas múltiples

Faltante F = objetivo − ahorrado; n = meses hasta la fecha deseada; aporte requerido = ⌈F ÷ n⌉.

1. Si la suma de aportes requeridos ≤ CP, todas están en curso.
2. Si no, se reparte CP por prioridad (alta, media, baja) y, dentro de cada prioridad, por fecha más cercana.
3. Las metas sin su aporte requerido quedan «en riesgo» con dos sugerencias: fecha alcanzable con el aporte asignado, o aporte necesario para mantener la fecha.
4. Fecha proyectada = hoy + ⌈F ÷ aporte asignado⌉ meses.

### 6.4 Simulador

```
i_m = (1 + EA)^(1/12) − 1
C   = P · i_m / (1 − (1 + i_m)^(−n))
```

- Total pagado = cuota inicial + C × n + cargos mensuales × n + cargos únicos.
- Intereses = C × n − P. Costo extra = total pagado − precio.
- Ahorro: meses = ⌈(precio − ahorro actual) ÷ aporte mensual⌉.
- Mixto: ahorrar k meses para la cuota inicial y financiar el resto.
- Validaciones: tasa 0–100 % EA, plazo 1–360 meses, montos positivos. Aviso si la tasa supera la tasa de usura de referencia (con su fecha).
- Aviso fijo: «Simulación aproximada. No es una oferta ni una aprobación de crédito; la entidad puede aplicar otros cargos.»

### 6.5 Redondeo y fechas

Resultados redondeados al peso. Meses en zona horaria America/Bogota. Un mes «completo» es un mes calendario terminado.

## 7. Requisitos funcionales

| ID | Requisito | Criterio de aceptación | P |
| --- | --- | --- | --- |
| RF-01 | Registrar cuenta con correo, contraseña, nombre y mayoría de edad | Rechaza correo repetido y contraseña < 8; exige términos y tratamiento de datos | P1 |
| RF-02 | Iniciar y cerrar sesión | 5 intentos fallidos bloquean 15 min; cerrar sesión invalida el token de renovación | P1 |
| RF-03 | Recuperar contraseña por código | Caduca en 15 min y sirve una sola vez | P1 |
| RF-04 | Editar perfil y perfil financiero | Montos ≥ 0 | P1 |
| RF-05 | Eliminar cuenta y datos | No queda ningún registro del usuario | P1 |
| RF-06 | Consentimientos de IA y OCR separados | Sin consentimiento la función se bloquea con explicación | P1 |
| RF-07 | Crear, editar y borrar movimientos | Monto > 0, fecha no futura a más de 1 día, tipo y categoría obligatorios | P1 |
| RF-08 | Historial con filtros | Paginado; totales del filtro | P1 |
| RF-09 | Aviso de duplicado | Mismo monto, tipo y categoría en < 2 min pide confirmación | P1 |
| RF-10 | Categorías | Por defecto; con movimientos se archiva, no se borra | P1 |
| RF-11 | Registrar deudas | Acreedor, monto, saldo, tasa EA/MV, cuota, plazo, día de pago | P1 |
| RF-12 | Pagos de deuda | Crea `pago_deuda` y reduce el saldo; en 0 pasa a «pagada» | P1 |
| RF-13 | Panel del mes | Ingresos, gastos, pagos de deuda, flujo neto y disponible (6.2) | P1 |
| RF-14 | Capacidad de ahorro | Indica la base del cálculo y si son pocos datos | P1 |
| RF-15 | Gastos por categoría y 6 meses | Gráficos con cifras accesibles | P1 |
| RF-16 | Varias metas | Nombre, objetivo, fecha, prioridad, ahorro inicial, ícono | P1 |
| RF-17 | Aportes y retiros | Un retiro no deja la meta en negativo | P1 |
| RF-18 | Progreso y fecha proyectada | Según 6.3 | P1 |
| RF-19 | Metas en riesgo | Muestra las dos sugerencias | P1 |
| RF-20 | Simular ahorro, crédito y mixto | Reproducible; supuestos y aviso | P1 |
| RF-21 | Convertir EA ↔ MV | Error < 0,0001 % | P1 |
| RF-22 | Guardar escenarios | Entradas y resultados con fecha | P1 |
| RF-23 | Resumen por IA | Todas las cifras existen en el contexto | P1 |
| RF-24 | Plan de acción por IA | 3 a 5 acciones concretas | P1 |
| RF-25 | Chat con IA | Límite diario; rechaza temas fuera de finanzas personales | P1 |
| RF-26 | Borrar historial de chat | Desaparece del servidor | P1 |
| RF-27 | Caché sin conexión | Muestra la fecha de actualización | P1 |
| RF-28 | Escanear recibo | Campos editables; nada se guarda sin confirmar | P2 |
| RF-29 | Movimientos sin conexión | Sin duplicados al sincronizar | P2 |
| RF-30 | Recurrentes | Se propone el día programado | P2 |
| RF-31 | Cuentas | Saldo por cuenta | P2 |
| RF-32 | Hitos, racha, insignias | Nunca por endeudarse | P2 |
| RF-33 | Recordatorios locales | Activar, desactivar, hora | P2 |
| RF-34 | Comparar dos escenarios | Diferencias de total y tiempo | P2 |

## 8. Requisitos no funcionales

| ID | Atributo | Requisito |
| --- | --- | --- |
| RNF-01 | Seguridad | Ningún endpoint devuelve datos de otro usuario (pruebas de acceso cruzado) |
| RNF-02 | Seguridad | Argon2id o bcrypt; secretos en variables de entorno; HTTPS |
| RNF-03 | Seguridad | 100 solicitudes/min por usuario; 10 intentos de login por IP cada 15 min |
| RNF-04 | Rendimiento | 95 % de solicitudes sin IA < 1 s con 1.000 movimientos |
| RNF-05 | Rendimiento | IA < 15 s o mensaje de espera y cancelar |
| RNF-06 | Compatibilidad | Android 8.0+, probado en 2 teléfonos físicos |
| RNF-07 | Usabilidad | SUS ≥ 68; tareas completadas por ≥ 80 % |
| RNF-08 | Accesibilidad | Contraste 4,5:1, áreas táctiles 48 dp, respeta tamaño de fuente |
| RNF-09 | Mantenibilidad | Cobertura ≥ 90 % en `finance-core` y ≥ 60 % en la API; TypeScript estricto; linter sin errores |
| RNF-10 | Privacidad | Logs sin contraseñas, tokens, montos ni texto de recibos |
| RNF-11 | Costo | Tope mensual de IA; 20 mensajes de chat y 5 resúmenes por usuario al día |
| RNF-12 | Fiabilidad | Un movimiento enviado dos veces con el mismo identificador se guarda una vez |
| RNF-13 | Idioma | Español de Colombia; montos con formato $ 1.250.000 |

## 9. Arquitectura y stack

La app nunca llama directamente a la IA ni a la base de datos; todo pasa por la API.

| Capa | Tecnología |
| --- | --- |
| App | React Native + Expo (development build con EAS) + TypeScript |
| Navegación | Expo Router |
| Estado y datos remotos | TanStack Query + Zustand |
| Formularios | React Hook Form + Zod (esquemas compartidos) |
| Gráficos | A elegir en el sprint 1 |
| Local | expo-sqlite + expo-secure-store |
| API | Node.js LTS + Express + TypeScript (rutas → controlador → servicio → repositorio) |
| Datos | PostgreSQL + Prisma |
| Pruebas | Jest o Vitest, Supertest, React Native Testing Library |

## 10. Modelo de datos v2

Todas las tablas de usuario llevan `id` UUID, `user_id`, `created_at`, `updated_at` y, donde aplica, `deleted_at`.

| Entidad | Campos clave | P |
| --- | --- | --- |
| users | email, password_hash, name, is_adult, email_verified_at | P1 |
| sessions | refresh_token_hash, device_name, expires_at, revoked_at | P1 |
| password_resets | code_hash, expires_at, attempts, used_at | P1 |
| consents | type (terminos, datos, ia, ocr), version, granted_at, revoked_at | P1 |
| financial_profiles | estimated_income, estimated_fixed_expenses, pay_day, safety_margin (0,8) | P1 |
| categories | name, kind, icon, color, is_default, archived_at | P1 |
| transactions | type (6.1), amount BIGINT, date, category_id, description, debt_id?, goal_id?, account_id?, source, client_op_id | P1 |
| debts | creditor, original_amount, balance, rate, rate_type, installment, term_months, payment_day, status | P1 |
| financial_goals | name, target_amount, saved_amount, target_date, priority, icon, status | P1 |
| goal_contributions | goal_id, transaction_id, amount (+ aporte, − retiro) | P1 |
| credit_scenarios | inputs JSON, results JSON, engine_version | P1 |
| ai_conversations / ai_messages | title; role, content, tokens | P1 |
| receipts | merchant, date, total, status, transaction_id? — sin imagen | P2 |
| accounts | name, kind, initial_balance | P2 |
| recurring_transactions | plantilla, frequency, next_date, active | P2 |
| user_achievements | achievement_code, earned_at, metadata | P2 |
| app_settings (global) | usury_rate_reference, usury_rate_date, ai_daily_limits | P1 |

Reglas: toda consulta filtra por el `user_id` del token; `saved_amount` y `balance` se recalculan en la misma transacción que crea el movimiento; `client_op_id` único por usuario; borrar la cuenta borra todo en cascada.

## 11. Inteligencia artificial

Tres modos (resumen explicado, plan de acción, chat). Flujo: verificar consentimiento y límite → contexto agregado sin datos identificables → herramientas de solo lectura (`obtener_resumen`, `obtener_metas`, `simular_credito`) → verificador de cifras → guardar mensaje y tokens. Límites: 20 mensajes y 5 resúmenes por día; historial 30 días. Evaluación: banco de 30 preguntas con rúbrica; 100 % sin cifras inventadas y ≥ 85 % de aprobación.

## 12. OCR de recibos

Google ML Kit Text Recognition en el teléfono; la imagen no sale del dispositivo. Analizador de campos en `finance-core`. Requiere development build de Expo: prueba técnica en el sprint 2; plan B con Tesseract en la API. Meta: total correcto ≥ 80 %, fecha ≥ 70 % en 30 recibos.

## 13. Sincronización sin conexión

La nube es la fuente de verdad. Sin conexión: lectura de la última versión y creación de movimientos en cola (`client_op_id`), enviados a `POST /sync/transactions` de forma idempotente. Pruebas: modo avión, doble envío, corte a mitad.

## 14. Seguridad, privacidad y legal

Controles: autenticación (sección 4), autorización por `user_id`, Zod, Helmet, CORS, límites, logs sin datos sensibles, `npm audit` en CI, copias de seguridad. Ley 1581 de 2012: política de tratamiento publicada, autorización previa versionada en `consents`, consentimientos separados de IA y OCR, derechos del titular desde la app, minimización de datos. Documentos a redactar: términos, política de privacidad, consentimiento para pruebas de usabilidad.

## 15. Diseño visual y gamificación

**Actualizada el 2026-10-13:** la dirección visual oficial está en [`docs/diseno.md`](diseno.md) (identidad de marca, paleta, panel, metas, mentor, accesibilidad y proceso obligatorio antes de rediseñar). Resumen:

- Concepto: fintech prémium + IA avanzada + progreso personal; «ascender mediante decisiones inteligentes». Lema: «Convierte potencial en progreso medible».
- Paleta: fondo `#0B1020`, superficies `#121A2B` y `#19243A`, esmeralda `#10B981`, menta `#6EE7B7`, violeta `#8B5CF6` (mentor), texto `#F8FAFC` / `#94A3B8`, bordes `#263449`, error `#F87171`, advertencia `#FBBF24`. Tema oscuro base y tema claro complementario.
- Tipografía Manrope con números tabulares; tarjetas de 16 dp; espaciado en múltiplos de 8.

**Pantallas del MVP (14):** bienvenida, registro, inicio de sesión, recuperar contraseña, consentimientos, perfil financiero inicial, panel, historial, nuevo movimiento, deudas, metas (lista y detalle), simulador, asistente IA, perfil y ajustes.

**Navegación inferior:** Inicio · Movimientos · (+) · Metas · Asistente. Simulador y deudas desde Inicio y Metas.

**Gamificación:** hitos al 25/50/75/100 % de una meta; racha semanal (una semana de pausa al mes no la rompe); insignias por primera meta, primer mes completo, fondo de emergencia de 1 mes, deuda pagada, primer escenario comparado. Nunca por tomar crédito, gastar más o abrir muchas metas.

## 16. Metodología y cronograma

Scrum adaptado: sprints de 2 semanas (16), backlog P1 → P2 → P3, revisión con el asesor al final de cada etapa. Definición de terminado: código revisado, pruebas pasando, criterio cumplido, documentado. Orden de recorte si el P1 no está en el mes 5: recordatorios, cuentas, recurrentes, gamificación P2, cola sin conexión y OCR.

## 17. Plan de pruebas

Unitarias (`finance-core` ≥ 90 %), integración con Supertest, seguridad (acceso cruzado), sincronización, IA (30 preguntas), OCR (30 recibos), interfaz, 2 dispositivos físicos y usabilidad con 10–15 personas (SUS ≥ 68).

## 18. DevOps, entornos y costos

Ramas `main`, `develop` y `feature/<historia>` con pull requests; GitHub Actions con lint, tipos, pruebas y `npm audit`; EAS Build (`development` y `preview` para el APK); despliegue automático de la API desde `main`; secretos fuera del repositorio.

## 19. Riesgos

Alcance (alto), compatibilidad de ML Kit con Expo, IA que inventa cifras, costo de IA, errores en fórmulas, fuga de datos entre usuarios, duplicados al sincronizar, hosting gratuito insuficiente, pocos participantes, equipo de una persona. Cada uno con mitigación y puerta de control.

## 20. Título propuesto

«ASCENDX AI: aplicación móvil Android de planificación financiera personal con inteligencia artificial contextual y simulación de ahorro frente a financiación».

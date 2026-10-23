# Plan del proyecto

Define **qué** se va a construir, **qué no**, con qué reglas de trabajo y cómo se controlan los riesgos. Es la referencia para empezar el desarrollo.

## 1. Alcance

### Objetivo general

Desarrollar una aplicación móvil Android de planificación financiera personal que integre el registro de movimientos y deudas, la gestión de metas múltiples, la simulación de ahorro frente a financiación, la lectura asistida de recibos mediante OCR y un asistente de inteligencia artificial contextual, validada con un grupo de usuarios de prueba.

### Objetivos específicos

| Código | Objetivo | Entregable principal |
| --- | --- | --- |
| OE1 | Especificar requisitos, arquitectura y modelo de datos a partir de las necesidades de la población | Informe de diagnóstico, requisitos, arquitectura y prototipos |
| OE2 | Implementar ingresos, gastos, categorías y deudas con autenticación y autorización por usuario | Módulos de movimientos y deudas con pruebas |
| OE3 | Implementar un motor de cálculo determinista para ahorro, metas y financiación | Paquete `finance-core` con cobertura ≥ 90 % |
| OE4 | Integrar un asistente de IA que explique usando solo cifras del sistema | Asistente con informe de evaluación (30 preguntas) |
| OE5 | Incorporar OCR en el dispositivo con revisión obligatoria | Escáner de recibos con informe de precisión (30 recibos) |
| OE6 | Evaluar usabilidad y utilidad percibida con usuarios | Informe de usabilidad (SUS, tareas) |

### Dentro del alcance (MVP)

| Prioridad | Funciones |
| --- | --- |
| P1 — núcleo | Cuenta y seguridad, perfil financiero, consentimientos, movimientos, categorías, deudas, panel, capacidad de ahorro, metas múltiples, simulador, IA (resumen, plan y chat), caché sin conexión |
| P2 — si el núcleo está estable | OCR de recibos, registro sin conexión con sincronización, movimientos recurrentes, cuentas, gamificación, recordatorios, comparación de escenarios |

### Fuera del alcance

- Integraciones bancarias o con centrales de riesgo (DataCrédito u otras). Se deja como trabajo futuro opcional.
- Ofertas reales de crédito, inversiones, pagos o transferencias.
- Versión iOS y versión web para usuarios finales.
- Suscripciones y funciones de pago.

### Supuestos

- El director aprueba cada puerta en un plazo de una semana.
- Los planes gratuitos de Render y Neon se mantienen durante el proyecto.
- Se consiguen al menos 30 respuestas de encuesta y 10 participantes de prueba.

### Restricciones

- Un solo desarrollador, con unas 20 horas por semana (≈ 640 horas en total).
- Presupuesto estimado de $825.000.
- Cumplimiento de la Ley 1581 de 2012 (datos personales) y de la política de la universidad.

## 2. Entregables

| Fase | Entregable | Puerta |
| --- | --- | --- |
| 0. Planeación y documentación | Plan estratégico, plan del proyecto, EDT, requisitos, cronograma, normas (esta wiki) | G0 |
| 1. Definición y diseño | Encuesta y entrevistas analizadas, backlog priorizado, prototipos, arquitectura y modelo de datos aprobados | G1 |
| 2. Fundamentos | Base técnica desplegada; decisión documentada de proveedor de IA y prueba de ML Kit | G2 |
| 3. Núcleo financiero | Movimientos, deudas, panel, metas y simulador con pruebas | G3 |
| 4. IA y OCR | Asistente evaluado y escáner medido | G4 |
| 5. Integración y validación | Sincronización, seguridad revisada, informe de usabilidad | G5 |
| 6. Pulido y entrega | APK final, manuales, documento de grado y sustentación | G6 |

## 3. Forma de trabajo

- **Marco:** Scrum adaptado a una persona: sprints de dos semanas, backlog priorizado (P1, P2, P3), revisión al final de cada sprint y retrospectiva corta escrita en la wiki.
- **Ramas:** `main` (estable y desplegada) y `develop` (integración); una rama por historia; cambios a `main` solo con las pruebas en verde.
- **Definición de terminado:** la historia cumple sus criterios de aceptación, tiene pruebas automáticas, pasa lint y tipos, no expone datos sensibles en logs, está documentada y desplegada en `develop`.
- **Herramientas:** GitHub (código, wiki, issues y tablero), GitHub Actions (integración continua), Render y Neon (despliegue), Expo EAS (APK).

## 4. Gestión de riesgos

| ID | Riesgo | Probabilidad | Impacto | Respuesta |
| --- | --- | --- | --- | --- |
| R1 | El alcance crece y no se termina a tiempo | Alta | Alto | Congelar el MVP; orden de recorte: recordatorios, cuentas, recurrentes, gamificación, sin conexión, OCR |
| R2 | La IA inventa cifras o da consejos indebidos | Media | Alto | La IA no calcula; contexto verificado; banco de 30 preguntas con rúbrica antes de liberar |
| R3 | El OCR lee mal los recibos | Media | Medio | Revisión obligatoria del usuario; OCR es P2 |
| R4 | Fuga o cruce de datos entre usuarios | Baja | Muy alto | Autorización por usuario en cada consulta y pruebas de acceso cruzado |
| R5 | Los planes gratuitos cambian o se agotan | Media | Medio | Presupuesto de $150.000 para alojamiento; arquitectura portable (Node.js y PostgreSQL estándar, sin servicios propietarios) |
| R6 | Costos de IA mayores a lo previsto | Media | Medio | Límite diario por usuario y tope mensual de gasto |
| R7 | Pocos participantes para la encuesta o la prueba | Media | Medio | Difundir por el semillero y la universidad; plan para ampliar o repetir |
| R8 | Sincronización duplica movimientos | Media | Medio | Identificadores únicos y operaciones idempotentes |

## 5. Calidad

- **Modelo de calidad:** ISO/IEC 25010 (adecuación funcional, fiabilidad, seguridad, usabilidad, mantenibilidad).
- **Metas:** cobertura ≥ 90 % en el motor y ≥ 60 % en la API; 0 accesos cruzados; SUS ≥ 68; IA 100 % sin cifras inventadas.
- **Control:** integración continua en cada cambio; revisión de los casos de cálculo por un docente del área contable; casos de prueba TC-01 a TC-10.

## 6. Comunicación

| Con quién | Qué | Cuándo | Medio |
| --- | --- | --- | --- |
| Director del trabajo de grado | Avance, riesgos y aprobación de puertas | Cada fase y cuando se requiera | Reunión y wiki |
| Semillero de investigación | Avances y resultados parciales | Sesiones del semillero | Presentación |
| Participantes de prueba | Propósito, consentimiento y resultados | Antes y después de cada sesión | Consentimiento escrito |
| Repositorio | Estado del sprint y decisiones | Cada sprint | Wiki, issues y `docs/decisiones.md` |

## 7. Control de cambios

Todo cambio de alcance se registra como una decisión en `docs/decisiones.md` con su motivo, su impacto en el cronograma y la aprobación del director si afecta un objetivo o una puerta.

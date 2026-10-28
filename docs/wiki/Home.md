# ASCENDX AI — Wiki del proyecto

ASCENDX AI es una aplicación móvil Android de planificación financiera personal con inteligencia artificial contextual y simulación de ahorro frente a financiación. Es el proyecto de grado de **Edwin Yair Molina Cerón** (Tecnología en Desarrollo de Software, UNICATÓLICA, Santiago de Cali) y se trabaja dentro del semillero de investigación.

> **Principio del producto:** la IA explica, el sistema calcula y los usuarios confirman si sirve.

## Estado

- **Fase actual:** validación. El desarrollo funcional de las fases 1 a 5 está completo (27 de octubre de 2026): 33 de 34 requisitos funcionales terminados; RF-03 espera el proveedor de correo.
- **Ya existe:** API desplegada (Render + Neon) y app con panel, movimientos, deudas, metas, simulador con escenarios, mentor de IA con cifras verificadas, lectura de recibos, modo sin conexión, cuentas, recurrentes, logros y recordatorios. 133 pruebas automáticas.
- **Sigue:** compilar la app de Android y probarla en dos teléfonos, prueba con usuarios (SUS) y mediciones de desempeño.

## Documentación de planeación (antes del desarrollo)

| # | Página | Para qué sirve |
| --- | --- | --- |
| 1 | [Plan estratégico](Plan-estrategico) | Misión, visión, DOFA, objetivos estratégicos e indicadores |
| 2 | [Plan del proyecto](Plan-del-proyecto) | Alcance, entregables, supuestos, riesgos, calidad, comunicación y cambios |
| 3 | [EDT / WBS](EDT-WBS) | Descomposición de todo el trabajo en paquetes, con su diccionario |
| 4 | [Requisitos funcionales](Requisitos-funcionales) | RF-01 a RF-34 con prioridad, estado y criterio de aceptación |
| 5 | [Requisitos no funcionales](Requisitos-no-funcionales) | RNF-01 a RNF-13 medibles, con cómo se verifican |
| 6 | [Historias de usuario y backlog](Historias-de-usuario-y-backlog) | Épicas, historias con criterios de aceptación y orden del backlog |
| 7 | [Cronograma](Cronograma) | Fases, 16 sprints con fechas y puertas de control |
| 8 | [Normas y estándares](Normas-y-estandares) | ISO/IEC aplicables y cómo se usan en el proyecto |

## Documentación técnica existente (en el repositorio)

- `docs/anteproyecto/` — anteproyecto (Word y PDF) y guion de exposición.
- `docs/documento-maestro.md` — visión completa del producto.
- `docs/decisiones.md` — registro de decisiones técnicas.
- `docs/modelo-datos.md` y `docs/api.md` — modelo de datos y API.
- `docs/despliegue.md` — despliegue en Render y Neon.
- `docs/estado.md` — trazabilidad de lo implementado.

## Fuera de alcance por ahora

- **Integración con DataCrédito u otras centrales de riesgo:** opcional y futura. Requiere un convenio con el operador y cumplir la Ley 1266 de 2008; no se incluye en la versión académica.
- Integraciones bancarias, ofertas reales de crédito y suscripciones.

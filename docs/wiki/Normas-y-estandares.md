# Normas y estándares

Normas ISO/IEC que guían la documentación y el desarrollo, y cómo se aplican en ASCENDX AI. La norma central es **ISO/IEC 29110**, pensada para equipos muy pequeños como este.

## Resumen

| Norma | De qué trata | Uso en ASCENDX AI |
| --- | --- | --- |
| ISO/IEC 29110 (perfil básico) | Ciclo de vida del software para entidades muy pequeñas | Marco de procesos del proyecto: gestión del proyecto e implementación del software |
| ISO/IEC/IEEE 12207:2017 | Procesos del ciclo de vida del software | Referencia general de procesos; 29110 es su versión simplificada |
| ISO/IEC/IEEE 29148:2018 | Ingeniería de requisitos | Redacción y calidad de los RF y RNF |
| ISO/IEC 25010:2023 | Modelo de calidad del producto | Clasificación de los RNF y criterios de evaluación |
| OWASP MASVS | Verificación de seguridad de apps móviles | Lista de chequeo de seguridad en la Fase 5 |

## ISO/IEC 29110 — Ciclo de vida para entidades muy pequeñas

**Qué es.** Una familia de normas para entidades muy pequeñas (empresas, departamentos o proyectos de hasta 25 personas) que desarrollan software no crítico. Su **perfil básico** se organiza en dos procesos: **gestión del proyecto** e **implementación del software**. ISO publica sin costo los informes técnicos de esta familia, incluida la guía de gestión e ingeniería del perfil básico (ISO/IEC TR 29110-5-1-2).

**Por qué aplica.** El proyecto lo desarrolla una sola persona, con un director como cliente académico; las normas grandes serían desproporcionadas.

| Proceso 29110 | Actividad | Cómo se cumple en el proyecto |
| --- | --- | --- |
| Gestión del proyecto | Planificación | [Plan del proyecto](Plan-del-proyecto), [EDT](EDT-WBS) y [Cronograma](Cronograma) |
| Gestión del proyecto | Ejecución del plan | Sprints de dos semanas con tablero en GitHub |
| Gestión del proyecto | Evaluación y control | Revisión de indicadores por sprint y puertas G0–G6 |
| Gestión del proyecto | Cierre | Entrega final, acta de aprobación y lecciones aprendidas |
| Implementación del software | Inicio | Revisión del plan con el director (G0) |
| Implementación del software | Análisis de requisitos | [Requisitos funcionales](Requisitos-funcionales), [no funcionales](Requisitos-no-funcionales) e [historias](Historias-de-usuario-y-backlog) |
| Implementación del software | Diseño de arquitectura y detallado | `docs/diseno.md`, `docs/modelo-datos.md`, diagramas del anteproyecto |
| Implementación del software | Construcción | Código en el monorepo con revisión por rama |
| Implementación del software | Integración y pruebas | Integración continua, pruebas unitarias e integración, casos TC-01 a TC-10 |
| Implementación del software | Entrega | APK, manuales y documento de grado |

**Productos de trabajo que se mantendrán** (adaptados del perfil básico): plan del proyecto, especificación de requisitos, diseño del software, componentes y código, casos y reporte de pruebas, registro de cambios (`docs/decisiones.md`), manual de usuario, manual técnico y registro de entrega.

## ISO/IEC/IEEE 12207:2017 — Procesos del ciclo de vida

Organiza los procesos del software en cuatro grupos: **de acuerdo** (adquisición y suministro), **habilitadores organizacionales** (modelo de ciclo de vida, infraestructura, recursos humanos), **de gestión técnica** (planificación, control, decisiones, riesgos, configuración) y **técnicos** (desde los requisitos de los interesados hasta el retiro). En este proyecto se usa como mapa de referencia; los procesos que se aplican de verdad son los de 29110, que derivan de ella.

## ISO/IEC/IEEE 29148:2018 — Ingeniería de requisitos

Define cómo especificar requisitos y qué los hace buenos. Cada requisito de la wiki se revisa contra estas características:

| Característica | Pregunta de revisión |
| --- | --- |
| Necesario | ¿Si lo quito, falta algo que el usuario o la norma exige? |
| Apropiado | ¿Está al nivel correcto, sin imponer cómo implementarlo? |
| Inequívoco | ¿Se entiende de una sola forma? |
| Completo | ¿Incluye condiciones y límites? |
| Singular | ¿Describe una sola capacidad? |
| Factible | ¿Se puede hacer con el tiempo y el presupuesto disponibles? |
| Verificable | ¿Tiene un criterio de aceptación medible? |
| Correcto | ¿Refleja lo que dicen los usuarios y el diagnóstico? |
| Conforme | ¿Sigue el formato y la plantilla del proyecto? |

El conjunto completo debe ser además **completo, consistente, factible, comprensible y validable**. La norma distingue tres documentos: requisitos de los interesados (StRS), del sistema (SyRS) y del software (SRS). En este proyecto, la encuesta y las entrevistas alimentan los requisitos de los interesados, y las páginas de RF y RNF cumplen el papel de SRS.

## ISO/IEC 25010:2023 — Calidad del producto

Modelo de calidad usado para clasificar los RNF y diseñar la evaluación: adecuación funcional (motor de cálculo con pruebas), eficiencia de desempeño (RNF-04, RNF-05), compatibilidad (RNF-06), usabilidad (RNF-07, RNF-08), fiabilidad (RNF-12), seguridad (RNF-01 a RNF-03 y RNF-10) y mantenibilidad (RNF-09).

## Seguridad: OWASP MASVS y normas de apoyo

- **OWASP MASVS:** estándar abierto de verificación de seguridad para apps móviles; se usará como lista de chequeo en el paquete 1.7.3 de la [EDT](EDT-WBS).
- **ISO/IEC 27001:** se toma solo como referencia de buenas prácticas de gestión de la seguridad de la información; no se busca certificación.
- **RFC 9106 (Argon2) y RFC 7519 (JWT):** estándares técnicos de contraseñas y tokens usados en la API.

## Marco legal colombiano

| Norma | Aplicación |
| --- | --- |
| Ley 1581 de 2012 y Decreto 1377 de 2013 | Autorización previa, política de tratamiento, consentimientos separados para IA y OCR, supresión de datos |
| Ley 1266 de 2008 | No se consulta ni se reporta a centrales de riesgo. Una integración con DataCrédito sería opcional y futura, y exigiría convenio y autorización expresa del titular |
| Ley 1328 de 2009 | Simulaciones con supuestos visibles; no son ofertas ni aprobaciones |
| CONPES 4144 de 2025 | IA transparente y con supervisión humana |
| Ley 23 de 1982 y Decreto 1360 de 1989 | Derechos de autor del software y respeto de licencias de código abierto |

## Fuentes

- [ISO — Lifecycle profiles for very small entities (ISO/IEC 29110)](https://www.iso.org/sites/materials/teaching-materials/education_materials-higher-edu/educational_materials-detail-emf0bd-2.html?emid=741)
- [ISO/IEC JTC 1/SC 7 — ISO/IEC/IEEE 12207:2017](https://committee.iso.org/sites/jtc1sc7/home/projects/flagship-standards/isoiecieee-122072017.html)
- [arc42 Quality — ISO/IEC/IEEE 12207:2017](https://quality.arc42.org/standards/iso12207)
- [IEEE Xplore — ISO/IEC/IEEE 29148:2018](https://ieeexplore.ieee.org/document/8559686)
- [Modern Requirements — características de los requisitos según 29148](https://www.modernrequirements.com/?p=32595)
- [OWASP MASVS](https://mas.owasp.org/MASVS/)

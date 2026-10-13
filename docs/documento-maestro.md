# Documento maestro — resumen de referencia

Versión en Markdown del *Documento Maestro de ASCENDX AI* para tenerlo junto al código. El PDF original es la referencia completa.

## Objetivo general

Desarrollar una aplicación móvil Android de planificación financiera personal que integre registro y análisis de movimientos, gestión de deudas y metas, simulación de ahorro y financiación, lectura asistida de recibos mediante OCR e inteligencia artificial contextual para apoyar decisiones financieras informadas.

## Objetivos específicos

1. Registrar y consultar ingresos, gastos, categorías y deudas.
2. Calcular indicadores financieros y estimar capacidad de ahorro.
3. Crear y seguir varias metas financieras simultáneas, con aportes y progreso.
4. Comparar escenarios de ahorro y financiación con supuestos explícitos y resultados verificables.
5. Incorporar IA que explique datos y escenarios, ayude a planificar y responda preguntas con contexto.
6. Facilitar el registro de gastos mediante OCR, siempre con revisión del usuario.
7. Proteger los datos personales y financieros (control de acceso, validación, almacenamiento seguro).

## Alcance del MVP

| Prioridad | Bloque | Contenido |
|---|---|---|
| P1 | Fundamentos | Registro, login, perfil financiero, categorías, ingresos, gastos, deudas |
| P1 | Panel y metas | Resumen mensual, dinero disponible, metas múltiples, aportes, proyección |
| P1 | Simulador | Ahorro vs financiación, cuota, intereses, costo total, plazos |
| P1 | IA integrada | Diagnóstico explicativo, plan de acción, chat con contexto limitado |
| P2 | OCR y sincronización | Lectura de recibos con revisión, SQLite + sincronización |
| P3 | Futuro comercial | Suscripciones, integración bancaria, ofertas reales de crédito |

## Límites explícitos

- Android únicamente en la primera versión.
- Sin entrenamiento de un modelo de IA propio.
- Sin prometer aprobación de créditos, rentabilidad ni resultados garantizados.
- OCR limitado a facturas y recibos; el usuario confirma los datos.
- La sincronización offline llega solo hasta donde pueda probarse con fiabilidad.
- Lo no desarrollado y probado se presenta como trabajo futuro.

## Criterios de éxito

- Crear cuenta e iniciar sesión.
- Registrar, consultar y corregir ingresos y gastos.
- Ver resúmenes financieros basados en movimientos.
- Crear varias metas, registrar aportes y consultar progreso.
- Comparar ahorro vs financiación con supuestos visibles y resultados reproducibles.
- Escanear un recibo de prueba, revisar y decidir si se guarda.
- Consultar a la IA y recibir explicaciones coherentes con los datos, sin presentar estimaciones como certezas.
- Pruebas que confirmen que un usuario no puede acceder a los datos de otro.
- Un grupo de prueba completa las tareas principales y valora comprensión, utilidad y facilidad de uso.

## Cronograma (6–8 meses)

| Mes | Etapa |
|---|---|
| 1 | Definición y diseño: requisitos, casos de uso, prototipos, modelo de datos |
| 2 | Fundamentos técnicos: repositorio, backend, base de datos, autenticación, app base |
| 3–4 | Núcleo financiero: movimientos, deudas, panel, metas, simulador |
| 5 | IA y OCR |
| 6 | Integración, sincronización, seguridad, pruebas con usuarios |
| 7–8 | Pulido, documentación y sustentación |

## Identidad visual

Fintech prémium + gamificación inteligente y discreta: interfaz limpia, tarjetas cuidadas, paleta sobria con acentos verde/turquesa, hitos de ahorro e insignias sobrias. La gamificación refuerza hábitos sanos (registrar, planificar, ahorrar) y **nunca** premia gastar ni endeudarse.

## Privacidad

Revisar la Ley 1581 de 2012 (Colombia) antes de pruebas con datos reales. Usar datos ficticios en la evaluación académica cuando sea posible.

# Historias de usuario y backlog

El backlog convierte los requisitos en trabajo ordenado. Cada historia sigue el formato «Como…, quiero…, para…» y tiene criterios de aceptación en formato **Dado / Cuando / Entonces**. La estimación usa puntos de historia (1, 2, 3, 5, 8).

## Épicas

| Épica | Nombre | Requisitos | Fase |
| --- | --- | --- | --- |
| E1 | Cuenta, seguridad y privacidad | RF-01 a RF-06 | 2 (hecha en la prueba de concepto) |
| E2 | Movimientos y categorías | RF-07 a RF-10 | 3 |
| E3 | Deudas | RF-11, RF-12 | 3 |
| E4 | Panel y capacidad de ahorro | RF-13 a RF-15 | 3 |
| E5 | Metas | RF-16 a RF-19 | 3 |
| E6 | Simulador | RF-20 a RF-22, RF-34 | 3 |
| E7 | Asistente de IA | RF-23 a RF-26 | 4 |
| E8 | OCR y sin conexión | RF-27 a RF-29 | 4–5 |
| E9 | Hábitos (P2) | RF-30 a RF-33 | 5 |

## Historias priorizadas

| Orden | ID | Historia | Épica | Puntos | Sprint |
| --- | --- | --- | --- | --- | --- |
| 1 | HU-01 | Como usuario, quiero registrar un gasto o ingreso con su categoría, para saber en qué se va mi dinero | E2 | 5 | 5 |
| 2 | HU-02 | Como usuario, quiero filtrar mi historial por mes, tipo y categoría, para revisar un periodo concreto | E2 | 3 | 5 |
| 3 | HU-03 | Como usuario, quiero que la app me avise si estoy registrando algo dos veces, para no duplicar gastos | E2 | 2 | 5 |
| 4 | HU-04 | Como usuario, quiero registrar una deuda con su tasa, cuota y plazo, para ver cuánto debo cada mes | E3 | 5 | 6 |
| 5 | HU-05 | Como usuario, quiero registrar el pago de una cuota, para que el saldo de la deuda se actualice | E3 | 3 | 6 |
| 6 | HU-06 | Como persona con ingresos variables, quiero ver mi capacidad de ahorro estimada, para saber cuánto puedo destinar a mis metas sin quedarme sin dinero | E4 | 5 | 6 |
| 7 | HU-07 | Como usuario, quiero ver mis gastos por categoría y su evolución, para detectar dónde puedo recortar | E4 | 5 | 7 |
| 8 | HU-08 | Como usuario con varias metas, quiero asignarles una prioridad, para que la app reparta mi ahorro primero en lo más importante | E5 | 8 | 7 |
| 9 | HU-09 | Como usuario, quiero registrar aportes a una meta y ver su fecha proyectada, para saber cuándo la lograré | E5 | 5 | 8 |
| 10 | HU-10 | Como usuario que quiere comprar una moto, quiero comparar ahorrar frente a financiar, para conocer cuánto pagaría de más con un crédito | E6 | 3 | 8 |
| 11 | HU-11 | Como usuario, quiero guardar una simulación, para revisarla después | E6 | 3 | 8 |
| 12 | HU-12 | Como usuario, quiero que el asistente me explique por qué una meta está en riesgo, usando mis propios datos | E7 | 8 | 9 |
| 13 | HU-13 | Como usuario, quiero un plan de acción para mi meta prioritaria, para saber qué hacer este mes | E7 | 5 | 9–10 |
| 14 | HU-14 | Como usuario sin conexión, quiero consultar mi panel, para revisar mi situación en cualquier momento | E8 | 5 | 10 |
| 15 | HU-15 | Como usuario, quiero escanear un recibo y corregir los datos antes de guardarlo, para registrar gastos más rápido sin errores | E8 | 8 | 10 |
| 16 | HU-16 | Como usuario sin conexión, quiero registrar un gasto y que se sincronice después, para no perder ningún movimiento | E8 | 8 | 11 |
| 17 | HU-17 | Como usuario, quiero programar mis gastos fijos como recurrentes, para no registrarlos cada mes | E9 | 3 | 12 |
| 18 | HU-18 | Como usuario, quiero recordatorios y logros por constancia, para mantener el hábito de registrar | E9 | 5 | 12 |

## Criterios de aceptación de las historias principales

**HU-01 — Registrar movimiento**
- Dado un usuario con sesión iniciada, cuando guarda un gasto de $50.000 en «Alimentación», entonces aparece en el historial y el gasto del mes aumenta en $50.000.
- Dado un valor vacío o negativo, cuando intenta guardar, entonces la app muestra el error y no guarda.

**HU-06 — Capacidad de ahorro**
- Dado un perfil con ingreso de $2.800.000 y gastos fijos de $1.650.000, cuando abre el panel, entonces ve una capacidad de $1.150.000 y una capacidad prudente de $920.000 (80 %), con la base de cálculo.
- Dado un usuario con tres meses de movimientos, cuando abre el panel, entonces la base de cálculo cambia a «historial».

**HU-08 — Prioridad de metas**
- Dadas dos metas con prioridad alta y baja y un ahorro insuficiente para ambas, cuando se reparte el ahorro, entonces la meta alta recibe primero su aporte requerido y la baja queda marcada «en riesgo».

**HU-10 — Ahorrar frente a financiar**
- Dada una compra de $12.000.000 al 24 % E.A. a 36 meses, cuando simula, entonces ve la cuota, el total pagado, los intereses y el tiempo para lograrlo ahorrando, con sus supuestos visibles.

**HU-12 — Explicación de la IA**
- Dada una meta en riesgo, cuando pregunta al asistente, entonces la respuesta usa solo cifras presentes en el contexto calculado y muestra los datos que usó.
- Dado que el usuario no dio el consentimiento de IA, cuando abre el asistente, entonces se le pide el consentimiento y no se envía nada.

**HU-15 — Escanear recibo**
- Dado un recibo legible, cuando lo escanea, entonces ve total, fecha y comercio editables y nada se guarda hasta que confirma.

**HU-16 — Registro sin conexión**
- Dado un gasto creado sin red, cuando vuelve la conexión, entonces se sincroniza una sola vez aunque la app reintente el envío.

## Reglas del backlog

- Se trabaja de arriba hacia abajo; una historia P2 no entra a un sprint mientras haya una P1 sin terminar.
- Las historias se publican como *issues* en GitHub con la etiqueta de su épica y se mueven en el tablero del proyecto.
- Al cerrar la Fase 1, el orden se ajusta con los resultados de la encuesta (pregunta 9: funciones más útiles).

# Requisitos funcionales

Qué debe hacer el sistema. Cada requisito es singular, verificable y tiene un criterio de aceptación, siguiendo las características de buenos requisitos de ISO/IEC/IEEE 29148. Prioridad: **P1** núcleo del MVP, **P2** si el núcleo está estable.

Estado al 27 de octubre de 2026: **Terminado** (implementado y probado), **Parcial** (parte hecha) o **Planificado**. El detalle técnico está en `docs/estado.md`.

## Cuenta, seguridad y privacidad

| Código | Requisito | Prioridad | Criterio de aceptación | Estado |
| --- | --- | --- | --- | --- |
| RF-01 | Registrar cuenta con correo, contraseña, nombre y declaración de mayoría de edad | P1 | Un correo ya registrado se rechaza con mensaje claro (TC-01); sin declarar mayoría de edad no se crea la cuenta | Terminado |
| RF-02 | Iniciar y cerrar sesión, con bloqueo temporal tras 5 intentos fallidos | P1 | Al quinto intento fallido la cuenta se bloquea 15 minutos | Terminado |
| RF-03 | Recuperar la contraseña mediante un código enviado al correo | P1 | El código vence y solo sirve una vez | Parcial (falta proveedor de correo) |
| RF-04 | Editar el perfil y el perfil financiero | P1 | Los cambios se reflejan de inmediato en el panel | Terminado |
| RF-05 | Eliminar la cuenta y todos sus datos | P1 | Después de borrar, ningún dato del usuario queda en la base de datos | Terminado |
| RF-06 | Gestionar consentimientos separados para IA y OCR | P1 | Sin consentimiento, la función de IA u OCR no se ejecuta; se guarda versión y fecha | Terminado |

## Movimientos, categorías y deudas

| Código | Requisito | Prioridad | Criterio de aceptación | Estado |
| --- | --- | --- | --- | --- |
| RF-07 | Crear, editar y borrar movimientos | P1 | Un movimiento guardado aparece en el historial y en el panel del mes | Terminado |
| RF-08 | Consultar el historial con filtros por mes, tipo y categoría | P1 | Los filtros combinados devuelven solo los movimientos que cumplen todos | Terminado |
| RF-09 | Avisar de posibles movimientos duplicados | P1 | Un movimiento del mismo tipo, valor y categoría registrado con menos de 2 minutos de diferencia muestra un aviso antes de guardar | Terminado |
| RF-10 | Gestionar categorías por defecto y personalizadas | P1 | El usuario ve 15 categorías por defecto y puede crear las suyas | Terminado |
| RF-11 | Registrar deudas con tasa, cuota, plazo y día de pago | P1 | Una deuda guardada suma su cuota a las obligaciones del mes | Terminado |
| RF-12 | Registrar pagos de deuda que actualicen el saldo | P1 | Tras un pago, el saldo baja en el valor de capital correspondiente | Terminado |

## Panel y capacidad de ahorro

| Código | Requisito | Prioridad | Criterio de aceptación | Estado |
| --- | --- | --- | --- | --- |
| RF-13 | Ver el panel del mes: ingresos, gastos, pagos de deuda, flujo neto y disponible | P1 | Las cifras coinciden con la suma de los movimientos del mes | Terminado |
| RF-14 | Ver la capacidad de ahorro estimada y su base de cálculo | P1 | Se muestra el valor y si se calculó con el perfil o con el historial | Terminado |
| RF-15 | Ver gastos por categoría y evolución de seis meses | P1 | El gráfico suma el 100 % de los gastos del periodo | Terminado |

## Metas

| Código | Requisito | Prioridad | Criterio de aceptación | Estado |
| --- | --- | --- | --- | --- |
| RF-16 | Crear varias metas con valor, fecha y prioridad | P1 | Se pueden tener varias metas activas con prioridad alta, media o baja | Terminado |
| RF-17 | Registrar aportes y retiros a metas | P1 | El ahorrado nunca queda negativo | Terminado |
| RF-18 | Ver progreso y fecha proyectada de cada meta | P1 | La fecha proyectada usa el aporte asignado por el reparto | Terminado |
| RF-19 | Alertar metas en riesgo con sugerencias de ajuste | P1 | Si el aporte asignado es menor al requerido, la meta se marca en riesgo (TC-05) | Terminado |

## Simulador

| Código | Requisito | Prioridad | Criterio de aceptación | Estado |
| --- | --- | --- | --- | --- |
| RF-20 | Simular escenarios de ahorro, crédito y mixto | P1 | La cuota de $5.000.000 al 2 % mensual en 24 meses coincide con la hoja de cálculo (TC-04) | Terminado |
| RF-21 | Convertir tasas entre EA y MV | P1 | 2 % MV equivale a 26,82 % EA (TC-03) | Terminado |
| RF-22 | Guardar y consultar escenarios simulados | P1 | Un escenario guardado se puede abrir con los mismos resultados | Terminado |

## Inteligencia artificial

| Código | Requisito | Prioridad | Criterio de aceptación | Estado |
| --- | --- | --- | --- | --- |
| RF-23 | Generar un resumen financiero explicado por la IA | P1 | Toda cifra del resumen existe en el contexto calculado por el sistema | Terminado |
| RF-24 | Generar un plan de acción con la IA | P1 | El plan propone pasos concretos y declara sus supuestos | Terminado |
| RF-25 | Chatear con la IA dentro de un límite diario | P1 | Al superar el límite diario se informa y no se envía la solicitud | Terminado |
| RF-26 | Borrar el historial de conversaciones | P1 | Tras borrar, el historial queda vacío | Terminado |

## Sin conexión, OCR y funciones P2

| Código | Requisito | Prioridad | Criterio de aceptación | Estado |
| --- | --- | --- | --- | --- |
| RF-27 | Consultar datos en caché sin conexión | P1 | Sin red, el panel muestra los últimos datos con la fecha de actualización | Terminado |
| RF-28 | Escanear un recibo y revisar los campos extraídos | P2 | Nada se guarda sin que el usuario confirme los campos | Terminado |
| RF-29 | Crear movimientos sin conexión y sincronizarlos | P2 | Al reconectar, cada movimiento se guarda una sola vez | Terminado |
| RF-30 | Programar movimientos recurrentes | P2 | El movimiento se crea en la fecha programada | Terminado |
| RF-31 | Gestionar cuentas (efectivo, banco, billetera digital) | P2 | Cada movimiento puede asociarse a una cuenta | Terminado |
| RF-32 | Otorgar hitos, racha semanal e insignias | P2 | Los logros premian registrar y ahorrar, nunca endeudarse | Terminado |
| RF-33 | Configurar recordatorios locales | P2 | El recordatorio llega a la hora elegida sin conexión | Terminado |
| RF-34 | Comparar dos escenarios lado a lado | P2 | Se muestran costo total, plazo e intereses de ambos | Terminado |

## Resumen

| Prioridad | Total | Terminado | Parcial | Planificado |
| --- | --- | --- | --- | --- |
| P1 | 27 | 26 | 1 | 0 |
| P2 | 7 | 7 | 0 | 0 |

RF-28 (cámara) y RF-33 (recordatorios) están implementados; su prueba en un teléfono real queda en la validación con la app de Android.

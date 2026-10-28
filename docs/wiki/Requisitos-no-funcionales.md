# Requisitos no funcionales

Cómo debe comportarse el sistema. Cada requisito tiene una medida y un método de verificación, y se relaciona con una característica del modelo de calidad ISO/IEC 25010.

| Código | Característica ISO/IEC 25010 | Requisito medible | Cómo se verifica | Estado |
| --- | --- | --- | --- | --- |
| RNF-01 | Seguridad (confidencialidad) | Ningún endpoint devuelve datos de otro usuario | Pruebas de acceso cruzado en cada módulo (TC-02) | Terminado |
| RNF-02 | Seguridad (integridad) | Contraseñas con Argon2id; secretos solo en el servidor; HTTPS obligatorio | Revisión de código y configuración del despliegue | Terminado |
| RNF-03 | Seguridad (resistencia) | Máximo 100 solicitudes por minuto por usuario y 10 intentos de inicio de sesión por IP cada 15 minutos | Prueba automatizada de límites | Terminado |
| RNF-04 | Eficiencia de desempeño | 95 % de las solicitudes sin IA responden en menos de 1 s con 1.000 movimientos por usuario | Prueba de carga con datos simulados | Planificado |
| RNF-05 | Eficiencia de desempeño | La IA responde en menos de 15 s o permite cancelar | Medición en el banco de 30 preguntas | Parcial (tiempo máximo de 15 s con respaldo; falta medir) |
| RNF-06 | Compatibilidad | Android 8.0 o superior, probado en dos teléfonos de gamas distintas | Pruebas manuales en dispositivos reales | Planificado |
| RNF-07 | Usabilidad | SUS promedio ≥ 68 y ≥ 80 % de éxito en las tareas principales | Prueba con 10–15 participantes | Planificado |
| RNF-08 | Usabilidad (accesibilidad) | Contraste mínimo 4,5:1, áreas táctiles de 48 dp y respeto del tamaño de fuente del sistema | Lista de chequeo de accesibilidad | Parcial |
| RNF-09 | Mantenibilidad | Cobertura de pruebas ≥ 90 % en el motor de cálculo y ≥ 60 % en la API | Reporte de cobertura en integración continua | Terminado en el motor (97 %) |
| RNF-10 | Seguridad (privacidad) | Los registros del sistema no contienen contraseñas, tokens, montos ni texto de recibos | Revisión de logs y redacción automática | Terminado |
| RNF-11 | Eficiencia (costo) | Límite diario de mensajes de IA por usuario y tope mensual de gasto | Prueba del límite y alerta de gasto del proveedor | Terminado |
| RNF-12 | Fiabilidad | Un movimiento enviado dos veces con el mismo identificador se guarda una sola vez | Prueba de idempotencia en la sincronización | Terminado |
| RNF-13 | Usabilidad (idioma) | Interfaz y respuestas en español; montos con formato $ 1.250.000 | Revisión de pantallas y pruebas de formato | Terminado |

## Restricciones de diseño y normativas

- **Plataforma:** Android, construida con React Native, Expo y TypeScript; API en Node.js con PostgreSQL.
- **Datos personales:** Ley 1581 de 2012 y Decreto 1377 de 2013: autorización previa, finalidad informada, derecho a consultar, corregir y suprimir.
- **Información financiera:** Ley 1266 de 2008: la app no consulta ni reporta a centrales de riesgo.
- **Consumidor financiero:** Ley 1328 de 2009 como guía: cada simulación muestra sus supuestos y aclara que no es una oferta.
- **IA:** CONPES 4144 de 2025: transparencia y supervisión humana.

# Registro de decisiones técnicas

Cada decisión importante se registra aquí con su fecha, contexto y motivo, para que la sustentación pueda justificar cada elección.

---

## D-001 · Reinicio del repositorio (2026-10-13)

**Contexto.** El repositorio contenía un proyecto anterior tipo "Life OS" (tareas, hábitos, trading, web + móvil) que no corresponde al alcance acordado en el Documento Maestro.

**Decisión.** Retirar todo el código anterior y empezar una base nueva centrada en finanzas personales para Android. Se conserva el historial de git y el último estado queda en la etiqueta `legacy-life-os`.

**Motivo.** Evitar arrastrar funciones fuera de alcance (web, trading, tareas, suscripciones) y mantener un MVP coherente.

---

## D-002 · Repositorio con dos paquetes independientes (2026-10-13) — *reemplazada por D-006*

**Decisión.** `backend/` y `mobile/` son proyectos npm independientes, sin workspaces en la raíz.

**Motivo.** Expo/Metro y Prisma tienen requisitos de resolución de dependencias distintos; separarlos evita conflictos de versiones y simplifica la instalación en Windows.

---

## D-003 · Autenticación propia en el backend (2026-10-13) — *ajustada por D-006*

**Decisión.** Autenticación propia con contraseñas hasheadas (bcrypt), token de acceso JWT de corta duración y token de renovación opaco, rotativo y guardado como hash en la base de datos.

**Motivo.** Sin costos de proveedor, control total y valor académico (se puede explicar y probar cada parte). Se puede migrar a un proveedor administrado más adelante sin tocar las reglas financieras.

**Pendiente.** Recuperación de contraseña por correo (requiere elegir proveedor de email).

---

## D-004 · Cálculos financieros deterministas (2026-10-13) — *ajustada por D-006*

**Decisión.** Todas las cifras (cuotas, intereses, proyecciones, capacidad de ahorro) se calculan con funciones puras en `backend/src/modules/finance/calculations`, cubiertas por pruebas unitarias. La IA solo explica resultados ya calculados.

**Motivo.** Evita que la IA invente cifras y permite resultados reproducibles para la evaluación.

**Detalles.**
- Los montos se guardan como `DECIMAL(15,2)` y los resultados que ve el usuario se redondean al **peso colombiano** (COP).
- En la tabla de amortización la última cuota absorbe la diferencia de redondeo para que el saldo termine exactamente en 0.
- El simulador **no recomienda** un camino: devuelve hechos comparables, supuestos y advertencias. La decisión es del usuario.
- Tasas: el usuario puede ingresar **tasa efectiva anual (E.A.)** o **mensual vencida (M.V.)**; internamente todo se convierte a tasa mensual: `i_m = (1 + EA)^(1/12) - 1`.
- Cuota fija (sistema francés): `C = P · i / (1 - (1 + i)^-n)`.

---

## D-005 · Versiones de herramientas (2026-10-13)

**Decisión.** Prisma 7 (cliente generado en TypeScript con adaptador `@prisma/adapter-pg`), Express 5, Zod 4, TypeScript 5.9, Vitest. En móvil, las versiones las fija `create-expo-app` según el SDK de Expo vigente.

**Motivo.** Versiones estables vigentes a la fecha, compatibles entre sí y verificadas al crear el proyecto.

---

## D-006 · Alineación con el Documento Maestro v2 (2026-10-13)

**Contexto.** El Documento Maestro v2 (definido en la conversación del anteproyecto) cerró decisiones que la v1 dejaba abiertas. La primera versión del código se hizo con la v1.

**Decisión.** El v2 es la referencia principal ([`documento-maestro.md`](documento-maestro.md)). Cambios aplicados al código:

- **Monorepo** con npm workspaces: `apps/api`, `apps/mobile` y `packages/finance-core` (fórmulas compartidas entre app y API). Reemplaza D-002.
- **Dinero en pesos enteros** (`BIGINT`), tasas en `DECIMAL(9,6)`. Reemplaza el `DECIMAL(15,2)` de D-004.
- **Cinco tipos de movimiento:** ingreso, gasto, pago de deuda, aporte a meta y retiro de meta (sección 6.1).
- **Fórmulas de la sección 6:** capacidad de ahorro de 3 meses con respaldo en el perfil, capacidad prudente (80 %), carga de deuda, fondo de emergencia, reparto de ahorro entre metas por prioridad y fecha, simulador ahorro / crédito / mixto con cargos únicos y aviso de usura.
- **Autenticación:** Argon2id (ajusta D-003), bloqueo de 15 min tras 5 intentos fallidos, declaración de mayoría de edad, consentimientos versionados en su propia tabla, sesiones por dispositivo y recuperación de contraseña con código de 6 dígitos.
- **Diseño:** fondo grafito, primario turquesa, tipografía Manrope con números tabulares, tarjetas de 16 dp y navegación Inicio · Movimientos · (+) · Metas · Asistente.

**Pendiente de verificar (sprint 1 del v2):** proveedor de correo transaccional, PaaS y base de datos administrada, proveedor de IA. Mientras no haya proveedor de correo, en desarrollo el código de recuperación se muestra en la consola de la API (nunca en producción).

---

## D-007 · Dirección visual oficial (2026-10-13)

**Contexto.** El autor entregó la sección 15 definitiva de dirección visual e identidad de marca, que reemplaza la propuesta inicial (grafito + turquesa).

**Decisión.** Adoptar la paleta de referencia (fondo `#0B1020`, esmeralda `#10B981`, menta `#6EE7B7`, violeta `#8B5CF6` para el mentor), el lema «Convierte potencial en progreso medible», un isotipo propio («X ascendente») usado también como ícono de la app, y la jerarquía del panel de la sección 15.4. Detalle en `docs/diseno.md`.

**Motivo.** Identidad reconocible y coherente en todas las pantallas; los acentos se reservan para acciones principales, progreso y el mentor.

**Notas.** Se conserva Manrope (la sección 15 no fija tipografía y la v2 la proponía). La pestaña sigue llamándose «Asistente», como en el Anexo I del anteproyecto; dentro, la función se presenta como «Tu mentor ASCENDX AI».

---

## D-008 · Logo oficial y animación de inicio (2026-10-13)

**Contexto.** El autor entregó el logo oficial de ASCENDX AI: un símbolo geométrico (letras «E» y «M» con una flecha que asciende) en degradado magenta → violeta → azul → cian, y el nombre «ASCENDX AI».

**Decisión.** El logo reemplaza el isotipo provisional de D-007 en todas las piezas:

- Símbolo vectorizado en `apps/mobile/src/components/brand/LogoSymbol.tsx` (y `assets/brand/symbol.svg`), dividido en cuatro piezas para poder animarlo.
- Nombre extraído del original con fondo transparente, en versión clara y oscura (`assets/brand/wordmark-*.png`).
- Ícono de la app, ícono adaptativo y monocromo de Android, favicon y pantalla de inicio nativa (fondo `#0B1020`) regenerados con el logo.
- **Animación de inicio** (`IntroAnimation.tsx`, ≈ 1,8 s): aparece un resplandor, se arman las barras de la «E» y la «M», la flecha sube a su lugar y aparece el nombre; se desvanece cuando la app terminó de cargar. Con «reducir movimiento» se muestra el logo sin desplazamientos.
- Uso en pantallas: bienvenida (símbolo + nombre), inicio de sesión y registro (símbolo) y pie de Perfil (nombre + versión).
- El archivo original se guarda en `docs/marca/logo-original.png`.

**Motivo.** Identidad reconocible desde el primer segundo y coherente entre el ícono del teléfono, el arranque y la app.

**Nota.** El ícono y la pantalla nativa solo se ven en una compilación instalada (APK); en Expo Go aparecen los de Expo. La animación sí se ve en Expo Go.

---

## D-009 · Se mantiene PostgreSQL propio; no se usa Firebase (2026-10-13)

**Contexto.** Al probar en el teléfono el registro mostró «No pudimos conectar con el servidor» y se planteó pasar la base de datos a Firebase.

**Diagnóstico.** La base de datos no era el problema: la API (puerto 4000) no estaba corriendo en el computador; solo estaba abierto Expo (puerto 8081).

**Decisión.** Mantener la arquitectura del anteproyecto y del Documento Maestro: API propia (Node + Express) con PostgreSQL y Prisma. Firebase (Firestore) obligaría a reescribir la autenticación, los cálculos en el servidor, las reglas de acceso y el modelo relacional, y contradice la arquitectura aprobada. Para usar la app sin el computador encendido, se publicará la misma API en un servicio en la nube con PostgreSQL administrado (p. ej. Neon), sin cambiar el código.

**Cambios.** La app usa la IP desde la que Expo la cargó si falta `EXPO_PUBLIC_API_URL`, y en desarrollo el error de conexión indica revisar la ventana «ASCENDX - API» y el wifi.

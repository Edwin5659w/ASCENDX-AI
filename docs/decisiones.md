# Registro de decisiones técnicas

Cada decisión importante se registra aquí con su fecha, contexto y motivo, para que la sustentación pueda justificar cada elección.

---

## D-001 · Reinicio del repositorio (2026-10-13)

**Contexto.** El repositorio contenía un proyecto anterior tipo "Life OS" (tareas, hábitos, trading, web + móvil) que no corresponde al alcance acordado en el Documento Maestro.

**Decisión.** Retirar todo el código anterior y empezar una base nueva centrada en finanzas personales para Android. Se conserva el historial de git y el último estado queda en la etiqueta `legacy-life-os`.

**Motivo.** Evitar arrastrar funciones fuera de alcance (web, trading, tareas, suscripciones) y mantener un MVP coherente.

---

## D-002 · Repositorio con dos paquetes independientes (2026-10-13)

**Decisión.** `backend/` y `mobile/` son proyectos npm independientes, sin workspaces en la raíz.

**Motivo.** Expo/Metro y Prisma tienen requisitos de resolución de dependencias distintos; separarlos evita conflictos de versiones y simplifica la instalación en Windows.

---

## D-003 · Autenticación propia en el backend (2026-10-13)

**Decisión.** Autenticación propia con contraseñas hasheadas (bcrypt), token de acceso JWT de corta duración y token de renovación opaco, rotativo y guardado como hash en la base de datos.

**Motivo.** Sin costos de proveedor, control total y valor académico (se puede explicar y probar cada parte). Se puede migrar a un proveedor administrado más adelante sin tocar las reglas financieras.

**Pendiente.** Recuperación de contraseña por correo (requiere elegir proveedor de email).

---

## D-004 · Cálculos financieros deterministas (2026-10-13)

**Decisión.** Todas las cifras (cuotas, intereses, proyecciones, capacidad de ahorro) se calculan con funciones puras en `backend/src/modules/finance/calculations`, cubiertas por pruebas unitarias. La IA solo explica resultados ya calculados.

**Motivo.** Evita que la IA invente cifras y permite resultados reproducibles para la evaluación.

**Detalles.**
- Los montos se manejan en **pesos colombianos (COP) como enteros** (sin centavos) y se redondean al peso.
- Tasas: el usuario puede ingresar **tasa efectiva anual (E.A.)** o **mensual vencida (M.V.)**; internamente todo se convierte a tasa mensual: `i_m = (1 + EA)^(1/12) - 1`.
- Cuota fija (sistema francés): `C = P · i / (1 - (1 + i)^-n)`.

---

## D-005 · Versiones de herramientas (2026-10-13)

**Decisión.** Prisma 7 (cliente generado en TypeScript con adaptador `@prisma/adapter-pg`), Express 5, Zod 4, TypeScript 5.9, Vitest. En móvil, las versiones las fija `create-expo-app` según el SDK de Expo vigente.

**Motivo.** Versiones estables vigentes a la fecha, compatibles entre sí y verificadas al crear el proyecto.

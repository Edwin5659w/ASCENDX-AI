# Trading en ASCENDX — ¿Para qué serviría?

## Qué NO tenemos hoy

ASCENDX registra **finanzas personales** (ingresos y gastos) y un **diario de trading MVP** (operaciones manuales, P&L opcional, etiquetas emocionales). No hay cotizaciones en vivo, APIs de mercado ni asesoría de inversión.

## Qué puede significar «Trading» (tres interpretaciones)

### 1. Tracking (seguimiento) — **recomendado para ASCENDX**

| Beneficio | Cómo encaja |
|-----------|-------------|
| El usuario **ve** su progreso | Rachas, XP, % de objetivos, balance financiero |
| La IA usa **datos reales** | No inventa metas; planes basados en JSON del usuario |
| Confianza en la defensa | Demuestra metodología (SMART, GTD, hábitos) + medición |
| Bajo riesgo legal | No es asesoría de inversión ni salud |

**Ya implementado en esta fase:** paneles de metodología, vínculo tarea–objetivo, fechas, edición, onboarding finanzas con primer movimiento.

### 2. Trading financiero (bolsa / cripto) — **módulo aparte**

| Beneficio | Coste / riesgo |
|-----------|----------------|
| Atrae usuarios interesados en inversión | API de mercados, compliance, disclaimers legales |
| Diario de operaciones + emociones | Modelo de datos nuevo (símbolo, entrada, salida, P&L) |
| Diferenciación vs. apps solo de gastos | Se aleja del «Life OS» general; requiere mantenimiento alto |

**Serviría si** el proyecto pivota a **finanzas e inversión**. Para un Life OS universitario suele ser **opcional** y solo tras validar con el jurado.

### 3. Trading wellness (psicología del trader)

| Beneficio | Encaje |
|-----------|--------|
| Scorecard emocional (estrés, sueño, FOMO) | Similar a hábitos + mentor IA |
| Correlación estado mental ↔ decisiones | Extensión del chat y hábitos |
| Nicho muy específico | Solo útil si el público son traders |

## Recomendación para la sustentación

1. Explicar que priorizaste **tracking + metodologías visibles** (SMART, GTD, 50/30/20, Pomodoro).
2. Si el profesor pide **trading financiero**, presentarlo como **fase 2** con disclaimer y sin sustituir el presupuesto personal actual.
3. Mostrar en demo: tarea vinculada a objetivo → sube progreso → IA prioriza pendientes.

## Trading MVP implementado (fase 2 ligera)

- **API:** `GET/POST/PATCH/DELETE /trades`, `GET /trades/summary`
- **Modelo:** `Trade` (symbol, side BUY/SELL, quantity, price, pnl opcional, emotionTag, note, tradedAt)
- **UI:** pestaña «Diario trading» en Finanzas (móvil y web) **solo si el usuario la activa en Perfil** (`tradingJournalEnabled`)
- **Por defecto desactivado:** orientado a ventas/negocio; el diario es para bolsa/cripto, no para ventas del negocio
- **Hábitos:** heatmap 7 días, hitos de racha, recordatorios (locales en móvil; preferencia guardada en BD)
- **Perfil:** `POST /user/change-password`, versión de app en móvil
- **Pendiente fase 3:** IA sobre patrones emocionales, cotizaciones en vivo, portafolio multi-activo

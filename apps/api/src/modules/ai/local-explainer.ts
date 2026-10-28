import { formatCop } from '@ascendx/finance-core';
import type { AiContext } from './context.js';

/**
 * Explicaciones generadas con reglas a partir del contexto (modo «local»).
 * Se usan cuando no hay un proveedor de IA configurado y como respaldo cuando
 * la respuesta del modelo no pasa la verificación de cifras. Solo repiten
 * cifras del contexto, así que siempre pasan el verificador.
 */
export interface AiAnswer {
  resumen: string;
  recomendacion: string;
  pasos: string[];
  alternativas: string[];
  supuestos: string[];
}

export interface ChatAnswer {
  respuesta: string;
  /** Pantalla de la app que puede ayudar con la pregunta */
  funcion?: 'simulador' | 'metas' | 'movimientos' | 'deudas' | 'perfil' | null;
}

const pct = (value: number) => `${String(value).replace('.', ',')} %`;
const MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const day = (date: string) => {
  const [y, m, d] = date.split('-').map(Number);
  return `${d} de ${MONTHS[(m ?? 1) - 1]} de ${y}`;
};

const ASSUMPTIONS_BASE = [
  'Las cifras salen de tus movimientos y tu perfil; no incluyen ingresos o gastos que no hayas registrado.',
  'Es una orientación educativa, no asesoría financiera profesional.',
];

function riskyGoals(c: AiContext) {
  return c.metas.filter((m) => m.estado === 'en_riesgo' || m.estado === 'vencida');
}

export function localSummary(c: AiContext): AiAnswer {
  const parts: string[] = [];
  if (c.capacidad.base === 'sin_datos') {
    return {
      resumen: 'Aún no tengo datos suficientes para analizar tu situación.',
      recomendacion: 'Completa tu perfil financiero o registra tus ingresos y gastos de este mes.',
      pasos: ['Abre tu perfil financiero y escribe tu ingreso y tus gastos fijos estimados.', 'Registra tus movimientos a medida que ocurran.'],
      alternativas: [],
      supuestos: ASSUMPTIONS_BASE,
    };
  }
  if (c.mesActual.ingresos || c.mesActual.gastos) {
    parts.push(`Este mes llevas ingresos por ${formatCop(c.mesActual.ingresos)} y gastos por ${formatCop(c.mesActual.gastos)}.`);
  }
  if (c.capacidad.alerta) {
    parts.push(`Tu capacidad de ahorro estimada es ${formatCop(c.capacidad.capacidadEstimada)}: tus gastos y cuotas igualan o superan tus ingresos.`);
  } else {
    parts.push(`Podrías apartar ${formatCop(c.capacidad.ahorroPrudente)} al mes de forma prudente (${c.capacidad.explicacion.charAt(0).toLowerCase()}${c.capacidad.explicacion.slice(1)})`);
  }
  const top = c.gastosPorCategoria[0];
  if (top) parts.push(`Tu mayor gasto del mes es ${top.categoria}: ${formatCop(top.total)}, el ${pct(top.porcentaje)} de tus gastos.`);
  if (c.cargaDeuda) parts.push(`Tus cuotas de deuda equivalen al ${pct(c.cargaDeuda.porcentajeDelIngreso)} de tu ingreso (nivel ${c.cargaDeuda.nivel}).`);

  const risky = riskyGoals(c);
  const pasos: string[] = [];
  let recomendacion: string;
  if (c.capacidad.alerta) {
    recomendacion = 'Antes de aportar a metas, revisa tus gastos para que tus ingresos los cubran.';
    if (top) pasos.push(`Revisa los gastos de ${top.categoria}, que es tu categoría más alta (${formatCop(top.total)}).`);
    pasos.push('Registra todos tus gastos durante el mes para ver dónde se va el dinero.');
  } else if (risky.length) {
    const g = risky[0]!;
    recomendacion = `Tu meta «${g.nombre}» está en riesgo: tu ahorro prudente no alcanza para su aporte requerido.`;
    if (g.sugerencias?.aporteParaMantenerFecha) pasos.push(`Para llegar en la fecha deseada necesitarías aportar ${formatCop(g.sugerencias.aporteParaMantenerFecha)} al mes.`);
    if (g.sugerencias?.fechaAlcanzable && g.aporteAsignadoMensual) {
      pasos.push(`Con el aporte asignado de ${formatCop(g.aporteAsignadoMensual)} la lograrías el ${day(g.sugerencias.fechaAlcanzable)}.`);
    }
    pasos.push('Decide si mueves la fecha, cambias la prioridad o reduces un gasto para liberar ahorro.');
  } else if (c.metas.length) {
    recomendacion = 'Tu ahorro prudente alcanza para tus metas. Mantén tus aportes cada mes.';
    for (const m of c.metas.filter((x) => x.aporteAsignadoMensual).slice(0, 3)) {
      pasos.push(`Aporta ${formatCop(m.aporteAsignadoMensual!)} a «${m.nombre}».`);
    }
  } else {
    recomendacion = 'Define una meta para darle un propósito a tu ahorro prudente.';
    pasos.push('Crea tu primera meta, por ejemplo un fondo de emergencia.');
  }
  if (!c.fondoEmergencia && !c.capacidad.alerta) pasos.push('Considera crear un fondo de emergencia; una referencia común es cubrir entre 3 y 6 meses de gastos.');

  return {
    resumen: parts.join(' '),
    recomendacion,
    pasos,
    alternativas: c.deudas.cantidadActivas
      ? [`Si prefieres bajar tus deudas primero, tus cuotas del mes suman ${formatCop(c.deudas.cuotasDelMes)}.`]
      : [],
    supuestos: [c.capacidad.explicacion, ...ASSUMPTIONS_BASE],
  };
}

export function localPlan(c: AiContext, goalName?: string | null): AiAnswer {
  const goal = (goalName ? c.metas.find((m) => m.nombre === goalName) : null) ?? riskyGoals(c)[0] ?? c.metas.find((m) => m.estado === 'en_curso');
  if (!goal) {
    const summary = localSummary(c);
    return { ...summary, resumen: 'No tienes metas activas para planear.', recomendacion: 'Crea una meta y te propongo un plan mes a mes.' };
  }
  const pasos: string[] = [];
  if (goal.aporteAsignadoMensual) pasos.push(`Este mes aporta ${formatCop(goal.aporteAsignadoMensual)} a «${goal.nombre}» apenas recibas tu ingreso.`);
  if (goal.aporteRequeridoMensual && goal.aporteAsignadoMensual !== null && goal.aporteAsignadoMensual < goal.aporteRequeridoMensual) {
    pasos.push(`Para llegar en la fecha deseada, el aporte requerido es ${formatCop(goal.aporteRequeridoMensual)} al mes.`);
  }
  const top = c.gastosPorCategoria[0];
  if (top) pasos.push(`Revisa tus gastos de ${top.categoria} (${formatCop(top.total)} este mes) para liberar ahorro.`);
  pasos.push('Registra cada aporte en la app para ver tu progreso y tus hitos.');
  return {
    resumen: `Tu meta «${goal.nombre}» lleva ${formatCop(goal.ahorrado)} de ${formatCop(goal.objetivo)} (${pct(goal.porcentaje)}); faltan ${formatCop(goal.falta)}.`,
    recomendacion:
      goal.estado === 'en_curso'
        ? `Vas bien: con el aporte asignado la lograrías${goal.fechaProyectada ? ` el ${day(goal.fechaProyectada)}` : ''}.`
        : goal.sugerencias?.fechaAlcanzable
          ? `Ajusta la fecha al ${day(goal.sugerencias.fechaAlcanzable)} o aumenta el aporte.`
          : 'Aumenta su prioridad o libera ahorro de otra meta para que reciba aporte.',
    pasos,
    alternativas: goal.fechaDeseada ? ['Mover la fecha deseada reduce el aporte mensual necesario.'] : ['Ponerle una fecha deseada te ayuda a saber cuánto aportar cada mes.'],
    supuestos: ['El reparto da prioridad a las metas de prioridad alta y luego a las fechas más cercanas.', ...ASSUMPTIONS_BASE],
  };
}

const norm = (text: string) => text.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

/** Palabras que indican que la pregunta es sobre finanzas personales o la app. */
const FINANCE_TOPIC =
  /(dinero|plata|plat[ao]|peso|ahorr|gast|ingres|sueldo|salari|pago|pagar|deud|debo|credit|prestam|financ|cuota|tasa|interes|meta|presupuest|mes|flujo|disponible|capacidad|compr|invert|acciones|cripto|cdt|banco|cuenta|tarjeta|finanz|econom|cuanto|como voy|situacion|riesgo|lograr|alcanz|simul|recorta|fondo|emergencia|ascendx|app|hola|ayuda)/;

export const OFF_TOPIC_ANSWER =
  'Solo puedo ayudarte con tus finanzas personales y con las funciones de ASCENDX AI: tus gastos, tu capacidad de ahorro, tus metas, tus deudas y el simulador. ¿Quieres que revisemos alguno de esos temas?';

export function isOffTopic(question: string) {
  return !FINANCE_TOPIC.test(norm(question));
}

export function localChat(c: AiContext, question: string): ChatAnswer {
  const q = norm(question);
  // TC-08: preguntas fuera de las finanzas personales se rechazan con cortesía.
  if (isOffTopic(question)) return { respuesta: OFF_TOPIC_ANSWER, funcion: null };
  if (/(flujo|disponible|como voy|cuanto me queda|neto)/.test(q)) {
    return {
      respuesta: `Este mes llevas ingresos por ${formatCop(c.mesActual.ingresos)}, gastos por ${formatCop(c.mesActual.gastos)} y pagos de deuda por ${formatCop(c.mesActual.pagosDeuda)}. Tu flujo neto es ${formatCop(c.mesActual.flujoNeto)} y tu disponible, ${formatCop(c.mesActual.disponible)}.`,
      funcion: 'movimientos',
    };
  }
  if (/(invert|acciones|cripto|bitcoin|rentabilidad|cdt)/.test(q)) {
    return { respuesta: 'No puedo recomendar inversiones ni prometer rendimientos. Puedo ayudarte a ver cuánto puedes ahorrar y a planear tus metas.', funcion: 'metas' };
  }
  if (/(credito|prestamo|financ|cuota|tasa|interes)/.test(q)) {
    return {
      respuesta: `Para decidir si financiar, usa el simulador: compara ahorrar, financiar o combinar con el costo total. Tu ahorro prudente es ${formatCop(c.capacidad.ahorroPrudente)} al mes, un buen punto de partida para el campo «¿cuánto puedes ahorrar?». No puedo garantizar que un banco te apruebe un crédito.`,
      funcion: 'simulador',
    };
  }
  if (/(deuda|debo|tarjeta)/.test(q)) {
    return c.deudas.cantidadActivas
      ? { respuesta: `Tienes ${c.deudas.cantidadActivas} ${c.deudas.cantidadActivas === 1 ? 'deuda activa' : 'deudas activas'} con un saldo total de ${formatCop(c.deudas.saldoTotal)} y cuotas de ${formatCop(c.deudas.cuotasDelMes)} al mes.${c.cargaDeuda ? ` Equivalen al ${pct(c.cargaDeuda.porcentajeDelIngreso)} de tu ingreso.` : ''}`, funcion: 'deudas' }
      : { respuesta: 'No tienes deudas registradas. Si tienes alguna, regístrala para incluir sus cuotas en tu plan.', funcion: 'deudas' };
  }
  if (/(meta|riesgo|lograr|alcanz)/.test(q)) {
    const plan = localPlan(c);
    return { respuesta: `${plan.resumen} ${plan.recomendacion}`, funcion: 'metas' };
  }
  if (/(gasto|gasté|gaste|recortar|ahorrar mas|en que)/.test(q)) {
    const top = c.gastosPorCategoria.slice(0, 3).map((g) => `${g.categoria} ${formatCop(g.total)} (${pct(g.porcentaje)})`);
    return {
      respuesta: top.length ? `Tus gastos más altos del mes son: ${top.join(', ')}. Revisar la primera categoría es lo que más impacto tendría.` : 'Aún no tienes gastos registrados este mes.',
      funcion: 'movimientos',
    };
  }
  const summary = localSummary(c);
  return { respuesta: `${summary.resumen} ${summary.recomendacion}`, funcion: null };
}

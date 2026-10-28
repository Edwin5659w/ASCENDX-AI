import type { AllowedFigures } from '@ascendx/finance-core';
import type { FinancialSnapshot } from '../finance/snapshot.service.js';

/**
 * Contexto que se entrega a la IA (sección 7): SOLO cifras ya calculadas por
 * finance-core y agregadas. Nunca incluye nombre, correo, identificadores de
 * la base de datos ni descripciones libres de los movimientos.
 */
export interface AiContext {
  mes: string;
  hoy: string;
  mesActual: {
    ingresos: number;
    gastos: number;
    pagosDeuda: number;
    aportesNetosMetas: number;
    flujoNeto: number;
    disponible: number;
  };
  capacidad: {
    base: string;
    explicacion: string;
    capacidadEstimada: number;
    ahorroPrudente: number;
    alerta: boolean;
  };
  promedios: { ingresoMensual: number | null; gastoMensual: number | null };
  cargaDeuda: { porcentajeDelIngreso: number; nivel: string } | null;
  fondoEmergencia: { ahorrado: number; mesesCubiertos: number | null } | null;
  gastosPorCategoria: { categoria: string; total: number; porcentaje: number }[];
  metas: {
    nombre: string;
    prioridad: string;
    estado: string;
    objetivo: number;
    ahorrado: number;
    falta: number;
    porcentaje: number;
    fechaDeseada: string | null;
    aporteRequeridoMensual: number | null;
    aporteAsignadoMensual: number | null;
    fechaProyectada: string | null;
    sugerencias: { fechaAlcanzable: string | null; aporteParaMantenerFecha: number | null } | null;
  }[];
  reparto: { ahorroPrudente: number; totalRequerido: number; alcanzaParaTodas: boolean; sobrante: number };
  deudas: {
    cantidadActivas: number;
    saldoTotal: number;
    cuotasDelMes: number;
    proximosPagos: { deuda: string; cuota: number | null; fecha: string }[];
  };
}

const round1 = (value: number) => Math.round(value * 10) / 10;

export function buildAiContext(snapshot: FinancialSnapshot): AiContext {
  return {
    mes: snapshot.month,
    hoy: snapshot.today,
    mesActual: {
      ingresos: snapshot.indicators.income,
      gastos: snapshot.indicators.expenses,
      pagosDeuda: snapshot.indicators.debtPayments,
      aportesNetosMetas: snapshot.indicators.netGoalContributions,
      flujoNeto: snapshot.indicators.netFlow,
      disponible: snapshot.indicators.available,
    },
    capacidad: {
      base: snapshot.capacity.base,
      explicacion: snapshot.capacity.explanation,
      capacidadEstimada: snapshot.capacity.capacity,
      ahorroPrudente: snapshot.capacity.prudentCapacity,
      alerta: snapshot.capacity.alert,
    },
    promedios: { ingresoMensual: snapshot.averages.income, gastoMensual: snapshot.averages.expenses },
    cargaDeuda: snapshot.debtLoad ? { porcentajeDelIngreso: round1(snapshot.debtLoad.ratio * 100), nivel: snapshot.debtLoad.level } : null,
    fondoEmergencia: snapshot.emergency ? { ahorrado: snapshot.emergency.saved, mesesCubiertos: snapshot.emergency.months } : null,
    gastosPorCategoria: snapshot.byCategory.slice(0, 6).map((item) => ({ categoria: item.category.name, total: item.total, porcentaje: item.percent })),
    metas: snapshot.goals
      .filter((goal) => goal.status !== 'cancelada')
      .map((goal) => ({
        nombre: goal.name,
        prioridad: goal.priority,
        estado: goal.status === 'activa' ? (goal.plan?.status ?? 'en_curso') : goal.status,
        objetivo: goal.targetAmount,
        ahorrado: goal.savedAmount,
        falta: Math.max(0, goal.targetAmount - goal.savedAmount),
        porcentaje: goal.plan?.progress.percent ?? round1(Math.min(100, (goal.savedAmount / Math.max(1, goal.targetAmount)) * 100)),
        fechaDeseada: goal.targetDate,
        aporteRequeridoMensual: goal.plan?.requiredMonthly ?? null,
        aporteAsignadoMensual: goal.plan?.assignedMonthly ?? null,
        fechaProyectada: goal.plan?.projectedDate ?? null,
        sugerencias: goal.plan?.suggestions
          ? { fechaAlcanzable: goal.plan.suggestions.reachableDate, aporteParaMantenerFecha: goal.plan.suggestions.contributionToKeepDate }
          : null,
      })),
    reparto: {
      ahorroPrudente: snapshot.allocation.prudentCapacity,
      totalRequerido: snapshot.allocation.totalRequired,
      alcanzaParaTodas: snapshot.allocation.allOnTrack,
      sobrante: snapshot.allocation.unassigned,
    },
    deudas: {
      cantidadActivas: snapshot.debts.count,
      saldoTotal: snapshot.debts.totalBalance,
      cuotasDelMes: snapshot.debts.monthlyInstallments,
      proximosPagos: snapshot.debts.upcoming.slice(0, 3).map((d) => ({ deuda: d.name, cuota: d.installment, fecha: d.nextPaymentDate })),
    },
  };
}

/** Todas las cifras del contexto: la respuesta de la IA solo puede usar estas. */
export function allowedFigures(context: AiContext, extraMoney: number[] = []): AllowedFigures {
  const money = new Set<number>(extraMoney);
  const percent = new Set<number>();
  const visit = (value: unknown, key = '') => {
    if (typeof value === 'number') {
      if (/porcentaje|percent/i.test(key)) percent.add(value);
      else if (!/meses/i.test(key)) money.add(value);
    } else if (Array.isArray(value)) value.forEach((item) => visit(item, key));
    else if (value && typeof value === 'object') for (const [k, v] of Object.entries(value)) visit(v, k);
  };
  visit(context);
  // El margen de imprevistos (20 %) y la referencia de carga de deuda (30 % y 40 %) son reglas conocidas.
  [20, 30, 40, 80].forEach((p) => percent.add(p));
  return { money: [...money].filter((n) => Number.isFinite(n)), percent: [...percent] };
}

/** Datos que se muestran al usuario como «datos usados» junto a la respuesta. */
export function dataUsed(context: AiContext) {
  const items: { label: string; value: number; kind: 'money' | 'percent' }[] = [
    { label: 'Ingresos del mes', value: context.mesActual.ingresos, kind: 'money' },
    { label: 'Gastos del mes', value: context.mesActual.gastos, kind: 'money' },
    { label: 'Ahorro prudente al mes', value: context.capacidad.ahorroPrudente, kind: 'money' },
  ];
  if (context.deudas.cantidadActivas) items.push({ label: 'Cuotas de deuda del mes', value: context.deudas.cuotasDelMes, kind: 'money' });
  if (context.cargaDeuda) items.push({ label: 'Carga de deuda', value: context.cargaDeuda.porcentajeDelIngreso, kind: 'percent' });
  if (context.metas.length) items.push({ label: 'Aporte requerido por tus metas', value: context.reparto.totalRequerido, kind: 'money' });
  return items;
}

import { addMonths, monthKey, todayInBogota } from '@ascendx/finance-core';
import request from 'supertest';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../../app.js';
import { prisma } from '../../lib/prisma.js';

const app = createApp();

async function newUser(email: string) {
  const res = await request(app).post('/api/auth/register').send({
    name: 'Laura Gómez',
    email,
    password: 'Clave segura 2026',
    isAdult: true,
    acceptTerms: true,
    acceptDataPolicy: true,
  });
  expect(res.status).toBe(201);
  const token = res.body.accessToken as string;
  const call = (method: 'get' | 'post' | 'patch' | 'delete', path: string, body?: object) => {
    const req = request(app)[method](`/api${path}`).set('Authorization', `Bearer ${token}`);
    return body === undefined ? req : req.send(body);
  };
  return { call, id: res.body.user.id as string };
}

async function categoryId(call: Awaited<ReturnType<typeof newUser>>['call'], name: string) {
  const res = await call('get', '/categories');
  const category = res.body.categories.find((c: { name: string }) => c.name === name);
  expect(category).toBeTruthy();
  return category.id as string;
}

const today = todayInBogota();

beforeEach(async () => {
  await prisma.user.deleteMany();
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('categorías (RF-10)', () => {
  it('muestra las 15 por defecto y permite crear, renombrar y archivar las propias', async () => {
    const { call } = await newUser('cat@example.com');
    const list = await call('get', '/categories');
    expect(list.body.categories.filter((c: { isDefault: boolean }) => c.isDefault)).toHaveLength(15);

    const created = await call('post', '/categories', { name: 'Mascotas', kind: 'gasto', color: '#22C55E' });
    expect(created.status).toBe(201);
    expect((await call('post', '/categories', { name: 'mascotas', kind: 'gasto' })).status).toBe(409);
    expect((await call('post', '/categories', { name: 'Mercado', kind: 'gasto' })).status).toBe(409);

    const id = created.body.category.id;
    expect((await call('patch', `/categories/${id}`, { name: 'Perros y gatos' })).body.category.name).toBe('Perros y gatos');

    await call('post', '/transactions', { type: 'gasto', amount: 40_000, date: today, categoryId: id });
    expect((await call('delete', `/categories/${id}`)).status).toBe(204);
    const after = await call('get', '/categories');
    expect(after.body.categories.some((c: { id: string }) => c.id === id)).toBe(false);
    // El movimiento conserva su categoría archivada en el historial
    const history = await call('get', '/transactions');
    expect(history.body.transactions[0].category.name).toBe('Perros y gatos');
  });

  it('no deja editar categorías del sistema', async () => {
    const { call } = await newUser('cat2@example.com');
    const mercado = await categoryId(call, 'Mercado');
    expect((await call('patch', `/categories/${mercado}`, { name: 'Otra' })).status).toBe(404);
  });
});

describe('movimientos (RF-07 a RF-09)', () => {
  it('crea, filtra con totales, edita y borra', async () => {
    const { call } = await newUser('mov@example.com');
    const salario = await categoryId(call, 'Salario');
    const mercado = await categoryId(call, 'Mercado');
    const month = monthKey(today);

    const income = await call('post', '/transactions', { type: 'ingreso', amount: 2_800_000, date: today, categoryId: salario });
    expect(income.status).toBe(201);
    await call('post', '/transactions', { type: 'gasto', amount: 50_000, date: today, categoryId: mercado, description: 'Mercado semana' });

    const all = await call('get', `/transactions?month=${month}`);
    expect(all.body.count).toBe(2);
    expect(all.body.totals).toMatchObject({ income: 2_800_000, expenses: 50_000, netFlow: 2_750_000 });

    const onlyExpenses = await call('get', `/transactions?month=${month}&type=gasto`);
    expect(onlyExpenses.body.transactions).toHaveLength(1);
    expect(onlyExpenses.body.transactions[0].category.name).toBe('Mercado');
    expect((await call('get', `/transactions?q=semana`)).body.transactions).toHaveLength(1);

    const id = onlyExpenses.body.transactions[0].id;
    const edited = await call('patch', `/transactions/${id}`, { amount: 65_000 });
    expect(edited.body.transaction.amount).toBe(65_000);

    expect((await call('delete', `/transactions/${id}`)).status).toBe(204);
    expect((await call('get', `/transactions?month=${month}`)).body.count).toBe(1);
  });

  it('valida que la categoría corresponda al tipo', async () => {
    const { call } = await newUser('mov2@example.com');
    const salario = await categoryId(call, 'Salario');
    const res = await call('post', '/transactions', { type: 'gasto', amount: 10_000, date: today, categoryId: salario });
    expect(res.status).toBe(400);
    expect(res.body.error.message).toMatch(/categoría de gasto/);
    expect((await call('post', '/transactions', { type: 'gasto', amount: -5, date: today })).status).toBe(400);
  });

  it('avisa de un posible duplicado y permite confirmarlo (RF-09)', async () => {
    const { call } = await newUser('dup@example.com');
    const mercado = await categoryId(call, 'Mercado');
    const body = { type: 'gasto', amount: 32_000, date: today, categoryId: mercado };
    expect((await call('post', '/transactions', body)).status).toBe(201);
    const second = await call('post', '/transactions', body);
    expect(second.status).toBe(409);
    expect(second.body.error.code).toBe('POSSIBLE_DUPLICATE');
    expect((await call('post', '/transactions', { ...body, confirmDuplicate: true })).status).toBe(201);
  });

  it('un reintento con el mismo client_op_id no duplica (RNF-12)', async () => {
    const { call } = await newUser('idem@example.com');
    const mercado = await categoryId(call, 'Mercado');
    const body = { type: 'gasto', amount: 21_000, date: today, categoryId: mercado, clientOpId: '7f1c6a5e-2f4b-4c1a-9d2e-3b5a6c7d8e9f' };
    const first = await call('post', '/transactions', body);
    const retry = await call('post', '/transactions', body);
    expect(first.status).toBe(201);
    expect(retry.status).toBe(200);
    expect(retry.body.transaction.id).toBe(first.body.transaction.id);
    expect((await call('get', '/transactions')).body.count).toBe(1);
  });
});

describe('deudas y pagos (RF-11, RF-12)', () => {
  it('calcula la cuota, reparte el pago entre intereses y capital, y revierte al borrar', async () => {
    const { call } = await newUser('debt@example.com');
    const created = await call('post', '/debts', {
      creditor: 'Banco Andino',
      name: 'Crédito moto',
      originalAmount: 5_000_000,
      rate: 0.02,
      rateType: 'MV',
      termMonths: 24,
      paymentDay: 15,
    });
    expect(created.status).toBe(201);
    // TC-04: P = $5.000.000, 2 % MV, 24 meses → cuota ≈ $264.355
    expect(created.body.debt.installment).toBe(264_355);
    expect(created.body.debt.effectiveAnnualRate).toBeCloseTo(0.268242, 5);
    const debtId = created.body.debt.id;

    const payment = await call('post', `/debts/${debtId}/payments`, { amount: 264_355, date: today });
    expect(payment.status).toBe(201);
    expect(payment.body.transaction).toMatchObject({ type: 'pago_deuda', interestAmount: 100_000, principalAmount: 164_355 });
    expect(payment.body.debt.balance).toBe(4_835_645);

    const detail = await call('get', `/debts/${debtId}`);
    expect(detail.body.totals).toMatchObject({ paid: 264_355, interest: 100_000, principal: 164_355 });

    // Un pago de deuda no cuenta como gasto
    const dashboard = await call('get', '/dashboard');
    expect(dashboard.body.indicators).toMatchObject({ expenses: 0, debtPayments: 264_355 });

    expect((await call('delete', `/transactions/${payment.body.transaction.id}`)).status).toBe(204);
    expect((await call('get', `/debts/${debtId}`)).body.debt.balance).toBe(5_000_000);
  });

  it('marca la deuda como pagada cuando el saldo llega a 0', async () => {
    const { call } = await newUser('debt2@example.com');
    const { body } = await call('post', '/debts', { creditor: 'Tía Marta', originalAmount: 300_000 });
    const paid = await call('post', `/debts/${body.debt.id}/payments`, { amount: 300_000 });
    expect(paid.body.debt).toMatchObject({ balance: 0, status: 'pagada', percentPaid: 100 });
    expect((await call('post', `/debts/${body.debt.id}/payments`, { amount: 1_000 })).status).toBe(400);
  });
});

describe('metas (RF-16 a RF-19)', () => {
  it('registra aportes y retiros sin dejar la meta en negativo', async () => {
    const { call } = await newUser('goal@example.com');
    const created = await call('post', '/goals', { name: 'Moto', targetAmount: 8_000_000, priority: 'alta' });
    expect(created.status).toBe(201);
    const goalId = created.body.goal.id;

    const deposit = await call('post', `/goals/${goalId}/movements`, { kind: 'aporte', amount: 2_000_000 });
    expect(deposit.body.goal.savedAmount).toBe(2_000_000);
    expect(deposit.body.goal.plan.progress.percent).toBe(25);
    expect(deposit.body.goal.plan.progress.milestones).toEqual([25]);

    const tooMuch = await call('post', `/goals/${goalId}/movements`, { kind: 'retiro', amount: 3_000_000 });
    expect(tooMuch.status).toBe(400);

    await call('post', `/goals/${goalId}/movements`, { kind: 'retiro', amount: 500_000 });
    const detail = await call('get', `/goals/${goalId}`);
    expect(detail.body.goal.savedAmount).toBe(1_500_000);
    expect(detail.body.movements).toHaveLength(2);
  });

  it('completa la meta al llegar al objetivo', async () => {
    const { call } = await newUser('goal2@example.com');
    const { body } = await call('post', '/goals', { name: 'Curso', targetAmount: 600_000 });
    const res = await call('post', `/goals/${body.goal.id}/movements`, { kind: 'aporte', amount: 600_000 });
    expect(res.body.goal.status).toBe('completada');
  });

  it('reparte la capacidad prudente por prioridad y marca en riesgo con sugerencias (TC-05)', async () => {
    const { call } = await newUser('goal3@example.com');
    // Perfil: CA = 2.800.000 − 1.800.000 = 1.000.000; CP = 800.000
    await call('patch', '/me/profile', { estimatedIncome: 2_800_000, estimatedFixedExpenses: 1_800_000 });
    const inTenMonths = addMonths(today, 10);
    const high = await call('post', '/goals', { name: 'Fondo de emergencia', targetAmount: 6_000_000, targetDate: inTenMonths, priority: 'alta', isEmergencyFund: true });
    const low = await call('post', '/goals', { name: 'Viaje', targetAmount: 4_000_000, targetDate: inTenMonths, priority: 'baja' });

    const goals = await call('get', '/goals');
    expect(goals.body.capacity).toMatchObject({ base: 'perfil', prudentCapacity: 800_000 });
    const plan = (id: string) => goals.body.goals.find((g: { id: string }) => g.id === id).plan;
    expect(plan(high.body.goal.id)).toMatchObject({ status: 'en_curso', requiredMonthly: 600_000, assignedMonthly: 600_000 });
    expect(plan(low.body.goal.id)).toMatchObject({ status: 'en_riesgo', requiredMonthly: 400_000, assignedMonthly: 200_000 });
    expect(plan(low.body.goal.id).suggestions.contributionToKeepDate).toBe(400_000);
    expect(goals.body.allocation.allOnTrack).toBe(false);

    expect((await call('post', '/goals', { name: 'Otro fondo', targetAmount: 1_000, isEmergencyFund: true })).status).toBe(409);
  });
});

describe('panel (RF-13 a RF-15)', () => {
  it('usa el historial de meses completos cuando existen y calcula gastos por categoría', async () => {
    const { call } = await newUser('panel@example.com');
    const salario = await categoryId(call, 'Salario');
    const mercado = await categoryId(call, 'Mercado');
    const transporte = await categoryId(call, 'Transporte');
    const first = `${monthKey(today)}-01`;
    for (const offset of [-3, -2, -1]) {
      const day = addMonths(first, offset);
      await call('post', '/transactions', { type: 'ingreso', amount: 3_000_000, date: day, categoryId: salario });
      await call('post', '/transactions', { type: 'gasto', amount: 2_000_000, date: day, categoryId: mercado, confirmDuplicate: true });
    }
    await call('post', '/transactions', { type: 'gasto', amount: 300_000, date: today, categoryId: mercado, confirmDuplicate: true });
    await call('post', '/transactions', { type: 'gasto', amount: 100_000, date: today, categoryId: transporte });

    const res = await call('get', '/dashboard');
    expect(res.status).toBe(200);
    expect(res.body.capacity).toMatchObject({ base: 'historial', monthsUsed: 3, capacity: 1_000_000, prudentCapacity: 800_000 });
    expect(res.body.indicators.expenses).toBe(400_000);
    expect(res.body.byCategory.map((c: { category: { name: string }; percent: number }) => [c.category.name, c.percent])).toEqual([
      ['Mercado', 75],
      ['Transporte', 25],
    ]);
    expect(res.body.evolution).toHaveLength(6);
    expect(res.body.evolution.at(-2)).toMatchObject({ income: 3_000_000, expenses: 2_000_000, netFlow: 1_000_000 });
    expect(res.body.recent).toHaveLength(5);
  });

  it('sin datos muestra un estado vacío honesto', async () => {
    const { call } = await newUser('empty@example.com');
    const res = await call('get', '/dashboard');
    expect(res.body).toMatchObject({ hasMovements: false, priorityGoal: null, recent: [] });
    expect(res.body.capacity.base).toBe('sin_datos');
  });
});

describe('escenarios guardados (RF-22)', () => {
  it('guarda entradas, resultados y versión del motor', async () => {
    const { call } = await newUser('sc@example.com');
    const input = { price: 12_000_000, monthlySaving: 500_000, rate: 0.24, rateType: 'EA', termMonths: 36 };
    const saved = await call('post', '/simulator/scenarios', { name: 'Moto 36 meses', input });
    expect(saved.status).toBe(201);
    expect(saved.body.scenario.engineVersion).toBe('2.0.0');
    expect(saved.body.scenario.results.credit.installment).toBeGreaterThan(0);
    const list = await call('get', '/simulator/scenarios');
    expect(list.body.scenarios).toHaveLength(1);
    expect((await call('delete', `/simulator/scenarios/${saved.body.scenario.id}`)).status).toBe(204);
  });
});

describe('aislamiento entre usuarios (RNF-01, TC-02)', () => {
  it('el usuario B no puede ver ni cambiar datos del usuario A', async () => {
    const a = await newUser('a@example.com');
    const b = await newUser('b@example.com');
    const mercado = await categoryId(a.call, 'Mercado');
    const tx = await a.call('post', '/transactions', { type: 'gasto', amount: 10_000, date: today, categoryId: mercado });
    const debt = await a.call('post', '/debts', { creditor: 'Banco', originalAmount: 1_000_000 });
    const goal = await a.call('post', '/goals', { name: 'Moto', targetAmount: 1_000_000 });
    const custom = await a.call('post', '/categories', { name: 'Privada', kind: 'gasto' });
    const scenario = await a.call('post', '/simulator/scenarios', {
      name: 'Escenario X',
      input: { price: 1_000_000, monthlySaving: 100_000, rate: 0.2, rateType: 'EA', termMonths: 12 },
    });

    const txId = tx.body.transaction.id;
    expect((await b.call('get', `/transactions/${txId}`)).status).toBe(404);
    expect((await b.call('patch', `/transactions/${txId}`, { amount: 1 })).status).toBe(404);
    expect((await b.call('delete', `/transactions/${txId}`)).status).toBe(404);
    expect((await b.call('get', '/transactions')).body.count).toBe(0);
    expect((await b.call('get', `/debts/${debt.body.debt.id}`)).status).toBe(404);
    expect((await b.call('post', `/debts/${debt.body.debt.id}/payments`, { amount: 1_000 })).status).toBe(404);
    expect((await b.call('get', `/goals/${goal.body.goal.id}`)).status).toBe(404);
    expect((await b.call('post', `/goals/${goal.body.goal.id}/movements`, { kind: 'aporte', amount: 1 })).status).toBe(404);
    expect((await b.call('get', `/simulator/scenarios/${scenario.body.scenario.id}`)).status).toBe(404);
    // No puede usar la categoría privada de A ni registrar pagos a su deuda vía /transactions
    expect((await b.call('post', '/transactions', { type: 'gasto', amount: 1_000, date: today, categoryId: custom.body.category.id })).status).toBe(400);
    expect((await b.call('post', '/transactions', { type: 'pago_deuda', amount: 1_000, date: today, debtId: debt.body.debt.id })).status).toBe(400);
    expect((await b.call('get', '/categories')).body.categories.some((c: { name: string }) => c.name === 'Privada')).toBe(false);
    expect((await b.call('get', '/dashboard')).body.hasMovements).toBe(false);
  });
});

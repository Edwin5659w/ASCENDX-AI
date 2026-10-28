import { addDays, addMonths, todayInBogota } from '@ascendx/finance-core';
import request from 'supertest';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../../app.js';
import { prisma } from '../../lib/prisma.js';

const app = createApp();
const today = todayInBogota();

async function newUser(email: string) {
  const res = await request(app).post('/api/auth/register').send({
    name: 'Andrés Gómez',
    email,
    password: 'Clave segura 2026',
    isAdult: true,
    acceptTerms: true,
    acceptDataPolicy: true,
  });
  const token = res.body.accessToken as string;
  const call = (method: 'get' | 'post' | 'patch' | 'delete', path: string, body?: object) => {
    const req = request(app)[method](`/api${path}`).set('Authorization', `Bearer ${token}`);
    return body === undefined ? req : req.send(body);
  };
  const categories = (await call('get', '/categories')).body.categories as { id: string; name: string }[];
  const category = (name: string) => categories.find((c) => c.name === name)!.id;
  return { call, category };
}

beforeEach(async () => {
  await prisma.user.deleteMany();
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('cuentas (RF-31)', () => {
  it('calcula el saldo con los movimientos asociados y archiva sin borrar historia', async () => {
    const { call, category } = await newUser('cuentas@example.com');
    const created = await call('post', '/accounts', { name: 'Nequi', kind: 'billetera', initialBalance: 100_000 });
    expect(created.status).toBe(201);
    const id = created.body.account.id;
    expect((await call('post', '/accounts', { name: 'nequi', kind: 'banco' })).status).toBe(409);

    await call('post', '/transactions', { type: 'ingreso', amount: 500_000, date: today, categoryId: category('Salario'), accountId: id });
    await call('post', '/transactions', { type: 'gasto', amount: 80_000, date: today, categoryId: category('Mercado'), accountId: id });
    await call('post', '/transactions', { type: 'gasto', amount: 30_000, date: today, categoryId: category('Transporte') });

    const list = await call('get', '/accounts');
    expect(list.body.accounts[0]).toMatchObject({ name: 'Nequi', balance: 520_000, movements: 2 });

    expect((await call('delete', `/accounts/${id}`)).status).toBe(204);
    expect((await call('get', '/accounts')).body.accounts).toHaveLength(0);
    const movements = await call('get', '/transactions');
    expect(movements.body.transactions.filter((t: { account: unknown }) => t.account)).toHaveLength(2);
  });

  it('no deja usar la cuenta de otro usuario', async () => {
    const a = await newUser('ca@example.com');
    const b = await newUser('cb@example.com');
    const account = await a.call('post', '/accounts', { name: 'Bancolombia', kind: 'banco' });
    const res = await b.call('post', '/transactions', { type: 'gasto', amount: 1_000, date: today, categoryId: b.category('Mercado'), accountId: account.body.account.id });
    expect(res.status).toBe(400);
    expect((await b.call('delete', `/accounts/${account.body.account.id}`)).status).toBe(404);
  });
});

describe('movimientos recurrentes (RF-30)', () => {
  it('crea los movimientos vencidos una sola vez y avanza la próxima fecha', async () => {
    const { call, category } = await newUser('recurrente@example.com');
    const start = addMonths(today, -2);
    const res = await call('post', '/recurring', {
      type: 'gasto',
      amount: 900_000,
      categoryId: category('Vivienda'),
      description: 'Arriendo',
      frequency: 'mensual',
      startDate: start,
    });
    expect(res.status).toBe(201);
    expect(res.body.created).toBe(3);
    expect(res.body.rule.nextDate).toBe(addMonths(start, 3));

    // Volver a ejecutar (o abrir el panel) no duplica.
    expect((await call('post', '/recurring/run')).body.created).toBe(0);
    await call('get', '/dashboard');
    const movements = await call('get', '/transactions');
    expect(movements.body.transactions).toHaveLength(3);
    expect(movements.body.transactions.every((t: { source: string }) => t.source === 'recurrente')).toBe(true);

    const list = await call('get', '/recurring');
    expect(list.body.monthly).toEqual({ income: 0, expenses: 900_000 });
  });

  it('al reactivar una regla pausada no crea las fechas que pasaron', async () => {
    const { call, category } = await newUser('pausa@example.com');
    const rule = await call('post', '/recurring', {
      type: 'ingreso',
      amount: 1_400_000,
      categoryId: category('Salario'),
      frequency: 'quincenal',
      startDate: addDays(today, 1),
    });
    expect(rule.body.created).toBe(0);
    const id = rule.body.rule.id;
    await call('patch', `/recurring/${id}`, { active: false });
    await prisma.recurringTransaction.update({ where: { id }, data: { nextDate: new Date(`${addMonths(today, -3)}T00:00:00Z`) } });
    const resumed = await call('patch', `/recurring/${id}`, { active: true });
    expect(resumed.body.rule.active).toBe(true);
    expect(resumed.body.created).toBeLessThanOrEqual(1);
    expect(resumed.body.rule.nextDate >= today).toBe(true);
    expect((await call('delete', `/recurring/${id}`)).status).toBe(204);
  });
});

describe('racha y logros (RF-32)', () => {
  it('otorga hitos por registrar y ahorrar, y los conserva', async () => {
    const { call, category } = await newUser('logros@example.com');
    let habits = await call('get', '/habits');
    expect(habits.body.earnedCount).toBe(0);
    expect(habits.body.streak).toMatchObject({ current: 0, best: 0 });

    await call('post', '/transactions', { type: 'ingreso', amount: 2_000_000, date: today, categoryId: category('Salario') });
    const goal = await call('post', '/goals', { name: 'Viaje', targetAmount: 300_000, priority: 'media' });
    await call('post', `/goals/${goal.body.goal.id}/movements`, { kind: 'aporte', amount: 300_000, date: today });

    habits = await call('get', '/habits');
    const byCode = Object.fromEntries(habits.body.achievements.map((a: { code: string }) => [a.code, a]));
    expect(habits.body.newlyEarned).toEqual(expect.arrayContaining(['primer_registro', 'primera_meta', 'primer_aporte', 'meta_cumplida']));
    expect(byCode.primer_registro.earnedAt).toBeTruthy();
    expect(habits.body.streak).toMatchObject({ current: 1, activeThisWeek: true });

    // Si borra el movimiento, el logro ya ganado se mantiene.
    const list = await call('get', '/transactions?type=ingreso');
    await call('delete', `/transactions/${list.body.transactions[0].id}`);
    habits = await call('get', '/habits');
    expect(habits.body.newlyEarned).toEqual([]);
    expect(habits.body.achievements.find((a: { code: string }) => a.code === 'primer_registro').earned).toBe(true);
  });
});

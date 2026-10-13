import request from 'supertest';
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { createApp } from '../../app.js';
import { mailer } from '../../lib/mailer.js';
import { prisma } from '../../lib/prisma.js';

const app = createApp();

const validUser = {
  name: 'Ana Pérez',
  email: 'Ana.Perez@Example.com',
  password: 'Clave segura 2026',
  isAdult: true,
  acceptTerms: true,
  acceptDataPolicy: true,
  deviceName: 'Pixel 8',
};

function registerUser(overrides: Record<string, unknown> = {}) {
  return request(app)
    .post('/api/auth/register')
    .send({ ...validUser, ...overrides });
}

function login(email: string, password: string) {
  return request(app).post('/api/auth/login').send({ email, password });
}

/** Captura el código que se "envía" por correo (en pruebas no se envía nada). */
function captureResetCode() {
  const spy = vi.spyOn(mailer, 'send').mockResolvedValue();
  return {
    code: () => /(\d{6})/.exec(spy.mock.calls.at(-1)?.[0].text ?? '')?.[1] ?? '',
    restore: () => spy.mockRestore(),
  };
}

beforeEach(async () => {
  await prisma.user.deleteMany();
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('registro (RF-01)', () => {
  it('crea la cuenta con consentimientos versionados, perfil y sesión por dispositivo', async () => {
    const res = await registerUser();
    expect(res.status).toBe(201);
    expect(res.body.user.email).toBe('ana.perez@example.com');
    expect(res.body.user.isAdult).toBe(true);
    expect(res.body.user.consents.terminos.granted).toBe(true);
    expect(res.body.user.consents.datos.version).toBe('2026-10');
    expect(res.body.user.consents.ia.granted).toBe(false);
    expect(res.body.user.financialProfile.safetyMargin).toBe(0.8);
    expect(JSON.stringify(res.body)).not.toMatch(/passwordHash|failedLoginAttempts/);

    const stored = await prisma.user.findUniqueOrThrow({ where: { email: 'ana.perez@example.com' }, include: { sessions: true } });
    expect(stored.passwordHash.startsWith('$argon2id$')).toBe(true);
    expect(stored.sessions[0]?.deviceName).toBe('Pixel 8');
  });

  it('rechaza correos duplicados', async () => {
    await registerUser();
    const res = await registerUser({ email: 'ana.perez@example.com' });
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('EMAIL_IN_USE');
  });

  it('exige mayoría de edad, términos y tratamiento de datos', async () => {
    for (const field of ['isAdult', 'acceptTerms', 'acceptDataPolicy']) {
      const res = await registerUser({ [field]: false });
      expect(res.status).toBe(400);
      expect(res.body.error.details[0].path).toBe(field);
    }
  });

  it('rechaza contraseñas de menos de 8 caracteres o sin números', async () => {
    expect((await registerUser({ password: 'abc123' })).status).toBe(400);
    expect((await registerUser({ password: 'solotexto' })).status).toBe(400);
  });
});

describe('inicio de sesión y bloqueo (RF-02)', () => {
  it('inicia sesión sin importar mayúsculas en el correo', async () => {
    await registerUser();
    const res = await login('ANA.PEREZ@example.com', validUser.password);
    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBeTypeOf('string');
  });

  it('responde el mismo error para contraseña incorrecta y correo inexistente', async () => {
    await registerUser();
    const wrong = await login(validUser.email, 'Otra clave 123');
    const unknown = await login('nadie@example.com', 'Otra clave 123');
    expect(wrong.status).toBe(401);
    expect(wrong.body).toEqual(unknown.body);
  });

  it('bloquea 15 minutos tras 5 intentos fallidos, incluso con la contraseña correcta', async () => {
    await registerUser();
    for (let i = 0; i < 4; i++) expect((await login(validUser.email, 'Mala clave 1')).status).toBe(401);
    const fifth = await login(validUser.email, 'Mala clave 1');
    expect(fifth.status).toBe(423);
    expect(fifth.body.error.code).toBe('ACCOUNT_LOCKED');
    expect(fifth.body.error.details.retryAfterMinutes).toBe(15);

    const correct = await login(validUser.email, validUser.password);
    expect(correct.status).toBe(423);

    // Al vencer el bloqueo, vuelve a funcionar y el contador se reinicia
    await prisma.user.update({ where: { email: 'ana.perez@example.com' }, data: { lockedUntil: new Date(Date.now() - 1000) } });
    expect((await login(validUser.email, validUser.password)).status).toBe(200);
    const user = await prisma.user.findUniqueOrThrow({ where: { email: 'ana.perez@example.com' } });
    expect(user.failedLoginAttempts).toBe(0);
    expect(user.lockedUntil).toBeNull();
  });
});

describe('rutas protegidas y aislamiento entre usuarios (RNF-01)', () => {
  it('rechaza peticiones sin token o con token inválido', async () => {
    expect((await request(app).get('/api/me')).status).toBe(401);
    expect((await request(app).get('/api/me').set('Authorization', 'Bearer abc.def.ghi')).status).toBe(401);
  });

  it('cada usuario solo ve y modifica sus propios datos', async () => {
    const ana = await registerUser();
    const luis = await registerUser({ email: 'luis@example.com', name: 'Luis Gómez' });

    await request(app)
      .patch('/api/me/profile')
      .set('Authorization', `Bearer ${ana.body.accessToken}`)
      .send({ estimatedIncome: 3_500_000 });

    const meLuis = await request(app).get('/api/me').set('Authorization', `Bearer ${luis.body.accessToken}`);
    expect(meLuis.body.user.email).toBe('luis@example.com');
    expect(meLuis.body.user.financialProfile.estimatedIncome).toBeNull();
  });
});

describe('renovación y cierre de sesión', () => {
  it('rota el token de renovación y el anterior deja de servir', async () => {
    const { body: session } = await registerUser();
    const first = await request(app).post('/api/auth/refresh').send({ refreshToken: session.refreshToken });
    expect(first.status).toBe(200);
    expect(first.body.refreshToken).not.toBe(session.refreshToken);
    expect((await request(app).post('/api/auth/refresh').send({ refreshToken: session.refreshToken })).status).toBe(401);
  });

  it('si se reutiliza un token revocado, se cierran todas las sesiones', async () => {
    const { body: session } = await registerUser();
    const rotated = await request(app).post('/api/auth/refresh').send({ refreshToken: session.refreshToken });
    await request(app).post('/api/auth/refresh').send({ refreshToken: session.refreshToken });
    expect((await request(app).post('/api/auth/refresh').send({ refreshToken: rotated.body.refreshToken })).status).toBe(401);
  });

  it('cerrar sesión invalida el token de renovación', async () => {
    const { body: session } = await registerUser();
    expect((await request(app).post('/api/auth/logout').send({ refreshToken: session.refreshToken })).status).toBe(204);
    expect((await request(app).post('/api/auth/refresh').send({ refreshToken: session.refreshToken })).status).toBe(401);
  });
});

describe('recuperación de contraseña (RF-03)', () => {
  it('responde igual exista o no el correo', async () => {
    const mail = captureResetCode();
    await registerUser();
    const existing = await request(app).post('/api/auth/password/forgot').send({ email: validUser.email });
    const missing = await request(app).post('/api/auth/password/forgot').send({ email: 'nadie@example.com' });
    expect(existing.status).toBe(202);
    expect(missing.body).toEqual(existing.body);
    expect(mail.code()).toMatch(/^\d{6}$/);
    mail.restore();
  });

  it('cambia la contraseña con el código, lo invalida y cierra las sesiones abiertas', async () => {
    const mail = captureResetCode();
    const { body: session } = await registerUser();
    await request(app).post('/api/auth/password/forgot').send({ email: validUser.email });
    const code = mail.code();

    const reset = await request(app)
      .post('/api/auth/password/reset')
      .send({ email: validUser.email, code, newPassword: 'Nueva clave 2026' });
    expect(reset.status).toBe(204);

    expect((await login(validUser.email, validUser.password)).status).toBe(401);
    expect((await login(validUser.email, 'Nueva clave 2026')).status).toBe(200);
    expect((await request(app).post('/api/auth/refresh').send({ refreshToken: session.refreshToken })).status).toBe(401);

    // Un solo uso
    const reuse = await request(app)
      .post('/api/auth/password/reset')
      .send({ email: validUser.email, code, newPassword: 'Otra clave 2026' });
    expect(reuse.status).toBe(400);
    mail.restore();
  });

  it('admite máximo 5 intentos y luego exige un código nuevo', async () => {
    const mail = captureResetCode();
    await registerUser();
    await request(app).post('/api/auth/password/forgot').send({ email: validUser.email });
    const good = mail.code();
    const bad = good === '000000' ? '111111' : '000000';

    const first = await request(app).post('/api/auth/password/reset').send({ email: validUser.email, code: bad, newPassword: 'Nueva clave 2026' });
    expect(first.body.error.message).toMatch(/quedan 4 intentos/);
    for (let i = 0; i < 4; i++) {
      await request(app).post('/api/auth/password/reset').send({ email: validUser.email, code: bad, newPassword: 'Nueva clave 2026' });
    }
    const afterLimit = await request(app)
      .post('/api/auth/password/reset')
      .send({ email: validUser.email, code: good, newPassword: 'Nueva clave 2026' });
    expect(afterLimit.status).toBe(400);
    mail.restore();
  });

  it('el código vence a los 15 minutos', async () => {
    const mail = captureResetCode();
    await registerUser();
    await request(app).post('/api/auth/password/forgot').send({ email: validUser.email });
    await prisma.passwordReset.updateMany({ data: { expiresAt: new Date(Date.now() - 1000) } });
    const res = await request(app)
      .post('/api/auth/password/reset')
      .send({ email: validUser.email, code: mail.code(), newPassword: 'Nueva clave 2026' });
    expect(res.status).toBe(400);
    mail.restore();
  });
});

describe('perfil, permisos y eliminación de cuenta', () => {
  it('guarda el perfil financiero en pesos enteros y rechaza montos negativos (RF-04)', async () => {
    const { body: session } = await registerUser();
    const auth = { Authorization: `Bearer ${session.accessToken}` };
    const ok = await request(app).patch('/api/me/profile').set(auth).send({ estimatedIncome: 3_500_000, estimatedFixedExpenses: 2_100_000, payDay: 30 });
    expect(ok.body.user.financialProfile).toMatchObject({ estimatedIncome: 3_500_000, estimatedFixedExpenses: 2_100_000, payDay: 30 });
    expect((await request(app).patch('/api/me/profile').set(auth).send({ estimatedIncome: -1 })).status).toBe(400);
    expect((await request(app).patch('/api/me/profile').set(auth).send({ estimatedIncome: 10.5 })).status).toBe(400);
  });

  it('autoriza y revoca IA y OCR por separado (RF-06)', async () => {
    const { body: session } = await registerUser();
    const auth = { Authorization: `Bearer ${session.accessToken}` };
    const granted = await request(app).patch('/api/me/consents').set(auth).send({ ia: true, ocr: true });
    expect(granted.body.user.consents.ia.granted).toBe(true);
    expect(granted.body.user.consents.ocr.version).toBe('2026-10');
    const revoked = await request(app).patch('/api/me/consents').set(auth).send({ ia: false });
    expect(revoked.body.user.consents.ia.granted).toBe(false);
    expect(revoked.body.user.consents.ocr.granted).toBe(true);
  });

  it('elimina la cuenta y todos sus registros con la contraseña correcta (RF-05)', async () => {
    const { body: session } = await registerUser();
    const auth = { Authorization: `Bearer ${session.accessToken}` };
    expect((await request(app).delete('/api/me').set(auth).send({ password: 'incorrecta1' })).status).toBe(401);
    expect((await request(app).delete('/api/me').set(auth).send({ password: validUser.password })).status).toBe(204);
    expect(await prisma.user.count()).toBe(0);
    expect(await prisma.session.count()).toBe(0);
    expect(await prisma.consent.count()).toBe(0);
    expect(await prisma.financialProfile.count()).toBe(0);
  });
});

describe('simulador (RF-20)', () => {
  it('compara crédito, ahorro y mixto', async () => {
    const { body: session } = await registerUser();
    const res = await request(app)
      .post('/api/simulator/compare')
      .set('Authorization', `Bearer ${session.accessToken}`)
      .send({
        price: 60_000_000,
        downPayment: 12_000_000,
        currentSavings: 6_000_000,
        monthlySaving: 1_500_000,
        rate: 0.18,
        rateType: 'EA',
        termMonths: 48,
      });
    expect(res.status).toBe(200);
    expect(res.body.credit.financedAmount).toBe(54_000_000);
    expect(res.body.mixed.monthsToOwnership).toBe(4);
    expect(res.body.saving.months).toBe(36);
    expect(res.body.credit.schedule).toBeUndefined();
    expect(res.body.engineVersion).toBe('2.0.0');
  });

  it('muestra el aviso de usura cuando hay una tasa de referencia registrada', async () => {
    await prisma.appSettings.upsert({
      where: { id: 1 },
      create: { id: 1, usuryRateReference: 0.25, usuryRateDate: new Date('2026-10-01') },
      update: { usuryRateReference: 0.25, usuryRateDate: new Date('2026-10-01') },
    });
    const { body: session } = await registerUser();
    const res = await request(app)
      .post('/api/simulator/compare')
      .set('Authorization', `Bearer ${session.accessToken}`)
      .send({ price: 10_000_000, monthlySaving: 500_000, rate: 0.3, rateType: 'EA', termMonths: 24 });
    expect(res.body.warnings.map((w: { code: string }) => w.code)).toContain('USURY_EXCEEDED');
    await prisma.appSettings.update({ where: { id: 1 }, data: { usuryRateReference: null, usuryRateDate: null } });
  });

  it('valida las entradas: pesos enteros, tasa ≤ 100 % E.A., cuota inicial ≤ precio', async () => {
    const { body: session } = await registerUser();
    const send = (body: object) =>
      request(app).post('/api/simulator/compare').set('Authorization', `Bearer ${session.accessToken}`).send(body);
    const base = { price: 1_000_000, monthlySaving: 100_000, rate: 0.2, rateType: 'EA', termMonths: 12 };
    expect((await send({ ...base, downPayment: 2_000_000 })).status).toBe(400);
    expect((await send({ ...base, price: 1_000_000.5 })).status).toBe(400);
    expect((await send({ ...base, rate: 1.5 })).status).toBe(400);
  });
});

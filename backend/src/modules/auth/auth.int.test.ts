import request from 'supertest';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../../app.js';
import { prisma } from '../../lib/prisma.js';

const app = createApp();

const validUser = {
  email: 'Ana.Perez@Example.com',
  password: 'Clave segura 2026',
  fullName: 'Ana Pérez',
  acceptPrivacyPolicy: true,
};

async function registerUser(overrides: Partial<typeof validUser> = {}) {
  return request(app)
    .post('/api/auth/register')
    .send({ ...validUser, ...overrides });
}

beforeEach(async () => {
  await prisma.user.deleteMany();
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('registro', () => {
  it('crea la cuenta, normaliza el correo y devuelve tokens sin exponer el hash', async () => {
    const res = await registerUser();
    expect(res.status).toBe(201);
    expect(res.body.user.email).toBe('ana.perez@example.com');
    expect(res.body.user.consents.privacyAcceptedAt).toBeTruthy();
    expect(res.body.accessToken).toBeTypeOf('string');
    expect(res.body.refreshToken).toBeTypeOf('string');
    expect(JSON.stringify(res.body)).not.toContain('passwordHash');

    const stored = await prisma.user.findUniqueOrThrow({
      where: { email: 'ana.perez@example.com' },
      include: { financialProfile: true },
    });
    expect(stored.passwordHash).not.toBe(validUser.password);
    expect(stored.financialProfile?.currency).toBe('COP');
  });

  it('rechaza correos duplicados', async () => {
    await registerUser();
    const res = await registerUser({ email: 'ana.perez@example.com' });
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('EMAIL_IN_USE');
  });

  it('exige aceptar la política de datos', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ ...validUser, acceptPrivacyPolicy: false });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('rechaza contraseñas débiles', async () => {
    const res = await registerUser({ password: 'solotexto' });
    expect(res.status).toBe(400);
  });
});

describe('inicio de sesión', () => {
  it('inicia sesión con credenciales válidas', async () => {
    await registerUser();
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'ANA.PEREZ@example.com', password: validUser.password });
    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBeTypeOf('string');
  });

  it('responde el mismo error para contraseña incorrecta y correo inexistente', async () => {
    await registerUser();
    const wrongPassword = await request(app)
      .post('/api/auth/login')
      .send({ email: validUser.email, password: 'Otra clave 123' });
    const unknownEmail = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nadie@example.com', password: 'Otra clave 123' });
    expect(wrongPassword.status).toBe(401);
    expect(unknownEmail.status).toBe(401);
    expect(wrongPassword.body).toEqual(unknownEmail.body);
  });
});

describe('rutas protegidas', () => {
  it('rechaza peticiones sin token o con token inválido', async () => {
    expect((await request(app).get('/api/me')).status).toBe(401);
    expect((await request(app).get('/api/me').set('Authorization', 'Bearer abc.def.ghi')).status).toBe(401);
  });

  it('cada usuario solo ve sus propios datos', async () => {
    const ana = await registerUser();
    const luis = await registerUser({ email: 'luis@example.com', fullName: 'Luis Gómez' });

    const meAna = await request(app).get('/api/me').set('Authorization', `Bearer ${ana.body.accessToken}`);
    const meLuis = await request(app).get('/api/me').set('Authorization', `Bearer ${luis.body.accessToken}`);
    expect(meAna.body.user.email).toBe('ana.perez@example.com');
    expect(meLuis.body.user.email).toBe('luis@example.com');
  });
});

describe('renovación y cierre de sesión', () => {
  it('rota el refresh token: el anterior deja de servir', async () => {
    const { body: session } = await registerUser();

    const first = await request(app).post('/api/auth/refresh').send({ refreshToken: session.refreshToken });
    expect(first.status).toBe(200);
    expect(first.body.refreshToken).not.toBe(session.refreshToken);

    const reuse = await request(app).post('/api/auth/refresh').send({ refreshToken: session.refreshToken });
    expect(reuse.status).toBe(401);
  });

  it('si se reutiliza un token revocado, se cierran todas las sesiones', async () => {
    const { body: session } = await registerUser();
    const rotated = await request(app).post('/api/auth/refresh').send({ refreshToken: session.refreshToken });

    // Un atacante reutiliza el token viejo…
    await request(app).post('/api/auth/refresh').send({ refreshToken: session.refreshToken });

    // …y el token legítimo más reciente también queda revocado.
    const legit = await request(app).post('/api/auth/refresh').send({ refreshToken: rotated.body.refreshToken });
    expect(legit.status).toBe(401);
  });

  it('cerrar sesión revoca el refresh token', async () => {
    const { body: session } = await registerUser();
    const logout = await request(app).post('/api/auth/logout').send({ refreshToken: session.refreshToken });
    expect(logout.status).toBe(204);
    const res = await request(app).post('/api/auth/refresh').send({ refreshToken: session.refreshToken });
    expect(res.status).toBe(401);
  });
});

describe('cuenta', () => {
  it('otorga y retira consentimientos de IA y OCR', async () => {
    const { body: session } = await registerUser();
    const auth = { Authorization: `Bearer ${session.accessToken}` };

    const granted = await request(app).patch('/api/me/consents').set(auth).send({ ai: true, ocr: true });
    expect(granted.body.user.consents.aiConsentAt).toBeTruthy();
    expect(granted.body.user.consents.ocrConsentAt).toBeTruthy();

    const revoked = await request(app).patch('/api/me/consents').set(auth).send({ ai: false });
    expect(revoked.body.user.consents.aiConsentAt).toBeNull();
    expect(revoked.body.user.consents.ocrConsentAt).toBeTruthy();
  });

  it('elimina la cuenta y sus datos solo con la contraseña correcta', async () => {
    const { body: session } = await registerUser();
    const auth = { Authorization: `Bearer ${session.accessToken}` };

    const wrong = await request(app).delete('/api/me').set(auth).send({ password: 'incorrecta1' });
    expect(wrong.status).toBe(401);

    const ok = await request(app).delete('/api/me').set(auth).send({ password: validUser.password });
    expect(ok.status).toBe(204);
    expect(await prisma.user.count()).toBe(0);
    expect(await prisma.financialProfile.count()).toBe(0);
    expect(await prisma.refreshToken.count()).toBe(0);
  });
});

describe('simulador', () => {
  it('compara ahorro vs financiación para un usuario autenticado', async () => {
    const { body: session } = await registerUser();
    const res = await request(app)
      .post('/api/simulator/compare')
      .set('Authorization', `Bearer ${session.accessToken}`)
      .send({
        assetPrice: 60_000_000,
        downPayment: 12_000_000,
        interestRate: 0.18,
        rateType: 'EFFECTIVE_ANNUAL',
        termMonths: 48,
        monthlySavingAmount: 1_500_000,
        currentSavings: 12_000_000,
      });
    expect(res.status).toBe(200);
    expect(res.body.financing.loan.monthlyPayment).toBe(1_376_764);
    expect(res.body.saving.monthsToSave).toBe(32);
    expect(res.body.financing.schedule).toBeUndefined();
    expect(res.body.disclaimer).toBeTypeOf('string');
  });

  it('valida las entradas', async () => {
    const { body: session } = await registerUser();
    const res = await request(app)
      .post('/api/simulator/compare')
      .set('Authorization', `Bearer ${session.accessToken}`)
      .send({ assetPrice: 1_000, downPayment: 2_000, interestRate: 0.2, rateType: 'EFFECTIVE_ANNUAL', termMonths: 12, monthlySavingAmount: 100 });
    expect(res.status).toBe(400);
  });
});

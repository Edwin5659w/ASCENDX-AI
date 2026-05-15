import { describe, it, expect } from 'vitest';
import { registerSchema, loginSchema } from '@ascendx/shared/validators/auth.validator';

describe('validadores Zod compartidos (auth)', () => {
  it('acepta registro válido', () => {
    const r = registerSchema.safeParse({
      name: 'Juan Pérez',
      email: 'juan@test.com',
      password: 'Abcd1234!',
    });
    expect(r.success).toBe(true);
  });

  it('rechaza nombre sin apellido', () => {
    const r = registerSchema.safeParse({
      name: 'Juan',
      email: 'juan@test.com',
      password: 'Abcd1234!',
    });
    expect(r.success).toBe(false);
  });

  it('login normaliza email a minúsculas', () => {
    const r = loginSchema.safeParse({ email: 'TEST@MAIL.COM', password: 'x' });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.email).toBe('test@mail.com');
  });
});

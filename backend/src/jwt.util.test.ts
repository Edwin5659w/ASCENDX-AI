import { describe, it, expect } from 'vitest';
import jwt from 'jsonwebtoken';
import { expiresAtFromJwt } from './utils/jwt';

describe('expiresAtFromJwt', () => {
  it('usa el claim exp del refresh token', () => {
    const token = jwt.sign({ userId: 'u1' }, 'test-secret-min-32-chars-long!!', { expiresIn: '2h' });
    const exp = expiresAtFromJwt(token);
    const decoded = jwt.decode(token) as jwt.JwtPayload;
    expect(exp.getTime()).toBe((decoded.exp ?? 0) * 1000);
  });
});

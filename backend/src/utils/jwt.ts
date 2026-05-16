import jwt from 'jsonwebtoken';

/** Fecha de expiración a partir del claim `exp` de un JWT ya firmado. */
export function expiresAtFromJwt(token: string): Date {
  const decoded = jwt.decode(token) as jwt.JwtPayload | null;
  if (decoded?.exp) {
    return new Date(decoded.exp * 1000);
  }
  const fallback = new Date();
  fallback.setDate(fallback.getDate() + 7);
  return fallback;
}

import bcrypt from 'bcryptjs';

/** Costo de bcrypt: 12 rondas es un equilibrio razonable entre seguridad y tiempo de respuesta. */
const BCRYPT_ROUNDS = 12;

export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, BCRYPT_ROUNDS);
}

export function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

/**
 * Hash ficticio para comparar cuando el correo no existe. Así el tiempo de
 * respuesta es similar en ambos casos y no se revela qué correos están registrados.
 */
export const DUMMY_PASSWORD_HASH = bcrypt.hashSync('ascendx-dummy-password', BCRYPT_ROUNDS);

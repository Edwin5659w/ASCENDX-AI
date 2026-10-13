import { hash, verify, type Algorithm } from '@node-rs/argon2';

/**
 * Contraseñas con Argon2id (Documento Maestro v2, sección 4 y RNF-02).
 * Parámetros recomendados por OWASP: 19 MiB de memoria, 2 iteraciones, 1 hilo.
 */
const ARGON2_OPTIONS = {
  // Algorithm.Argon2id = 2 (es un const enum y no se puede importar con verbatimModuleSyntax)
  algorithm: 2 as Algorithm,
  memoryCost: 19_456,
  timeCost: 2,
  parallelism: 1,
} as const;

export function hashPassword(plain: string): Promise<string> {
  return hash(plain, ARGON2_OPTIONS);
}

export async function verifyPassword(plain: string, passwordHash: string): Promise<boolean> {
  try {
    return await verify(passwordHash, plain);
  } catch {
    return false;
  }
}

/**
 * Hash ficticio para comparar cuando el correo no existe, así el tiempo de
 * respuesta es parecido y no se revela qué correos están registrados.
 */
let dummyHash: Promise<string> | null = null;
export function getDummyHash(): Promise<string> {
  dummyHash ??= hashPassword('ascendx-dummy-password-2026');
  return dummyHash;
}

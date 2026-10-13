import type { Request } from 'express';
import type { z } from 'zod';

/**
 * Valida y tipa el cuerpo de la petición. Lanza ZodError, que el manejador
 * central convierte en una respuesta 400 con el detalle de cada campo.
 */
export function parseBody<T extends z.ZodType>(schema: T, req: Request): z.infer<T> {
  return schema.parse(req.body);
}

export function parseQuery<T extends z.ZodType>(schema: T, req: Request): z.infer<T> {
  return schema.parse(req.query);
}

export function parseParams<T extends z.ZodType>(schema: T, req: Request): z.infer<T> {
  return schema.parse(req.params);
}

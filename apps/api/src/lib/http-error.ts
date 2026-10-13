/**
 * Error de aplicación con código HTTP y un código estable que la app móvil
 * puede usar para mostrar mensajes adecuados.
 */
export class HttpError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'HttpError';
  }

  static badRequest(message: string, details?: unknown) {
    return new HttpError(400, 'BAD_REQUEST', message, details);
  }

  static unauthorized(message = 'No autenticado') {
    return new HttpError(401, 'UNAUTHORIZED', message);
  }

  static forbidden(message = 'No tienes permiso para esta acción') {
    return new HttpError(403, 'FORBIDDEN', message);
  }

  static notFound(message = 'Recurso no encontrado') {
    return new HttpError(404, 'NOT_FOUND', message);
  }

  static conflict(code: string, message: string) {
    return new HttpError(409, code, message);
  }
}

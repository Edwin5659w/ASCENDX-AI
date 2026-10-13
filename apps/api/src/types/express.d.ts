// Agrega la identidad del usuario autenticado a la petición de Express.
declare global {
  namespace Express {
    interface Request {
      auth?: { userId: string };
    }
  }
}

export {};

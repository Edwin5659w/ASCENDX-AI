import { clearRefreshToken, readRefreshToken, saveRefreshToken } from './secure-storage';

/**
 * Cliente HTTP de la API de ASCENDX AI.
 * - Agrega el token de acceso a las rutas protegidas.
 * - Si el token expiró (401), renueva la sesión una sola vez y reintenta.
 */

/** Servidor en la nube (Render + Neon). Ver docs/despliegue.md. */
const CLOUD_API_URL = 'https://ascendx-api.onrender.com/api';

/**
 * Dirección de la API: la de la nube por defecto, para que `npm start` funcione
 * sin levantar nada en el computador. Para trabajar con la API local,
 * scripts/iniciar.ps1 define EXPO_PUBLIC_API_URL con la IP del computador.
 */
export const API_URL = process.env.EXPO_PUBLIC_API_URL || CLOUD_API_URL;

/**
 * El plan gratis de Render duerme el servidor tras 15 min sin uso y tarda
 * hasta un minuto en despertar. Se le avisa apenas abre la app, mientras se
 * ve la animación del logo, para que el registro o el inicio de sesión no esperen.
 */
export function wakeServer() {
  fetch(`${API_URL}/health`).catch(() => undefined);
}

export type ConsentType = 'terminos' | 'datos' | 'ia' | 'ocr';

export interface ConsentState {
  granted: boolean;
  version: string | null;
  grantedAt: string | null;
}

export interface FinancialProfile {
  estimatedIncome: number | null;
  estimatedFixedExpenses: number | null;
  payDay: number | null;
  safetyMargin: number;
}

/** Usuario tal como lo devuelve GET /me (ver docs/api.md). */
export interface User {
  id: string;
  email: string;
  name: string;
  isAdult: boolean;
  createdAt: string;
  consents: Record<ConsentType, ConsentState>;
  financialProfile: FinancialProfile | null;
}

export interface AuthSession {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    /** Lista de errores por campo (validación) u objeto con datos extra (p. ej. minutos de bloqueo). */
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }

  /** Errores de validación agrupados por campo: { email: 'Correo inválido' } */
  fieldErrors(): Record<string, string> {
    const errors: Record<string, string> = {};
    const list = Array.isArray(this.details) ? (this.details as { path: string; message: string }[]) : [];
    for (const detail of list) {
      if (detail.path && !errors[detail.path]) errors[detail.path] = detail.message;
    }
    return errors;
  }
}

export const NETWORK_ERROR_MESSAGE =
  'No pudimos conectar con el servidor. Revisa tu conexión a internet e inténtalo de nuevo; si la app llevaba un rato sin usarse, el servidor puede tardar hasta un minuto en despertar.';

let accessToken: string | null = null;
let refreshInFlight: Promise<AuthSession> | null = null;
let onSessionExpired: (() => void) | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export function setSessionExpiredHandler(handler: (() => void) | null) {
  onSessionExpired = handler;
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
  /** true para rutas que requieren sesión */
  auth?: boolean;
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  try {
    return await rawRequest<T>(path, options);
  } catch (error) {
    if (options.auth && error instanceof ApiError && error.status === 401) {
      try {
        await refreshSession();
      } catch (refreshError) {
        // Sin conexión no se cierra la sesión: se sigue mostrando lo guardado (RF-27).
        if (refreshError instanceof ApiError && refreshError.status === 0) throw refreshError;
        onSessionExpired?.();
        throw error;
      }
      return rawRequest<T>(path, options);
    }
    throw error;
  }
}

/** Renueva la sesión con el refresh token guardado. Si hay varias peticiones a la vez, comparten la misma renovación. */
export function refreshSession(): Promise<AuthSession> {
  refreshInFlight ??= (async () => {
    const refreshToken = await readRefreshToken();
    if (!refreshToken) throw new ApiError(401, 'NO_SESSION', 'No hay sesión guardada');
    try {
      const session = await rawRequest<AuthSession>('/auth/refresh', { method: 'POST', body: { refreshToken } });
      await storeSession(session);
      return session;
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) await clearSession();
      throw error;
    }
  })().finally(() => {
    refreshInFlight = null;
  });
  return refreshInFlight;
}

export async function storeSession(session: AuthSession) {
  setAccessToken(session.accessToken);
  await saveRefreshToken(session.refreshToken);
}

export async function clearSession() {
  setAccessToken(null);
  await clearRefreshToken();
}

async function rawRequest<T>(path: string, { method = 'GET', body, auth = false }: RequestOptions): Promise<T> {
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (auth && accessToken) headers.Authorization = `Bearer ${accessToken}`;

  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(0, 'NETWORK_ERROR', NETWORK_ERROR_MESSAGE);
  }

  if (response.status === 204) return undefined as T;

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const error = data?.error;
    throw new ApiError(
      response.status,
      error?.code ?? 'UNKNOWN_ERROR',
      error?.message ?? 'Ocurrió un error inesperado',
      error?.details,
    );
  }
  return data as T;
}

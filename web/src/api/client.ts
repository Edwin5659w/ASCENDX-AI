const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000';

const ACCESS_KEY = 'ascendx_access';
const REFRESH_KEY = 'ascendx_refresh';

export const getAccessToken = () => localStorage.getItem(ACCESS_KEY);
export const getRefreshToken = () => localStorage.getItem(REFRESH_KEY);

export const saveTokens = (access: string, refresh: string) => {
  localStorage.setItem(ACCESS_KEY, access);
  localStorage.setItem(REFRESH_KEY, refresh);
};

export const clearTokens = () => {
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
};

type SessionExpiredHandler = () => void;
let sessionExpiredHandler: SessionExpiredHandler | null = null;

/** Registra callback para limpiar estado de auth cuando la sesión ya no es válida. */
export function setSessionExpiredHandler(handler: SessionExpiredHandler | null) {
  sessionExpiredHandler = handler;
}

function notifySessionExpired() {
  clearTokens();
  sessionExpiredHandler?.();
}

type ApiPayload<T> = {
  data?: T;
  error?: string;
  message?: string;
  code?: string;
  details?: Record<string, unknown>;
};

export class ApiError extends Error {
  status: number;
  code?: string;
  details?: Record<string, unknown>;

  constructor(message: string, status: number, code?: string, details?: Record<string, unknown>) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export function isAiLimitError(e: unknown): e is ApiError {
  return e instanceof ApiError && e.code === 'AI_LIMIT_REACHED';
}

function parseJson<T>(res: Response, raw: string): ApiPayload<T> {
  if (!raw.trim()) {
    if (!res.ok) throw new Error(`Error HTTP ${res.status}`);
    return {};
  }
  try {
    return JSON.parse(raw) as ApiPayload<T>;
  } catch {
    const hint = raw.length > 200 ? `${raw.slice(0, 200)}…` : raw;
    throw new Error(res.ok ? 'Respuesta inválida del servidor' : `Error ${res.status}: ${hint}`);
  }
}

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;

  let res: Response;
  try {
    res = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
  } catch {
    notifySessionExpired();
    return null;
  }

  const raw = await res.text();
  if (!res.ok) {
    notifySessionExpired();
    return null;
  }

  const json = parseJson<{ accessToken: string; refreshToken: string }>(res, raw);
  if (!json.data?.accessToken || !json.data?.refreshToken) {
    notifySessionExpired();
    return null;
  }
  saveTokens(json.data.accessToken, json.data.refreshToken);
  return json.data.accessToken;
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit & { public?: boolean } = {},
): Promise<T> {
  const { public: isPublic, ...fetchOptions } = options;
  let token = isPublic ? null : getAccessToken();

  const doFetch = async (authToken: string | null) => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };
    if (authToken) headers.Authorization = `Bearer ${authToken}`;
    return fetch(`${API_URL}${path}`, { ...fetchOptions, headers });
  };

  let res: Response;
  try {
    res = await doFetch(token);
  } catch {
    throw new Error(
      `Sin conexión al servidor (${API_URL}). Comprueba que el backend esté en marcha y VITE_API_URL en web/.env.`,
    );
  }

  if (res.status === 401 && token && !isPublic) {
    token = await refreshAccessToken();
    if (!token) {
      throw new Error('Sesión expirada. Vuelve a iniciar sesión.');
    }
    try {
      res = await doFetch(token);
    } catch {
      notifySessionExpired();
      throw new Error('Sesión expirada. Vuelve a iniciar sesión.');
    }
  }

  const raw = await res.text();
  const json = parseJson<T>(res, raw);

  if (res.status === 401 && !isPublic) {
    notifySessionExpired();
    throw new Error('Sesión expirada. Vuelve a iniciar sesión.');
  }

  if (!res.ok) {
    throw new ApiError(
      json.error ?? json.message ?? 'Error en la solicitud',
      res.status,
      json.code,
      json.details,
    );
  }

  if (json.data !== undefined) {
    return json.data as T;
  }

  return undefined as T;
}

export { API_URL };

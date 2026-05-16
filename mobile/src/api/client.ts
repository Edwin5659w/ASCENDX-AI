import * as SecureStore from 'expo-secure-store';
import { API_URL } from '../config/api';

const TOKEN_KEY = 'ascendx_access_token';
const REFRESH_KEY = 'ascendx_refresh_token';

export async function getAccessToken(): Promise<string | null> {
  return SecureStore.getItemAsync(TOKEN_KEY);
}

export async function getRefreshToken(): Promise<string | null> {
  return SecureStore.getItemAsync(REFRESH_KEY);
}

export async function saveTokens(access: string, refresh: string): Promise<void> {
  await SecureStore.setItemAsync(TOKEN_KEY, access);
  await SecureStore.setItemAsync(REFRESH_KEY, refresh);
}

export async function clearTokens(): Promise<void> {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
  await SecureStore.deleteItemAsync(REFRESH_KEY);
}

type SessionExpiredHandler = () => void;
let sessionExpiredHandler: SessionExpiredHandler | null = null;

export function setSessionExpiredHandler(handler: SessionExpiredHandler | null) {
  sessionExpiredHandler = handler;
}

async function notifySessionExpired() {
  await clearTokens();
  sessionExpiredHandler?.();
}

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = await getRefreshToken();
  if (!refreshToken) return null;

  let res: Response;
  try {
    res = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
  } catch {
    await notifySessionExpired();
    return null;
  }

  if (!res.ok) {
    await notifySessionExpired();
    return null;
  }

  let json: { data?: { accessToken: string; refreshToken: string } };
  try {
    json = await res.json();
  } catch {
    await notifySessionExpired();
    return null;
  }

  const { accessToken, refreshToken: newRefresh } = json.data ?? {};
  if (!accessToken || !newRefresh) {
    await notifySessionExpired();
    return null;
  }

  await saveTokens(accessToken, newRefresh);
  return accessToken;
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit & { public?: boolean } = {},
): Promise<T> {
  const { public: isPublic, ...fetchOptions } = options;
  let token = isPublic ? null : await getAccessToken();

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
      `Sin conexión al servidor (${API_URL}). Activa el backend (npm run dev) y configura EXPO_PUBLIC_API_URL en mobile/.env con la IP de tu PC.`,
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
      await notifySessionExpired();
      throw new Error('Sesión expirada. Vuelve a iniciar sesión.');
    }
  }

  let json: { data?: T; error?: string; message?: string };
  try {
    json = await res.json();
  } catch {
    throw new Error('Respuesta inválida del servidor');
  }

  if (res.status === 401 && !isPublic) {
    await notifySessionExpired();
    throw new Error('Sesión expirada. Vuelve a iniciar sesión.');
  }

  if (!res.ok) {
    throw new Error(json.error ?? json.message ?? 'Error en la solicitud');
  }

  if (json.data !== undefined) {
    return json.data as T;
  }

  return undefined as T;
}

export { API_URL };

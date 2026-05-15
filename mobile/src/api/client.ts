import * as SecureStore from 'expo-secure-store';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:4000';

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

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = await getRefreshToken();
  if (!refreshToken) return null;

  const res = await fetch(`${API_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });

  if (!res.ok) {
    await clearTokens();
    return null;
  }

  const json = await res.json();
  const { accessToken, refreshToken: newRefresh } = json.data;
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

  let res = await doFetch(token);

  if (res.status === 401 && token && !isPublic) {
    token = await refreshAccessToken();
    res = await doFetch(token);
  }

  const json = await res.json();

  if (!res.ok) {
    throw new Error(json.error ?? json.message ?? 'Error en la solicitud');
  }

  return json.data as T;
}

export { API_URL };

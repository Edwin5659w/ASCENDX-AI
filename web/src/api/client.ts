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

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;

  const res = await fetch(`${API_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });

  if (!res.ok) {
    clearTokens();
    return null;
  }

  const json = await res.json();
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

  let res = await doFetch(token);
  if (res.status === 401 && token && !isPublic) {
    token = await refreshAccessToken();
    res = await doFetch(token);
  }

  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? 'Error en la solicitud');
  return json.data as T;
}

export { API_URL };

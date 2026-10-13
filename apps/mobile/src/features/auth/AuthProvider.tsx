import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  ApiError,
  apiRequest,
  clearSession,
  refreshSession,
  setSessionExpiredHandler,
  storeSession,
  type AuthSession,
  type User,
} from '@/lib/api';
import { readRefreshToken } from '@/lib/secure-storage';

type AuthStatus = 'loading' | 'signedOut' | 'signedIn';

interface RegisterInput {
  fullName: string;
  email: string;
  password: string;
  acceptPrivacyPolicy: boolean;
}

interface AuthContextValue {
  status: AuthStatus;
  user: User | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (input: RegisterInput) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [user, setUser] = useState<User | null>(null);

  const applySession = useCallback(async (session: AuthSession) => {
    await storeSession(session);
    setUser(session.user);
    setStatus('signedIn');
  }, []);

  const resetSession = useCallback(async () => {
    await clearSession();
    setUser(null);
    setStatus('signedOut');
  }, []);

  // Al abrir la app: si hay un refresh token guardado, se intenta recuperar la sesión.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const stored = await readRefreshToken().catch(() => null);
      if (!stored) {
        if (!cancelled) setStatus('signedOut');
        return;
      }
      try {
        const session = await refreshSession();
        if (!cancelled) {
          setUser(session.user);
          setStatus('signedIn');
        }
      } catch {
        // Sin conexión o sesión vencida: se muestra el inicio de sesión.
        if (!cancelled) setStatus('signedOut');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setSessionExpiredHandler(() => {
      setUser(null);
      setStatus('signedOut');
    });
    return () => setSessionExpiredHandler(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      user,
      signIn: async (email, password) => {
        const session = await apiRequest<AuthSession>('/auth/login', { method: 'POST', body: { email, password } });
        await applySession(session);
      },
      signUp: async (input) => {
        const session = await apiRequest<AuthSession>('/auth/register', { method: 'POST', body: input });
        await applySession(session);
      },
      signOut: async () => {
        const refreshToken = await readRefreshToken().catch(() => null);
        if (refreshToken) {
          await apiRequest('/auth/logout', { method: 'POST', body: { refreshToken } }).catch((error: unknown) => {
            // Si el servidor no responde, igual se cierra la sesión en el dispositivo.
            if (!(error instanceof ApiError)) throw error;
          });
        }
        await resetSession();
      },
    }),
    [status, user, applySession, resetSession],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return context;
}

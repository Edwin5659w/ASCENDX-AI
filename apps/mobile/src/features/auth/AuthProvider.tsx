import Constants from 'expo-constants';
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
import { OFFLINE_QUERIES, queryPersistence, readJson, removeKey, writeJson } from '@/lib/local-store';
import { clearOutbox } from '@/lib/outbox';
import { clearQueries, setPersistence } from '@/lib/query';
import { readRefreshToken } from '@/lib/secure-storage';

// RF-27: las consultas principales se guardan en el teléfono para verlas sin conexión.
setPersistence(queryPersistence, OFFLINE_QUERIES);

/** Copia del usuario (nombre, correo, permisos) para abrir la app sin conexión. */
const USER_KEY = 'user';

async function forgetLocalData() {
  await Promise.all([clearQueries(), clearOutbox(), removeKey(USER_KEY), removeKey('reminders')]);
}

type AuthStatus = 'loading' | 'signedOut' | 'signedIn';

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
  isAdult: true;
  acceptTerms: true;
  acceptDataPolicy: true;
}

interface AuthContextValue {
  status: AuthStatus;
  user: User | null;
  /** true justo después de crear la cuenta: se muestra el onboarding */
  isNewAccount: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (input: RegisterInput) => Promise<void>;
  signOut: () => Promise<void>;
  /** Reemplaza el usuario en memoria con la versión que devolvió la API */
  setUser: (user: User) => void;
  finishOnboarding: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/** Nombre del dispositivo para la lista de sesiones (sessions.device_name). */
const deviceName = (Constants.deviceName ?? 'Android').slice(0, 80);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [user, setUserState] = useState<User | null>(null);
  const [isNewAccount, setIsNewAccount] = useState(false);

  const setUser = useCallback((next: User) => {
    setUserState(next);
    writeJson(USER_KEY, next).catch(() => undefined);
  }, []);

  const applySession = useCallback(
    async (session: AuthSession) => {
      const previous = await readJson<User>(USER_KEY);
      // Otra persona inicia sesión en este teléfono: no debe ver datos guardados del anterior.
      if (previous && previous.id !== session.user.id) await forgetLocalData();
      await storeSession(session);
      setUser(session.user);
      setStatus('signedIn');
    },
    [setUser],
  );

  // Al abrir la app: si hay un token de renovación guardado, se recupera la sesión.
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
      } catch (error) {
        // Sin conexión: se entra con la última copia guardada (RF-27). Sesión vencida: inicio de sesión.
        const cached = error instanceof ApiError && error.status === 0 ? await readJson<User>(USER_KEY) : null;
        if (cancelled) return;
        if (cached) {
          setUserState(cached);
          setStatus('signedIn');
        } else setStatus('signedOut');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [setUser]);

  useEffect(() => {
    setSessionExpiredHandler(() => {
      forgetLocalData().catch(() => undefined);
      setUserState(null);
      setStatus('signedOut');
    });
    return () => setSessionExpiredHandler(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      user,
      isNewAccount,
      signIn: async (email, password) => {
        const session = await apiRequest<AuthSession>('/auth/login', {
          method: 'POST',
          body: { email, password, deviceName },
        });
        await applySession(session);
      },
      signUp: async (input) => {
        const session = await apiRequest<AuthSession>('/auth/register', {
          method: 'POST',
          body: { ...input, deviceName },
        });
        setIsNewAccount(true);
        await applySession(session);
      },
      signOut: async () => {
        const refreshToken = await readRefreshToken().catch(() => null);
        if (refreshToken) {
          // Si el servidor no responde, igual se cierra la sesión en el dispositivo.
          await apiRequest('/auth/logout', { method: 'POST', body: { refreshToken } }).catch((error: unknown) => {
            if (!(error instanceof ApiError)) throw error;
          });
        }
        await clearSession();
        await forgetLocalData();
        setUserState(null);
        setIsNewAccount(false);
        setStatus('signedOut');
      },
      setUser,
      finishOnboarding: () => setIsNewAccount(false),
    }),
    [status, user, isNewAccount, applySession, setUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return context;
}

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
import { readRefreshToken } from '@/lib/secure-storage';

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

  const applySession = useCallback(async (session: AuthSession) => {
    await storeSession(session);
    setUserState(session.user);
    setStatus('signedIn');
  }, []);

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
          setUserState(session.user);
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
        setUserState(null);
        setIsNewAccount(false);
        setStatus('signedOut');
      },
      setUser: setUserState,
      finishOnboarding: () => setIsNewAccount(false),
    }),
    [status, user, isNewAccount, applySession],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return context;
}

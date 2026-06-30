import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { clearTokens, getAccessToken, setSessionExpiredHandler } from '../api/client';
import { authApi, userApi } from '../api/services';
import { setPendingDailyBonus } from '../lib/pending-daily-bonus';
import type { User } from '../types/api';

type DailyBonus = { message?: string; xpGained?: number } | null;

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, referralCode?: string) => Promise<number>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<DailyBonus>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadUser = useCallback(async (): Promise<DailyBonus> => {
    try {
      const me = await userApi.me();
      const u = me as User & { dailyBonus?: DailyBonus };
      if (u.dailyBonus?.xpGained) setPendingDailyBonus(u.dailyBonus);
      setUser(u);
      return u.dailyBonus ?? null;
    } catch {
      await clearTokens();
      setUser(null);
      return null;
    }
  }, []);

  useEffect(() => {
    setSessionExpiredHandler(() => setUser(null));
    return () => setSessionExpiredHandler(null);
  }, []);

  useEffect(() => {
    (async () => {
      const token = await getAccessToken();
      if (token) {
        await loadUser();
      }
      setIsLoading(false);
    })();
  }, [loadUser]);

  const login = async (email: string, password: string) => {
    const data = await authApi.login(email, password);
    setUser(data.user);
  };

  const register = async (name: string, email: string, password: string, referralCode?: string) => {
    const data = await authApi.register(name, email, password, referralCode);
    setUser(data.user);
    return data.referralBonus ?? 0;
  };

  const logout = async () => {
    await authApi.logout();
    setUser(null);
  };

  const refreshUser = async () => loadUser();

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        refreshUser,
      }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
}

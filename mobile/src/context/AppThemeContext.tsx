import React, { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getTheme, type AppTheme, type ThemeMode } from '@/constants/theme';
import { userApi } from '@/src/api/services';
import { useAuth } from '@/src/context/AuthContext';

interface ThemeContextValue {
  theme: AppTheme;
  mode: ThemeMode;
  setMode: (m: ThemeMode) => void;
  toggleMode: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);
const STORAGE_KEY = 'ascendx_theme';

export function AppThemeProvider({ children }: { children: ReactNode }) {
  const { user, refreshUser } = useAuth();
  const [mode, setModeState] = useState<ThemeMode>('dark');

  useEffect(() => {
    void AsyncStorage.getItem(STORAGE_KEY).then((v) => {
      if (v === 'light' || v === 'dark') setModeState(v);
    });
  }, []);

  useEffect(() => {
    if (user?.themePreference === 'light' || user?.themePreference === 'dark') {
      setModeState(user.themePreference);
    }
  }, [user?.themePreference]);

  const setMode = (m: ThemeMode) => {
    setModeState(m);
    void AsyncStorage.setItem(STORAGE_KEY, m);
    if (user) void userApi.updateProfile({ themePreference: m }).then(() => refreshUser());
  };

  const value = useMemo(
    () => ({
      theme: getTheme(mode),
      mode,
      setMode,
      toggleMode: () => setMode(mode === 'dark' ? 'light' : 'dark'),
    }),
    [mode, user],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useAppTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useAppTheme dentro de AppThemeProvider');
  return ctx;
}

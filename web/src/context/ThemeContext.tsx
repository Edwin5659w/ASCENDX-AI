import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { userApi } from '../api/services';
import { useAuth } from '../context/AuthContext';

type Theme = 'dark' | 'light';

interface ThemeContextValue {
  theme: Theme;
  setTheme: (t: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { user, refreshUser } = useAuth();
  const [theme, setThemeState] = useState<Theme>(() => {
    try {
      const stored = localStorage.getItem('ascendx_theme') as Theme | null;
      return stored === 'light' ? 'light' : 'dark';
    } catch {
      return 'dark';
    }
  });

  useEffect(() => {
    if (user?.themePreference === 'light' || user?.themePreference === 'dark') {
      setThemeState(user.themePreference);
    }
  }, [user?.themePreference]);

  useEffect(() => {
    document.documentElement.classList.toggle('light', theme === 'light');
    try {
      localStorage.setItem('ascendx_theme', theme);
    } catch {
      /* ignore */
    }
  }, [theme]);

  const setTheme = (t: Theme) => {
    setThemeState(t);
    if (user) void userApi.updateProfile({ themePreference: t }).then(() => refreshUser());
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme: () => setTheme(theme === 'dark' ? 'light' : 'dark') }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme dentro de ThemeProvider');
  return ctx;
}

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Appearance, Platform } from 'react-native';
import { readPreference, savePreference } from '@/lib/preferences';

/** Apariencia elegida por el usuario: la del sistema, siempre clara o siempre oscura. */
export type ThemePreference = 'system' | 'light' | 'dark';

const STORAGE_KEY = 'ascendx.theme';
/** La app entra en modo oscuro hasta que el usuario elija otra apariencia (decisión del autor). */
export const DEFAULT_THEME: ThemePreference = 'dark';

interface ThemePreferenceContextValue {
  preference: ThemePreference;
  setPreference: (value: ThemePreference) => void;
}

const ThemePreferenceContext = createContext<ThemePreferenceContextValue>({
  preference: DEFAULT_THEME,
  setPreference: () => undefined,
});

/** Aplica también al sistema (teclado, diálogos nativos) cuando la plataforma lo permite. */
function applyToSystem(value: ThemePreference) {
  if (Platform.OS === 'web') return;
  try {
    Appearance.setColorScheme(value === 'system' ? 'unspecified' : value);
  } catch {
    // Versiones sin soporte: solo cambia la app.
  }
}

export function ThemePreferenceProvider({ children }: { children: ReactNode }) {
  const [preference, setPreferenceState] = useState<ThemePreference>(DEFAULT_THEME);

  useEffect(() => {
    readPreference(STORAGE_KEY).then((stored) => {
      const value = stored === 'light' || stored === 'dark' || stored === 'system' ? stored : DEFAULT_THEME;
      setPreferenceState(value);
      applyToSystem(value);
    });
  }, []);

  const setPreference = useCallback((value: ThemePreference) => {
    setPreferenceState(value);
    applyToSystem(value);
    savePreference(STORAGE_KEY, value);
  }, []);

  const value = useMemo(() => ({ preference, setPreference }), [preference, setPreference]);
  return <ThemePreferenceContext.Provider value={value}>{children}</ThemePreferenceContext.Provider>;
}

export function useThemePreference() {
  return useContext(ThemePreferenceContext);
}

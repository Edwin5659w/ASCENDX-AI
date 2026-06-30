import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { t as translate, type Locale } from '../../../shared/i18n';

interface LocaleContextValue {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (section: 'nav' | 'dashboard' | 'common' | 'theme' | 'cookies', key: string) => string;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);
const STORAGE_KEY = 'ascendx_locale';

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('es');

  useEffect(() => {
    void AsyncStorage.getItem(STORAGE_KEY).then((v) => {
      if (v === 'en' || v === 'es') setLocaleState(v);
    });
  }, []);

  const setLocale = (l: Locale) => {
    setLocaleState(l);
    void AsyncStorage.setItem(STORAGE_KEY, l);
  };

  return (
    <LocaleContext.Provider
      value={{
        locale,
        setLocale,
        t: (section, key) => translate(locale, section, key),
      }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error('useLocale dentro de LocaleProvider');
  return ctx;
}

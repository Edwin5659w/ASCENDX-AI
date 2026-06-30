import { createContext, useContext, useState, type ReactNode } from 'react';
import type { Locale } from '@shared/i18n';
import { t as translate } from '@shared/i18n';

interface LocaleContextValue {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (section: 'nav' | 'dashboard' | 'common' | 'theme' | 'cookies', key: string) => string;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    try {
      const s = localStorage.getItem('ascendx_locale') as Locale | null;
      return s === 'en' ? 'en' : 'es';
    } catch {
      return 'es';
    }
  });

  const setLocale = (l: Locale) => {
    setLocaleState(l);
    try {
      localStorage.setItem('ascendx_locale', l);
    } catch {
      /* ignore */
    }
    document.documentElement.lang = l;
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

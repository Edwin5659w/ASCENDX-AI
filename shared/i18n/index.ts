import { en } from './en';
import { es } from './es';

export type Locale = 'es' | 'en';
export type TranslationKey = keyof typeof es;

const dictionaries = { es, en } as const;

export function t(locale: Locale, section: keyof typeof es, key: string): string {
  const dict = dictionaries[locale] ?? dictionaries.es;
  const group = dict[section] as Record<string, string>;
  return group[key] ?? key;
}

export { es, en };

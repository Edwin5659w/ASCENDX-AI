import { useCallback, useEffect, useRef, useSyncExternalStore } from 'react';

/**
 * Caché mínima de consultas a la API (sin librerías externas):
 * - Cada consulta tiene una clave («dashboard:2026-10», «transactions:…»).
 * - Las pantallas que usan la misma clave comparten el resultado.
 * - Después de guardar algo, `invalidate('transactions')` vuelve a pedir todas
 *   las consultas cuya clave empieza por ese prefijo.
 * - Opcionalmente, la última respuesta se guarda en el teléfono para mostrarla
 *   sin conexión (RF-27); ver setPersistence.
 */

interface Entry<T = unknown> {
  data?: T;
  error?: unknown;
  /** Fecha de la última respuesta del servidor */
  updatedAt?: number;
  /** true si los datos vienen del almacenamiento local y no del servidor */
  fromCache?: boolean;
  promise?: Promise<T>;
  fetcher?: () => Promise<T>;
}

const entries = new Map<string, Entry>();
const listeners = new Map<string, Set<() => void>>();
const versions = new Map<string, number>();

export interface Persistence {
  read(key: string): Promise<{ data: unknown; updatedAt: number } | null>;
  write(key: string, value: { data: unknown; updatedAt: number }): Promise<void>;
  clear(): Promise<void>;
}

let persistence: Persistence | null = null;
const persistablePrefixes = new Set<string>();

/** Activa el guardado local de las consultas cuya clave empieza por alguno de los prefijos. */
export function setPersistence(adapter: Persistence | null, prefixes: string[] = []) {
  persistence = adapter;
  persistablePrefixes.clear();
  prefixes.forEach((prefix) => persistablePrefixes.add(prefix));
}

const persistable = (key: string) => [...persistablePrefixes].some((prefix) => key.startsWith(prefix));

function notify(key: string) {
  versions.set(key, (versions.get(key) ?? 0) + 1);
  listeners.get(key)?.forEach((listener) => listener());
}

function subscribe(key: string, listener: () => void) {
  let set = listeners.get(key);
  if (!set) listeners.set(key, (set = new Set()));
  set.add(listener);
  return () => set!.delete(listener);
}

async function run<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
  const entry = (entries.get(key) ?? {}) as Entry<T>;
  if (entry.promise) return entry.promise;
  entry.fetcher = fetcher;
  const promise = fetcher()
    .then((data) => {
      const updatedAt = Date.now();
      entries.set(key, { ...entries.get(key), data, error: undefined, updatedAt, fromCache: false, promise: undefined, fetcher });
      if (persistence && persistable(key)) persistence.write(key, { data, updatedAt }).catch(() => undefined);
      notify(key);
      return data;
    })
    .catch((error) => {
      const previous = entries.get(key);
      // Sin conexión, lo último que se vio sigue en pantalla y se marca como guardado.
      const offline = (error as { code?: string } | null)?.code === 'NETWORK_ERROR' && previous?.data !== undefined;
      entries.set(key, { ...previous, error, promise: undefined, fetcher, fromCache: offline || Boolean(previous?.fromCache) });
      notify(key);
      throw error;
    });
  entries.set(key, { ...entry, promise });
  notify(key);
  return promise;
}

export interface QueryState<T> {
  data: T | undefined;
  error: unknown;
  loading: boolean;
  /** Los datos mostrados son los guardados en el teléfono (sin conexión) */
  fromCache: boolean;
  updatedAt: number | undefined;
  refetch: () => Promise<void>;
}

export function useQuery<T>(key: string | null, fetcher: () => Promise<T>): QueryState<T> {
  const fetcherRef = useRef(fetcher);
  useEffect(() => {
    fetcherRef.current = fetcher;
  });

  useSyncExternalStore(
    useCallback((listener) => (key ? subscribe(key, listener) : () => undefined), [key]),
    () => (key ? (versions.get(key) ?? 0) : 0),
    () => 0,
  );

  useEffect(() => {
    if (!key) return;
    let active = true;
    const entry = entries.get(key);
    if (!entry?.data && persistence && persistable(key)) {
      persistence
        .read(key)
        .then((stored) => {
          const current = entries.get(key);
          if (!active || !stored || current?.data) return;
          entries.set(key, { ...current, data: stored.data, updatedAt: stored.updatedAt, fromCache: true });
          notify(key);
        })
        .catch(() => undefined);
    }
    run(key, () => fetcherRef.current()).catch(() => undefined);
    return () => {
      active = false;
    };
  }, [key]);

  const entry = (key ? entries.get(key) : undefined) as Entry<T> | undefined;
  return {
    data: entry?.data,
    error: entry?.error,
    loading: Boolean(entry?.promise) && entry?.data === undefined,
    fromCache: Boolean(entry?.fromCache),
    updatedAt: entry?.updatedAt,
    refetch: async () => {
      if (key) await run(key, () => fetcherRef.current()).catch(() => undefined);
    },
  };
}

/** Pide una consulta por adelantado (p. ej. las categorías, para poder registrar sin conexión). */
export function prefetch<T>(key: string, fetcher: () => Promise<T>) {
  return run(key, fetcher).catch(() => undefined);
}

/** Vuelve a pedir las consultas cuyo nombre empieza por alguno de los prefijos. */
export function invalidate(...prefixes: string[]) {
  for (const [key, entry] of entries) {
    if (!prefixes.some((prefix) => key.startsWith(prefix))) continue;
    if (listeners.get(key)?.size && entry.fetcher) run(key, entry.fetcher).catch(() => undefined);
    else entries.delete(key);
  }
}

/** Al cerrar sesión se borra todo lo guardado. */
export async function clearQueries() {
  entries.clear();
  for (const key of [...listeners.keys()]) notify(key);
  await persistence?.clear().catch(() => undefined);
}

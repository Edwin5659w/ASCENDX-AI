import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Persistence } from './query';

/**
 * Almacenamiento local no sensible (RF-27, RNF-06): última copia de las
 * consultas, la cola de movimientos sin conexión y las preferencias de
 * recordatorios. Los tokens NO van aquí: van en SecureStore.
 * En la web AsyncStorage usa localStorage. Todo se borra al cerrar sesión.
 */
const PREFIX = 'ascendx:';

export async function readJson<T>(key: string): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(PREFIX + key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export async function writeJson(key: string, value: unknown) {
  try {
    await AsyncStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    // Sin espacio o almacenamiento bloqueado: la app sigue funcionando en línea.
  }
}

export async function removeKey(key: string) {
  await AsyncStorage.removeItem(PREFIX + key).catch(() => undefined);
}

export async function removeByPrefix(prefix: string) {
  try {
    const keys = (await AsyncStorage.getAllKeys()).filter((key) => key.startsWith(PREFIX + prefix));
    if (keys.length) await AsyncStorage.multiRemove(keys);
  } catch {
    // ignorar
  }
}

/** Adaptador para lib/query: guarda cada consulta como «cache:<clave>». */
export const queryPersistence: Persistence = {
  read: (key) => readJson<{ data: unknown; updatedAt: number }>(`cache:${key}`),
  write: (key, value) => writeJson(`cache:${key}`, value),
  clear: () => removeByPrefix('cache:'),
};

/** Consultas que se guardan para verlas sin conexión. */
export const OFFLINE_QUERIES = ['dashboard', 'transactions', 'goals', 'goal:', 'debts', 'debt:', 'categories', 'accounts', 'recurring', 'habits'];

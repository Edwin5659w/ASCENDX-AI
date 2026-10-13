import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

/**
 * Preferencias pequeñas de la app guardadas en el dispositivo (no son datos
 * financieros). En web se usa localStorage solo para la vista previa.
 */
export async function readPreference(key: string): Promise<string | null> {
  try {
    if (Platform.OS === 'web') return globalThis.localStorage?.getItem(key) ?? null;
    return await SecureStore.getItemAsync(key);
  } catch {
    return null;
  }
}

export async function savePreference(key: string, value: string): Promise<void> {
  try {
    if (Platform.OS === 'web') globalThis.localStorage?.setItem(key, value);
    else await SecureStore.setItemAsync(key, value);
  } catch {
    // Si no se puede guardar, la app sigue funcionando con el valor en memoria.
  }
}

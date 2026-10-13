import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

/**
 * Guarda el refresh token en el almacenamiento cifrado del dispositivo
 * (Android Keystore). En web (solo desarrollo) se usa memoria.
 */
const REFRESH_TOKEN_KEY = 'ascendx.refreshToken';
let memoryFallback: string | null = null;

export async function saveRefreshToken(token: string): Promise<void> {
  if (Platform.OS === 'web') {
    memoryFallback = token;
    return;
  }
  await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, token);
}

export async function readRefreshToken(): Promise<string | null> {
  if (Platform.OS === 'web') return memoryFallback;
  return SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
}

export async function clearRefreshToken(): Promise<void> {
  if (Platform.OS === 'web') {
    memoryFallback = null;
    return;
  }
  await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
}

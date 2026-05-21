import Constants from 'expo-constants';
import { Platform } from 'react-native';

/**
 * IP del PC donde corre Metro (Expo Go en teléfono físico).
 * Ej. hostUri "192.168.1.50:8081" → 192.168.1.50
 */
function getMetroHostIp(): string | null {
  const hostUri = Constants.expoConfig?.hostUri;
  if (!hostUri) return null;

  const hostname = hostUri.split(':')[0]?.trim();
  if (!hostname || hostname === 'localhost' || hostname === '127.0.0.1') {
    return null;
  }
  return hostname;
}

/**
 * URL del backend ASCENDX AI
 *
 * Prioridad en desarrollo (Expo Go):
 * 1. IP de Metro (misma que usa el bundler — suele ser la correcta en el teléfono)
 * 2. EXPO_PUBLIC_API_URL en mobile/.env
 * 3. Emulador Android → 10.0.2.2 | iOS sim → localhost
 */
function resolveApiUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, '');
  const metroIp = getMetroHostIp();

  if (__DEV__ && metroIp) {
    return `http://${metroIp}:4000`;
  }

  if (fromEnv) return fromEnv;

  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:4000';
  }

  return 'http://localhost:4000';
}

export const API_URL = resolveApiUrl();

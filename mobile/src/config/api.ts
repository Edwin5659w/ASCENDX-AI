import { Platform } from 'react-native';

/**
 * URL del backend ASCENDX AI
 *
 * - Emulador Android: http://10.0.2.2:4000
 * - Simulador iOS: http://localhost:4000
 * - Teléfono físico (Expo Go): http://TU_IP_LOCAL:4000  → crea mobile/.env
 */
function resolveApiUrl(): string {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL.replace(/\/$/, '');
  }

  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:4000';
  }

  return 'http://localhost:4000';
}

export const API_URL = resolveApiUrl();

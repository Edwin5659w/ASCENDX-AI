import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { userApi } from '@/src/api/services';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function ensureAndroidChannel() {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync('default', {
    name: 'ASCENDX',
    importance: Notifications.AndroidImportance.DEFAULT,
  });
}

/** Pide permiso de notificaciones locales/push. */
export async function ensureNotificationPermission(): Promise<boolean> {
  await ensureAndroidChannel();
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;
  if (existing === 'denied') {
    // En iOS denegado no vuelve a pedir; el usuario debe ir a Ajustes.
    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  }
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function hasNotificationPermission(): Promise<boolean> {
  const { status } = await Notifications.getPermissionsAsync();
  return status === 'granted';
}

/** Registra token Expo Push en el perfil (best-effort). */
export async function registerExpoPushToken(): Promise<string | null> {
  if (!Device.isDevice) return null;
  const granted = await ensureNotificationPermission();
  if (!granted) return null;

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ??
    (Constants as { easConfig?: { projectId?: string } }).easConfig?.projectId;
  const opts = projectId ? { projectId } : undefined;
  const { data } = await Notifications.getExpoPushTokenAsync(opts);
  await userApi.updateProfile({ pushToken: data });
  return data;
}

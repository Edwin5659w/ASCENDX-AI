import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

export type HapticKind = 'light' | 'medium' | 'selection' | 'success' | 'none';

/** Vibración corta al tocar. No hace nada en la vista previa web. */
export function haptic(kind: HapticKind = 'light') {
  if (Platform.OS === 'web' || kind === 'none') return;
  const run =
    kind === 'selection'
      ? Haptics.selectionAsync()
      : kind === 'success'
        ? Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
        : Haptics.impactAsync(kind === 'medium' ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Light);
  run.catch(() => undefined);
}

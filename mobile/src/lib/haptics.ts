import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

/** Feedback táctil al completar tarea/hábito (no hace nada en web). */
export function celebrateHaptic() {
  if (Platform.OS === 'web') return;
  void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
}

export function lightTapHaptic() {
  if (Platform.OS === 'web') return;
  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
}

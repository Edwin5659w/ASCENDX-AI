import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { habitsApi } from '@/src/api/services';
import { normalizeListResponse } from '../../../../shared/list-helpers';
import { registerExpoPushToken } from '@/src/lib/notifications';
import { syncHabitReminders } from '@/src/lib/habit-reminders';
import { theme } from '@/constants/theme';

const OPTIN_KEY = 'ascendx_notif_optin_asked';

export async function shouldAskNotificationOptIn(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(OPTIN_KEY)) !== '1';
  } catch {
    return true;
  }
}

export async function markNotificationOptInAsked() {
  try {
    await AsyncStorage.setItem(OPTIN_KEY, '1');
  } catch {
    /* ignore */
  }
}

interface NotificationOptInModalProps {
  visible: boolean;
  onDismiss: () => void;
  onDone?: (result: 'enabled' | 'skipped' | 'denied') => void;
}

export function NotificationOptInModal({ visible, onDismiss, onDone }: NotificationOptInModalProps) {
  const finish = async (result: 'enabled' | 'skipped' | 'denied') => {
    await markNotificationOptInAsked();
    onDismiss();
    onDone?.(result);
  };

  const enable = async () => {
    try {
      // Push remoto (best-effort) + permiso local
      try {
        await registerExpoPushToken();
      } catch {
        /* sin EAS projectId puede fallar; igual pedimos locales */
      }

      const list = await habitsApi.list(1, 50);
      const { items: habits } = normalizeListResponse(list);
      const withReminder = await Promise.all(
        habits.map(async (h) => {
          if (h.reminderEnabled) return h;
          return habitsApi.update(h.id, {
            reminderEnabled: true,
            reminderHour: 8,
            reminderMinute: 0,
          });
        }),
      );

      const sync = await syncHabitReminders(withReminder, { requestPermission: true });
      if (!sync.granted) {
        await finish('denied');
        return;
      }
      await finish('enabled');
    } catch {
      await finish('denied');
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={() => void finish('skipped')}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.iconWrap}>
            <FontAwesome name="bell" size={28} color={theme.colors.accent} />
          </View>
          <Text style={styles.title}>¿Te avisamos de tus hábitos?</Text>
          <Text style={styles.body}>
            Activa notificaciones para no romper tu racha. Por defecto te recordamos a las 8:00 — lo
            cambias cuando quieras en Hábitos.
          </Text>
          <Pressable style={styles.primaryBtn} onPress={() => void enable()}>
            <Text style={styles.primaryText}>Sí, avisarme a las 8:00</Text>
          </Pressable>
          <Pressable style={styles.secondaryBtn} onPress={() => void finish('skipped')}>
            <Text style={styles.secondaryText}>Ahora no</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.35)',
    padding: 24,
  },
  iconWrap: {
    alignSelf: 'center',
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 229, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    color: theme.colors.text,
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 10,
  },
  body: {
    color: theme.colors.textMuted,
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
    marginBottom: 20,
  },
  primaryBtn: {
    backgroundColor: theme.colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 8,
  },
  primaryText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  secondaryBtn: { paddingVertical: 10, alignItems: 'center' },
  secondaryText: { color: theme.colors.textMuted, fontSize: 13 },
});

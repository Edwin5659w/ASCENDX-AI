import * as Notifications from 'expo-notifications';
import type { Habit } from '@/src/types/api';
import { ensureNotificationPermission, hasNotificationPermission } from '@/src/lib/notifications';

export const HABIT_REMINDER_PREFIX = 'ascendx-habit-';

export type SyncRemindersResult = {
  granted: boolean;
  scheduled: number;
};

async function cancelHabitRemindersOnly() {
  const existing = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(
    existing
      .filter((n) => n.identifier.startsWith(HABIT_REMINDER_PREFIX))
      .map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier)),
  );
}

/**
 * Programa notificaciones locales diarias por hábito.
 * Por defecto no pide permiso (sync silencioso); pasa requestPermission al activar desde UI.
 */
export async function syncHabitReminders(
  habits: Habit[],
  opts?: { requestPermission?: boolean },
): Promise<SyncRemindersResult> {
  let granted = await hasNotificationPermission();
  if (!granted && opts?.requestPermission) {
    granted = await ensureNotificationPermission();
  }
  if (!granted) {
    return { granted: false, scheduled: 0 };
  }

  await cancelHabitRemindersOnly();

  let scheduled = 0;
  for (const habit of habits) {
    if (!habit.reminderEnabled || habit.reminderHour == null || habit.reminderMinute == null) {
      continue;
    }
    await Notifications.scheduleNotificationAsync({
      identifier: `${HABIT_REMINDER_PREFIX}${habit.id}`,
      content: {
        title: 'ASCENDX · Hábito',
        body: `Hora de: ${habit.name}`,
        data: { type: 'habit_reminder', habitId: habit.id },
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: habit.reminderHour,
        minute: habit.reminderMinute,
      },
    });
    scheduled += 1;
  }

  return { granted: true, scheduled };
}

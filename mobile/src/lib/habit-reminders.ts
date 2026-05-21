import * as Notifications from 'expo-notifications';
import type { Habit } from '@/src/types/api';

export async function syncHabitReminders(habits: Habit[]): Promise<void> {
  const { status } = await Notifications.getPermissionsAsync();
  if (status !== 'granted') return;

  await Notifications.cancelAllScheduledNotificationsAsync();

  for (const habit of habits) {
    if (!habit.reminderEnabled || habit.reminderHour == null || habit.reminderMinute == null) {
      continue;
    }
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'ASCENDX · Hábito',
        body: `Hora de: ${habit.name}`,
        data: { type: 'habit_reminder', habitId: habit.id },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: habit.reminderHour,
        minute: habit.reminderMinute,
      },
    });
  }
}

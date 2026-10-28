import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { readJson, writeJson } from './local-store';

/**
 * RF-33: recordatorios locales. Se programan en el propio teléfono, así que
 * llegan a la hora elegida aunque no haya conexión. No usan servidor ni push.
 */
export interface ReminderSettings {
  /** Recordatorio diario para registrar los gastos */
  daily: { enabled: boolean; hour: number; minute: number };
  /** Aviso el día antes del pago de cada deuda */
  debts: boolean;
  /** Aviso el día de pago (perfil financiero) para apartar el ahorro */
  payday: boolean;
}

export const DEFAULT_REMINDERS: ReminderSettings = { daily: { enabled: false, hour: 20, minute: 0 }, debts: false, payday: false };

const KEY = 'reminders';
const CHANNEL = 'recordatorios';

export const remindersSupported = Platform.OS !== 'web';

export async function loadReminderSettings(): Promise<ReminderSettings> {
  const stored = await readJson<ReminderSettings>(KEY);
  return { ...DEFAULT_REMINDERS, ...stored, daily: { ...DEFAULT_REMINDERS.daily, ...stored?.daily } };
}

/** Pide permiso para mostrar notificaciones. Devuelve false si el usuario lo niega. */
export async function ensurePermission(): Promise<boolean> {
  if (!remindersSupported) return false;
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL, { name: 'Recordatorios', importance: Notifications.AndroidImportance.DEFAULT });
  }
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}

interface ScheduleContext {
  debts: { name: string; paymentDay: number | null; status: string }[];
  payDay: number | null;
}

/** Día del mes seguro para un aviso mensual (los meses de 28 días también lo tienen). */
const safeDay = (day: number) => Math.min(28, Math.max(1, day));

/** Reemplaza todos los recordatorios programados por los de la configuración actual. */
export async function applyReminders(settings: ReminderSettings, context: ScheduleContext) {
  await writeJson(KEY, settings);
  if (!remindersSupported) return 0;
  await Notifications.cancelAllScheduledNotificationsAsync();
  const anyEnabled = settings.daily.enabled || settings.debts || settings.payday;
  if (!anyEnabled) return 0;
  if (!(await ensurePermission())) throw new Error('Activa las notificaciones de ASCENDX AI en los ajustes del teléfono.');

  let count = 0;
  if (settings.daily.enabled) {
    await Notifications.scheduleNotificationAsync({
      content: { title: '¿Ya registraste tus gastos de hoy?', body: 'Toma menos de un minuto y mantiene tu racha semanal.' },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour: settings.daily.hour, minute: settings.daily.minute, channelId: CHANNEL },
    });
    count += 1;
  }
  if (settings.debts) {
    for (const debt of context.debts) {
      if (debt.status !== 'activa' || !debt.paymentDay) continue;
      await Notifications.scheduleNotificationAsync({
        content: { title: `Mañana pagas ${debt.name}`, body: 'Registra el pago cuando lo hagas para ver cuánto bajó el saldo.' },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.MONTHLY, day: safeDay(debt.paymentDay - 1), hour: 9, minute: 0, channelId: CHANNEL },
      });
      count += 1;
    }
  }
  if (settings.payday && context.payDay) {
    await Notifications.scheduleNotificationAsync({
      content: { title: 'Hoy es tu día de pago', body: 'Aparta primero el aporte a tus metas y luego distribuye el resto.' },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.MONTHLY, day: safeDay(context.payDay), hour: 8, minute: 30, channelId: CHANNEL },
    });
    count += 1;
  }
  return count;
}

import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { AppText, Card, Chip, ChipGroup, errorMessage, Header, Icon, LoadingView, Screen, ToggleRow } from '@/components/ui';
import { useAuth } from '@/features/auth/AuthProvider';
import { getDebts } from '@/features/finance/api';
import { applyReminders, loadReminderSettings, remindersSupported, type ReminderSettings } from '@/lib/reminders';
import { useTheme } from '@/theme/useTheme';

const HOURS = [7, 12, 18, 20, 21];

/** RF-33: recordatorios que el teléfono muestra aunque no haya conexión. */
export default function RemindersScreen() {
  const { user } = useAuth();
  const { spacing } = useTheme();
  const [settings, setSettings] = useState<ReminderSettings | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; error: boolean } | null>(null);

  useEffect(() => {
    loadReminderSettings().then(setSettings);
  }, []);

  async function save(next: ReminderSettings) {
    setSettings(next);
    setSaving(true);
    setMessage(null);
    try {
      const debts = next.debts ? (await getDebts()).debts.map((d) => ({ name: d.name ?? d.creditor, paymentDay: d.paymentDay, status: d.status })) : [];
      const count = await applyReminders(next, { debts, payDay: user?.financialProfile?.payDay ?? null });
      setMessage({ text: count ? `Listo: ${count} ${count === 1 ? 'recordatorio programado' : 'recordatorios programados'}.` : 'Recordatorios desactivados.', error: false });
    } catch (err) {
      setMessage({ text: errorMessage(err), error: true });
    } finally {
      setSaving(false);
    }
  }

  if (!settings) {
    return (
      <Screen edges={['top', 'bottom']}>
        <Header title="Recordatorios" />
        <LoadingView />
      </Screen>
    );
  }

  return (
    <Screen scroll edges={['top', 'bottom']} animateIn={false}>
      <Header title="Recordatorios" />
      {!remindersSupported ? (
        <Card>
          <View style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'center' }}>
            <Icon name="info" color="warning" />
            <AppText variant="bodyStrong" style={{ flex: 1 }}>
              Disponible en la app de Android
            </AppText>
          </View>
          <AppText color="textMuted">Los recordatorios se programan en el teléfono. En la versión web puedes dejar lista la configuración.</AppText>
        </Card>
      ) : null}

      <Card>
        <ToggleRow
          icon="bell"
          title="Registrar mis gastos"
          description="Un aviso diario para anotar lo del día."
          value={settings.daily.enabled}
          onChange={(enabled) => save({ ...settings, daily: { ...settings.daily, enabled } })}
          disabled={saving}
        />
        {settings.daily.enabled ? (
          <View style={{ gap: spacing.sm }}>
            <AppText variant="label" color="textMuted">
              Hora
            </AppText>
            <ChipGroup>
              {HOURS.map((hour) => (
                <Chip
                  key={hour}
                  label={`${hour % 12 || 12}:00 ${hour < 12 ? 'a. m.' : 'p. m.'}`}
                  selected={settings.daily.hour === hour}
                  onPress={() => save({ ...settings, daily: { ...settings.daily, hour, minute: 0 } })}
                />
              ))}
            </ChipGroup>
          </View>
        ) : null}
      </Card>

      <Card>
        <ToggleRow
          icon="debt"
          title="Pagos de deudas"
          description="El día antes de cada pago (según el día que registraste en la deuda)."
          value={settings.debts}
          onChange={(debts) => save({ ...settings, debts })}
          disabled={saving}
        />
        <ToggleRow
          icon="savings"
          title="Día de pago"
          description={
            user?.financialProfile?.payDay
              ? `El día ${user.financialProfile.payDay}, para apartar primero tu ahorro.`
              : 'Indica tu día de pago en el perfil financiero para activarlo.'
          }
          value={settings.payday}
          onChange={(payday) => save({ ...settings, payday })}
          disabled={saving || !user?.financialProfile?.payDay}
        />
      </Card>

      {message ? <AppText color={message.error ? 'danger' : 'textMuted'}>{message.text}</AppText> : null}
      {saving ? <LoadingView label="Programando…" /> : null}
    </Screen>
  );
}

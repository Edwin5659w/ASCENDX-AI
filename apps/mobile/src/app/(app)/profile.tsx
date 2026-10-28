import Constants from 'expo-constants';
import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { Wordmark } from '@/components/brand/BrandMark';
import { AppText, Button, Card, Header, NavRow, Screen, SegmentedControl, ToggleRow } from '@/components/ui';
import { updateConsents } from '@/features/account/api';
import { useAuth } from '@/features/auth/AuthProvider';
import { FormError } from '@/features/auth/AuthShell';
import { ApiError } from '@/lib/api';
import { formatCop } from '@/lib/format';
import { useThemePreference, type ThemePreference } from '@/theme/ThemePreference';
import { useOutbox } from '@/lib/outbox';
import { useTheme } from '@/theme/useTheme';

const THEME_OPTIONS: { value: ThemePreference; label: string; icon: 'phone' | 'sun' | 'moon' }[] = [
  { value: 'dark', label: 'Oscuro', icon: 'moon' },
  { value: 'light', label: 'Claro', icon: 'sun' },
  { value: 'system', label: 'Sistema', icon: 'phone' },
];

const dateFormatter = new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'long', year: 'numeric' });

/** Perfil y ajustes: datos, permisos (RF-06), perfil financiero (RF-04) y eliminar cuenta (RF-05). */
export default function ProfileScreen() {
  const { user, setUser, signOut } = useAuth();
  const pendingSync = useOutbox().length;
  const { spacing } = useTheme();
  const { preference, setPreference } = useThemePreference();
  const [savingConsent, setSavingConsent] = useState<'ia' | 'ocr' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [signingOut, setSigningOut] = useState(false);

  if (!user) return null;
  const profile = user.financialProfile;

  async function toggle(type: 'ia' | 'ocr', value: boolean) {
    setSavingConsent(type);
    setError(null);
    try {
      const { user: updated } = await updateConsents({ [type]: value });
      setUser(updated);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo actualizar el permiso.');
    } finally {
      setSavingConsent(null);
    }
  }

  const accepted = (type: 'terminos' | 'datos') => {
    const consent = user.consents[type];
    return consent.granted && consent.grantedAt
      ? `Versión ${consent.version} · aceptado el ${dateFormatter.format(new Date(consent.grantedAt))}`
      : 'No aceptado';
  };

  return (
    <Screen scroll edges={['top', 'bottom']}>
      <Header title="Perfil y ajustes" />

      <Card>
        <AppText variant="heading">{user.name}</AppText>
        <AppText color="textMuted">{user.email}</AppText>
      </Card>

      <Card>
        <AppText variant="heading">Perfil financiero</AppText>
        <NavRow
          icon="wallet"
          title={profile?.estimatedIncome != null ? `Ingreso: ${formatCop(profile.estimatedIncome)}` : 'Sin completar'}
          subtitle={
            profile?.estimatedFixedExpenses != null
              ? `Gastos fijos: ${formatCop(profile.estimatedFixedExpenses)}${profile.payDay ? ` · te pagan el día ${profile.payDay}` : ''}`
              : 'Ingreso, gastos fijos y día de pago'
          }
          onPress={() => router.push('/financial-profile')}
        />
      </Card>

      <Card>
        <AppText variant="heading">Organización y hábitos</AppText>
        <NavRow icon="wallet" title="Mis cuentas" subtitle="Efectivo, banco y billetera digital" onPress={() => router.push('/accounts')} />
        <NavRow icon="repeat" title="Movimientos recurrentes" subtitle="Arriendo, salario y suscripciones automáticos" onPress={() => router.push('/recurring')} />
        <NavRow icon="trophy" title="Logros" subtitle="Tu racha semanal e insignias" onPress={() => router.push('/achievements')} />
        <NavRow icon="bell" title="Recordatorios" subtitle="Avisos en el teléfono, también sin conexión" onPress={() => router.push('/reminders')} />
      </Card>

      <Card>
        <AppText variant="heading">Apariencia</AppText>
        <SegmentedControl
          accessibilityLabel="Apariencia de la app"
          options={THEME_OPTIONS}
          value={preference}
          onChange={setPreference}
        />
        <AppText variant="caption" color="textMuted">
          {preference === 'system' ? 'Sigue el modo claro u oscuro de tu teléfono.' : 'Se mantiene aunque cambie el modo de tu teléfono.'}
        </AppText>
      </Card>

      <Card>
        <AppText variant="heading">Permisos</AppText>
        <View style={{ gap: spacing.lg }}>
          <ToggleRow
            icon="assistant"
            title="Análisis con IA"
            description="Solo se envían totales y promedios calculados, sin tu nombre ni tu correo."
            value={user.consents.ia.granted}
            onChange={(value) => toggle('ia', value)}
            disabled={savingConsent !== null}
          />
          <ToggleRow
            icon="camera"
            title="Lectura de recibos"
            description="El texto se lee en tu teléfono y la foto no se guarda."
            value={user.consents.ocr.granted}
            onChange={(value) => toggle('ocr', value)}
            disabled={savingConsent !== null}
          />
        </View>
        {error ? <FormError message={error} /> : null}
      </Card>

      <Card>
        <AppText variant="heading">Tus autorizaciones</AppText>
        <View style={{ gap: spacing.sm }}>
          <AppText variant="label">Términos y condiciones</AppText>
          <AppText variant="caption" color="textMuted">
            {accepted('terminos')}
          </AppText>
          <AppText variant="label" style={{ marginTop: spacing.sm }}>
            Tratamiento de datos (Ley 1581 de 2012)
          </AppText>
          <AppText variant="caption" color="textMuted">
            {accepted('datos')}
          </AppText>
        </View>
        <NavRow
          icon="trash"
          tone="danger"
          title="Eliminar mi cuenta"
          subtitle="Borra tu cuenta y todos tus datos"
          onPress={() => router.push('/delete-account')}
        />
      </Card>

      {pendingSync ? (
        <AppText variant="caption" color="warning">
          Tienes {pendingSync} {pendingSync === 1 ? 'movimiento' : 'movimientos'} sin enviar. Si cierras sesión ahora se perderán.
        </AppText>
      ) : null}
      <Button
        title="Cerrar sesión"
        variant="secondary"
        loading={signingOut}
        onPress={async () => {
          setSigningOut(true);
          await signOut();
        }}
      />
      <View style={{ alignItems: 'center', gap: spacing.sm, paddingTop: spacing.lg }}>
        <Wordmark width={140} />
        <AppText variant="caption" color="textMuted" align="center">
          Versión {Constants.expoConfig?.version ?? '—'}
        </AppText>
      </View>
    </Screen>
  );
}

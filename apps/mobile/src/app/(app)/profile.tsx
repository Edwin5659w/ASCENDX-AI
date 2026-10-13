import Constants from 'expo-constants';
import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { Wordmark } from '@/components/brand/BrandMark';
import { AppText, Button, Card, Header, NavRow, Screen, ToggleRow } from '@/components/ui';
import { updateConsents } from '@/features/account/api';
import { useAuth } from '@/features/auth/AuthProvider';
import { FormError } from '@/features/auth/AuthShell';
import { ApiError } from '@/lib/api';
import { formatCop } from '@/lib/format';
import { useTheme } from '@/theme/useTheme';

const dateFormatter = new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'long', year: 'numeric' });

/** Perfil y ajustes: datos, permisos (RF-06), perfil financiero (RF-04) y eliminar cuenta (RF-05). */
export default function ProfileScreen() {
  const { user, setUser, signOut } = useAuth();
  const { spacing } = useTheme();
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

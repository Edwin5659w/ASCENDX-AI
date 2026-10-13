import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { AppText, Button, Card, ProgressBar, Screen, ToggleRow } from '@/components/ui';
import { updateConsents, updateProfile } from '@/features/account/api';
import { FinancialProfileForm } from '@/features/account/FinancialProfileForm';
import { useAuth } from '@/features/auth/AuthProvider';
import { FormError } from '@/features/auth/AuthShell';
import { ApiError } from '@/lib/api';
import { firstName } from '@/lib/format';
import { useTheme } from '@/theme/useTheme';

/**
 * Onboarding después del registro (sección 5, P1):
 * 1. Permisos de IA y OCR, por separado y opcionales (RF-06).
 * 2. Perfil financiero inicial: ingreso y gastos fijos estimados (RF-04).
 */
export default function OnboardingScreen() {
  const { user, setUser, finishOnboarding } = useAuth();
  const { spacing } = useTheme();
  const [step, setStep] = useState<1 | 2>(1);
  const [ia, setIa] = useState(user?.consents.ia.granted ?? false);
  const [ocr, setOcr] = useState(user?.consents.ocr.granted ?? false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const done = () => {
    finishOnboarding();
    router.replace('/');
  };

  async function saveConsents() {
    setSaving(true);
    setError(null);
    try {
      const { user: updated } = await updateConsents({ ia, ocr });
      setUser(updated);
      setStep(2);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudieron guardar tus permisos.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Screen scroll edges={['top', 'bottom']}>
      <View style={{ gap: spacing.sm, marginTop: spacing.lg }}>
        <AppText variant="caption" color="textMuted">
          Paso {step} de 2
        </AppText>
        <ProgressBar value={step / 2} label={`Paso ${step} de 2`} />
      </View>

      {step === 1 ? (
        <>
          <View style={{ gap: spacing.sm }}>
            <AppText variant="title" accessibilityRole="header">
              {user ? `${firstName(user.name)}, decide qué permitir` : 'Decide qué permitir'}
            </AppText>
            <AppText color="textMuted">
              Puedes cambiar estos permisos cuando quieras desde tu perfil. Sin ellos, el resto de la app funciona igual.
            </AppText>
          </View>

          <Card>
            <ToggleRow
              icon="assistant"
              title="Asistente con inteligencia artificial"
              description="Enviamos al proveedor de IA solo totales y promedios ya calculados. Nunca tu nombre, tu correo ni las descripciones de tus movimientos."
              value={ia}
              onChange={setIa}
            />
          </Card>
          <Card>
            <ToggleRow
              icon="camera"
              title="Lectura de recibos con la cámara"
              description="El texto se lee en tu teléfono y la foto se descarta. Siempre revisas los datos antes de guardarlos."
              value={ocr}
              onChange={setOcr}
            />
          </Card>

          {error ? <FormError message={error} /> : null}
          <Button title="Continuar" onPress={saveConsents} loading={saving} />
        </>
      ) : (
        <>
          <View style={{ gap: spacing.sm }}>
            <AppText variant="title" accessibilityRole="header">
              Tu punto de partida
            </AppText>
            <AppText color="textMuted">
              Con estos valores estimamos cuánto puedes ahorrar mientras registras tus primeros meses. Son aproximados y
              puedes cambiarlos después.
            </AppText>
          </View>
          <FinancialProfileForm
            initial={user?.financialProfile ?? null}
            submitLabel="Guardar y empezar"
            onSubmit={async (values) => {
              const { user: updated } = await updateProfile(values);
              setUser(updated);
              done();
            }}
            secondary={{ label: 'Completar después', onPress: done }}
          />
        </>
      )}
    </Screen>
  );
}

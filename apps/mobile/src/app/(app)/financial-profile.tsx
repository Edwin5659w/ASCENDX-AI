import { router } from 'expo-router';
import { View } from 'react-native';
import { AppText, Header, Screen } from '@/components/ui';
import { updateProfile } from '@/features/account/api';
import { FinancialProfileForm } from '@/features/account/FinancialProfileForm';
import { useAuth } from '@/features/auth/AuthProvider';
import { useTheme } from '@/theme/useTheme';

/** RF-04: editar el perfil financiero (montos ≥ 0). */
export default function FinancialProfileScreen() {
  const { user, setUser } = useAuth();
  const { spacing } = useTheme();
  return (
    <Screen scroll edges={['top', 'bottom']}>
      <Header title="Perfil financiero" />
      <View style={{ gap: spacing.sm }}>
        <AppText color="textMuted">
          Estos valores se usan para estimar tu capacidad de ahorro mientras no tengas 3 meses completos registrados.
        </AppText>
      </View>
      <FinancialProfileForm
        initial={user?.financialProfile ?? null}
        submitLabel="Guardar cambios"
        onSubmit={async (values) => {
          const { user: updated } = await updateProfile(values);
          setUser(updated);
          router.back();
        }}
      />
    </Screen>
  );
}

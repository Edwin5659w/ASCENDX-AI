import Constants from 'expo-constants';
import { useState } from 'react';
import { View } from 'react-native';
import { AppText, Button, Card, Icon, Screen } from '@/components/ui';
import { useAuth } from '@/features/auth/AuthProvider';
import { useTheme } from '@/theme/useTheme';

function ConsentRow({ label, grantedAt }: { label: string; grantedAt: string | null }) {
  const { spacing } = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
      <Icon name={grantedAt ? 'check' : 'pending'} color={grantedAt ? 'primary' : 'textSubtle'} size={20} />
      <AppText style={{ flex: 1 }}>{label}</AppText>
      <AppText variant="caption" color="textMuted">
        {grantedAt ? 'Autorizado' : 'No autorizado'}
      </AppText>
    </View>
  );
}

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const { spacing } = useTheme();
  const [signingOut, setSigningOut] = useState(false);

  if (!user) return null;

  return (
    <Screen scroll>
      <AppText variant="title">Perfil</AppText>

      <Card>
        <AppText variant="heading">{user.fullName}</AppText>
        <AppText color="textMuted">{user.email}</AppText>
      </Card>

      <Card>
        <AppText variant="overline" color="textMuted">
          Privacidad y permisos
        </AppText>
        <View style={{ gap: spacing.md }}>
          <ConsentRow label="Tratamiento de datos" grantedAt={user.consents.privacyAcceptedAt} />
          <ConsentRow label="Análisis con IA" grantedAt={user.consents.aiConsentAt} />
          <ConsentRow label="Lectura de recibos (OCR)" grantedAt={user.consents.ocrConsentAt} />
        </View>
        <AppText variant="caption" color="textSubtle">
          Te pediremos permiso antes de usar la IA o la cámara por primera vez.
        </AppText>
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

      <AppText variant="caption" color="textSubtle" align="center">
        ASCENDX AI · versión {Constants.expoConfig?.version ?? '—'}
      </AppText>
    </Screen>
  );
}

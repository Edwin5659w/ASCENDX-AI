import { router } from 'expo-router';
import { View } from 'react-native';
import { AppText, Button, Icon, Screen, type IconName } from '@/components/ui';
import { useTheme } from '@/theme/useTheme';

const VALUE_POINTS: { icon: IconName; title: string; text: string }[] = [
  { icon: 'trending', title: 'Entiende tu dinero', text: 'Ingresos, gastos y deudas en un solo lugar.' },
  { icon: 'goals', title: 'Avanza hacia tus metas', text: 'Varias metas a la vez, con progreso real.' },
  { icon: 'simulator', title: '¿Ahorrar o financiar?', text: 'Compara escenarios con cifras verificables.' },
];

export default function WelcomeScreen() {
  const { colors, radius, spacing } = useTheme();

  return (
    <Screen edges={['top', 'bottom']}>
      <View style={{ flex: 1, justifyContent: 'center', gap: spacing.xxl }}>
        <View style={{ gap: spacing.md }}>
          <View
            style={{
              width: 64,
              height: 64,
              borderRadius: radius.lg,
              backgroundColor: colors.primarySoft,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon name="sparkle" size={32} color="primary" />
          </View>
          <AppText variant="overline" color="primary">
            ASCENDX AI
          </AppText>
          <AppText variant="display">Convierte tu situación financiera en un plan claro.</AppText>
        </View>

        <View style={{ gap: spacing.lg }}>
          {VALUE_POINTS.map((point) => (
            <View key={point.title} style={{ flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' }}>
              <Icon name={point.icon} color="primary" />
              <View style={{ flex: 1 }}>
                <AppText variant="bodyStrong">{point.title}</AppText>
                <AppText variant="caption" color="textMuted">
                  {point.text}
                </AppText>
              </View>
            </View>
          ))}
        </View>
      </View>

      <View style={{ gap: spacing.md }}>
        <Button title="Crear cuenta" onPress={() => router.push('/register')} />
        <Button title="Ya tengo cuenta" variant="ghost" onPress={() => router.push('/login')} />
      </View>
    </Screen>
  );
}

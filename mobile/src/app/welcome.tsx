import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AscentHero } from '@/components/brand/AscentHero';
import { BrandMark } from '@/components/brand/BrandMark';
import { AppText, Button } from '@/components/ui';
import { useTheme } from '@/theme/useTheme';

export default function WelcomeScreen() {
  const { colors, spacing, fonts } = useTheme();

  return (
    <SafeAreaView edges={['top', 'bottom']} style={[styles.flex, { backgroundColor: colors.background }]}>
      <View style={[styles.flex, { paddingHorizontal: spacing.xl, paddingBottom: spacing.lg }]}>
        <View style={[styles.brandRow, { marginTop: spacing.lg, gap: spacing.md }]}>
          <BrandMark size={36} />
          <AppText style={{ fontFamily: fonts.displaySemi, fontSize: 18, letterSpacing: 0.4 }}>ASCENDX AI</AppText>
        </View>

        <View style={[styles.flex, { justifyContent: 'center', gap: spacing.xxl }]}>
          <View style={{ marginHorizontal: -spacing.sm }}>
            <AscentHero />
          </View>

          <View style={{ gap: spacing.md }}>
            <AppText variant="display" accessibilityRole="header">
              Tu plata, con rumbo.
            </AppText>
            <AppText color="textMuted" style={{ maxWidth: 360 }}>
              Organiza ingresos y gastos, avanza en varias metas a la vez y descubre si te conviene ahorrar o
              financiar antes de decidir.
            </AppText>
          </View>
        </View>

        <View style={{ gap: spacing.md }}>
          <Button title="Crear cuenta" onPress={() => router.push('/register')} />
          <Button title="Ya tengo cuenta" variant="secondary" onPress={() => router.push('/login')} />
          <AppText variant="caption" color="textSubtle" align="center" style={{ marginTop: spacing.xs }}>
            Herramienta educativa. No reemplaza la asesoría financiera profesional.
          </AppText>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  brandRow: { flexDirection: 'row', alignItems: 'center' },
});

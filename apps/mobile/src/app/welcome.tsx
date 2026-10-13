import { router } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AscentHero } from '@/components/brand/AscentHero';
import { BrandLockup } from '@/components/brand/BrandMark';
import { AppText, Button } from '@/components/ui';
import { useTheme } from '@/theme/useTheme';

/**
 * Bienvenida. El protagonista es la marca: logotipo, lema oficial
 * («Convierte potencial en progreso medible») y una ruta que asciende por
 * varias metas, dibujada una sola vez al abrir.
 */
export default function WelcomeScreen() {
  const { colors, spacing } = useTheme();

  return (
    <SafeAreaView edges={['top', 'bottom']} style={[styles.flex, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingHorizontal: spacing.xl, paddingBottom: spacing.lg }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ marginTop: spacing.lg }}>
          <BrandLockup size={36} />
        </View>

        <View style={[styles.flex, { justifyContent: 'center', gap: spacing.xl, paddingVertical: spacing.xl }]}>
          <View style={{ marginHorizontal: -spacing.sm }}>
            <AscentHero />
          </View>

          <View style={{ gap: spacing.md }}>
            <AppText variant="display" accessibilityRole="header">
              Convierte potencial en progreso medible.
            </AppText>
            <AppText color="textMuted" style={{ maxWidth: 380 }}>
              Ordena tus ingresos, gastos y deudas, avanza en varias metas a la vez y descubre con cifras claras si te
              conviene ahorrar o financiar.
            </AppText>
          </View>
        </View>

        <View style={{ gap: spacing.md }}>
          <Button title="Crear cuenta" onPress={() => router.push('/register')} />
          <Button title="Ya tengo cuenta" variant="secondary" onPress={() => router.push('/login')} />
          <AppText variant="caption" color="textMuted" align="center" style={{ marginTop: spacing.xs }}>
            Herramienta educativa. No reemplaza la asesoría financiera profesional.
          </AppText>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
});

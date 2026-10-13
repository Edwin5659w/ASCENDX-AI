import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BrandMark } from '@/components/brand/BrandMark';
import { AppText, Icon } from '@/components/ui';
import { useTheme } from '@/theme/useTheme';

type Mode = 'login' | 'register';

interface AuthShellProps {
  /** Sin modo (p. ej. recuperar contraseña) no se muestra el selector. */
  mode?: Mode;
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
}

/**
 * Estructura común de inicio de sesión y registro: volver, marca, selector
 * entre ambos modos, título y formulario.
 */
export function AuthShell({ mode, title, subtitle, children, footer }: AuthShellProps) {
  const { colors, spacing, radius } = useTheme();

  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/welcome'));
  const switchTo = (target: Mode) => {
    if (target !== mode) router.replace(target === 'login' ? '/login' : '/register');
  };

  return (
    <SafeAreaView edges={['top', 'bottom']} style={[styles.flex, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: spacing.xl, paddingBottom: spacing.xxxl, gap: spacing.xxl }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.topBar, { marginTop: spacing.sm }]}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Volver"
              onPress={goBack}
              hitSlop={8}
              style={({ pressed }) => [
                styles.back,
                { borderRadius: radius.md, backgroundColor: pressed ? colors.surfaceAlt : colors.surface, borderColor: colors.border },
              ]}
            >
              <Icon name="back" size={20} />
            </Pressable>
            <BrandMark size={36} />
          </View>

          <View style={{ gap: spacing.sm }}>
            <AppText variant="title" accessibilityRole="header">
              {title}
            </AppText>
            <AppText color="textMuted">{subtitle}</AppText>
          </View>

          {mode ? (
          <View
            accessibilityRole="tablist"
            style={[styles.segmented, { backgroundColor: colors.surface, borderRadius: radius.md, borderColor: colors.border }]}
          >
            {(
              [
                { key: 'login', label: 'Iniciar sesión' },
                { key: 'register', label: 'Crear cuenta' },
              ] as const
            ).map((option) => {
              const selected = option.key === mode;
              return (
                <Pressable
                  key={option.key}
                  accessibilityRole="tab"
                  accessibilityState={{ selected }}
                  onPress={() => switchTo(option.key)}
                  style={[
                    styles.segment,
                    { borderRadius: radius.md - 4, backgroundColor: selected ? colors.surfaceAlt : 'transparent' },
                  ]}
                >
                  <AppText variant="label" color={selected ? 'text' : 'textSubtle'}>
                    {option.label}
                  </AppText>
                </Pressable>
              );
            })}
          </View>
          ) : null}

          <View style={{ gap: spacing.xl }}>{children}</View>

          {footer}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/** Mensaje informativo (p. ej. «te enviamos un código»). */
export function FormNotice({ message }: { message: string }) {
  const { colors, spacing, radius } = useTheme();
  return (
    <View
      accessibilityLiveRegion="polite"
      style={{ flexDirection: 'row', gap: spacing.md, padding: spacing.lg, borderRadius: radius.md, backgroundColor: colors.primarySoft, alignItems: 'center' }}
    >
      <Icon name="mail" size={20} color="primary" />
      <AppText variant="caption" style={{ flex: 1 }}>
        {message}
      </AppText>
    </View>
  );
}

/** Mensaje de error general del formulario (no ligado a un campo). */
export function FormError({ message }: { message: string }) {
  const { colors, spacing, radius } = useTheme();
  return (
    <View
      accessibilityRole="alert"
      style={{
        flexDirection: 'row',
        gap: spacing.md,
        padding: spacing.lg,
        borderRadius: radius.md,
        backgroundColor: colors.dangerSoft,
        alignItems: 'center',
      }}
    >
      <Icon name="error" size={20} color="danger" />
      <AppText variant="caption" style={{ flex: 1 }}>
        {message}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  back: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  segmented: { flexDirection: 'row', padding: 4, borderWidth: 1 },
  segment: { flex: 1, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
});

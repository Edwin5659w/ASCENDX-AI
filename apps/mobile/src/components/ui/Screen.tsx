import { Children, type ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';
import { FadeIn } from '@/components/motion';
import { useTheme } from '@/theme/useTheme';

interface ScreenProps {
  children: ReactNode;
  /** Permite desplazar el contenido (formularios, listas cortas). */
  scroll?: boolean;
  edges?: Edge[];
  /** Las secciones entran escalonadas al abrir la pantalla (solo con scroll). */
  animateIn?: boolean;
}

export function Screen({ children, scroll = false, edges = ['top'], animateIn = true }: ScreenProps) {
  const { colors, spacing } = useTheme();
  const content = { padding: spacing.xl, gap: spacing.lg };

  return (
    <SafeAreaView edges={edges} style={[styles.flex, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {scroll ? (
          <ScrollView
            contentContainerStyle={[content, { paddingBottom: spacing.xxxl }]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {animateIn
              ? Children.toArray(children).map((child, index) => (
                  <FadeIn key={(child as { key?: string }).key ?? index} delay={Math.min(index, 8) * 60}>
                    {child}
                  </FadeIn>
                ))
              : children}
          </ScrollView>
        ) : (
          <View style={[styles.flex, content]}>{children}</View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({ flex: { flex: 1 } });

import { Children, cloneElement, Fragment, isValidElement, type ReactElement, type ReactNode } from 'react';
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
  const content = { paddingHorizontal: 20, paddingTop: spacing.lg, gap: 20 };
  const items = flatten(children);

  return (
    <SafeAreaView edges={edges} style={[styles.flex, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {scroll ? (
          <ScrollView
            contentContainerStyle={[content, { paddingBottom: 130 }]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {animateIn
              ? items.map((child, index) => (
                  <FadeIn key={(child as { key?: string }).key ?? index} delay={Math.min(index, 8) * 60}>
                    {child}
                  </FadeIn>
                ))
              : items}
          </ScrollView>
        ) : (
          <View style={[styles.flex, content]}>{items}</View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/**
 * Las secciones agrupadas en <>…</> cuentan como una sola para el espacio
 * entre tarjetas; se aplanan para que todas queden igual de separadas.
 */
function flatten(children: ReactNode, prefix = ''): ReactNode[] {
  return Children.toArray(children).flatMap((child) => {
    if (!isValidElement(child)) return [child];
    const key = `${prefix}${child.key ?? ''}`;
    if (child.type === Fragment) return flatten((child as ReactElement<{ children?: ReactNode }>).props.children, `${key}/`);
    return [cloneElement(child, { key })];
  });
}

const styles = StyleSheet.create({ flex: { flex: 1 } });

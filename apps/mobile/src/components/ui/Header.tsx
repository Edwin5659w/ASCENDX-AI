import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTheme } from '@/theme/useTheme';
import { AppText } from './AppText';
import { Icon } from './Icon';

interface HeaderProps {
  title?: string;
  /** Qué hacer al tocar volver; por defecto regresa a la pantalla anterior. */
  onBack?: () => void;
  right?: ReactNode;
}

/** Barra superior de las pantallas apiladas: volver + título. */
export function Header({ title, onBack, right }: HeaderProps) {
  const { colors, radius } = useTheme();
  const goBack = onBack ?? (() => (router.canGoBack() ? router.back() : router.replace('/')));
  return (
    <View style={styles.row}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Volver"
        onPress={goBack}
        hitSlop={8}
        style={({ pressed }) => [
          styles.back,
          { borderRadius: radius.md, borderColor: colors.border, backgroundColor: pressed ? colors.surfaceAlt : colors.surface },
        ]}
      >
        <Icon name="back" size={20} />
      </Pressable>
      {title ? (
        <AppText variant="heading" style={styles.title} numberOfLines={1} accessibilityRole="header">
          {title}
        </AppText>
      ) : (
        <View style={styles.title} />
      )}
      <View style={styles.right}>{right}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  back: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  title: { flex: 1 },
  right: { minWidth: 48, alignItems: 'flex-end' },
});

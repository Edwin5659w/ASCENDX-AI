import { BlurView } from 'expo-blur';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { theme } from '@/constants/theme';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export function Card({ children, style }: CardProps) {
  return (
    <View style={[styles.wrapper, style]}>
      <BlurView intensity={40} tint="dark" style={styles.blur}>
        <View style={styles.inner}>{children}</View>
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: theme.radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  blur: {
    overflow: 'hidden',
  },
  inner: {
    padding: theme.spacing.md,
    backgroundColor: theme.colors.card,
  },
});

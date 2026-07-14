import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BrandLogo } from './BrandLogo';
import type { AppTheme } from '@/constants/theme';
import { useAppTheme } from '@/src/context/AppThemeContext';
import { useThemedStyles } from '@/src/hooks/useThemedStyles';

interface AuthScreenShellProps {
  children: ReactNode;
  subtitle: string;
  title?: string;
}

function createStyles(theme: AppTheme) {
  return {
    container: { flex: 1 },
    flex: { flex: 1 },
    scroll: { flexGrow: 1, justifyContent: 'center' as const, padding: theme.spacing.lg },
    header: { alignItems: 'center' as const, marginBottom: 32 },
    title: {
      marginTop: 20,
      fontSize: 20,
      fontWeight: '600' as const,
      color: theme.colors.text,
      textAlign: 'center' as const,
    },
    subtitle: {
      marginTop: 20,
      color: theme.colors.textMuted,
      fontSize: 15,
      textAlign: 'center' as const,
    },
    subtitleTight: { marginTop: 8 },
  };
}

export function AuthScreenShell({ children, subtitle, title }: AuthScreenShellProps) {
  const { theme } = useAppTheme();
  const styles = useThemedStyles(createStyles);

  return (
    <LinearGradient colors={[...theme.gradient.authBg]} style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <BrandLogo size="md" animate breathe />
            {title ? <Text style={styles.title}>{title}</Text> : null}
            <Text style={[styles.subtitle, title ? styles.subtitleTight : null]}>{subtitle}</Text>
          </View>
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BrandLogo } from './BrandLogo';
import { theme } from '@/constants/theme';

interface AuthScreenShellProps {
  children: ReactNode;
  subtitle: string;
  title?: string;
}

export function AuthScreenShell({ children, subtitle, title }: AuthScreenShellProps) {
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

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: theme.spacing.lg },
  header: { alignItems: 'center', marginBottom: 32 },
  title: {
    marginTop: 20,
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.text,
    textAlign: 'center',
  },
  subtitle: {
    marginTop: 20,
    color: theme.colors.textMuted,
    fontSize: 15,
    textAlign: 'center',
  },
  subtitleTight: { marginTop: 8 },
});

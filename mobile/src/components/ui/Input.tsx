import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';
import type { AppTheme } from '@/constants/theme';
import { useAppTheme } from '@/src/context/AppThemeContext';
import { useThemedStyles } from '@/src/hooks/useThemedStyles';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
}

function createStyles(theme: AppTheme) {
  return {
    container: {
      marginBottom: theme.spacing.md,
    },
    label: {
      color: theme.colors.textMuted,
      fontSize: 13,
      marginBottom: 6,
      fontWeight: '500' as const,
    },
    input: {
      backgroundColor: theme.colors.surfaceLight,
      borderRadius: theme.radius.md,
      padding: 14,
      color: theme.colors.text,
      fontSize: 16,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    inputError: {
      borderColor: theme.colors.danger,
    },
    error: {
      color: theme.colors.danger,
      fontSize: 12,
      marginTop: 4,
    },
  };
}

export function Input({ label, error, style, ...props }: InputProps) {
  const { theme } = useAppTheme();
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.container}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput
        placeholderTextColor={theme.colors.textMuted}
        style={[styles.input, error ? styles.inputError : null, style]}
        {...props}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

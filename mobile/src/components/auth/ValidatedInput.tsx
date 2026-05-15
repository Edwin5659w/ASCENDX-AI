import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';
import { FieldValidation } from '@/src/lib/auth.rules';
import { theme } from '@/constants/theme';

interface ValidatedInputProps extends TextInputProps {
  label: string;
  validation: FieldValidation;
}

export function ValidatedInput({ label, validation, style, ...props }: ValidatedInputProps) {
  const showError = validation.status === 'invalid';
  const showSuccess = validation.status === 'valid' && !!props.value;

  return (
    <View style={styles.container}>
      <Text style={[styles.label, showError && styles.labelError, showSuccess && styles.labelSuccess]}>
        {label}
      </Text>
      <TextInput
        placeholderTextColor={theme.colors.textMuted}
        style={[
          styles.input,
          showError && styles.inputError,
          showSuccess && styles.inputSuccess,
          style,
        ]}
        {...props}
      />
      {showError && validation.message ? (
        <Text style={styles.error} accessibilityRole="alert">
          {validation.message}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: theme.spacing.md },
  label: {
    color: theme.colors.textMuted,
    fontSize: 13,
    marginBottom: 6,
    fontWeight: '500',
  },
  labelError: { color: theme.colors.danger },
  labelSuccess: { color: theme.colors.success },
  input: {
    backgroundColor: theme.colors.surfaceLight,
    borderRadius: theme.radius.md,
    padding: 14,
    color: theme.colors.text,
    fontSize: 16,
    borderWidth: 2,
    borderColor: theme.colors.border,
  },
  inputError: { borderColor: theme.colors.danger },
  inputSuccess: { borderColor: theme.colors.success },
  error: { color: theme.colors.danger, fontSize: 12, marginTop: 4 },
});

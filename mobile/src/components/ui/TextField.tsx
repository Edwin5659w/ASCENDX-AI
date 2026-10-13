import { forwardRef, useState } from 'react';
import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';
import { useTheme } from '@/theme/useTheme';
import { AppText } from './AppText';

interface TextFieldProps extends TextInputProps {
  label: string;
  error?: string;
  hint?: string;
  /** Texto fijo antes del valor, p. ej. "$" */
  prefix?: string;
  /** Texto fijo después del valor, p. ej. "%" */
  suffix?: string;
}

export const TextField = forwardRef<TextInput, TextFieldProps>(function TextField(
  { label, error, hint, prefix, suffix, style, onFocus, onBlur, ...props },
  ref,
) {
  const { colors, radius, spacing, typography } = useTheme();
  const [focused, setFocused] = useState(false);
  const borderColor = error ? colors.danger : focused ? colors.primary : colors.border;

  return (
    <View style={{ gap: spacing.xs }}>
      <AppText variant="caption" color="textMuted">
        {label}
      </AppText>
      <View
        style={[
          styles.box,
          { borderColor, borderRadius: radius.md, backgroundColor: colors.surface, paddingHorizontal: spacing.lg },
        ]}
      >
        {prefix ? <AppText color="textMuted">{prefix}</AppText> : null}
        <TextInput
          ref={ref}
          placeholderTextColor={colors.textSubtle}
          selectionColor={colors.primary}
          accessibilityLabel={label}
          style={[styles.input, typography.body, { color: colors.text }, style]}
          onFocus={(event) => {
            setFocused(true);
            onFocus?.(event);
          }}
          onBlur={(event) => {
            setFocused(false);
            onBlur?.(event);
          }}
          {...props}
        />
        {suffix ? <AppText color="textMuted">{suffix}</AppText> : null}
      </View>
      {error ? (
        <AppText variant="caption" color="danger">
          {error}
        </AppText>
      ) : hint ? (
        <AppText variant="caption" color="textSubtle">
          {hint}
        </AppText>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  box: { minHeight: 52, borderWidth: 1.5, flexDirection: 'row', alignItems: 'center', gap: 6 },
  input: { flex: 1, paddingVertical: 12 },
});

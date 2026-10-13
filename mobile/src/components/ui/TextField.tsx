import { forwardRef, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View, type TextInputProps } from 'react-native';
import { useTheme } from '@/theme/useTheme';
import { AppText } from './AppText';
import { Icon, type IconName } from './Icon';

interface TextFieldProps extends TextInputProps {
  label: string;
  error?: string;
  hint?: string;
  /** Ícono a la izquierda del campo */
  icon?: IconName;
  /** Texto fijo antes del valor, p. ej. "$" */
  prefix?: string;
  /** Texto fijo después del valor, p. ej. "%" */
  suffix?: string;
  /** Campo de contraseña con botón para mostrar u ocultar */
  revealable?: boolean;
}

export const TextField = forwardRef<TextInput, TextFieldProps>(function TextField(
  { label, error, hint, icon, prefix, suffix, revealable, secureTextEntry, style, onFocus, onBlur, ...props },
  ref,
) {
  const { colors, radius, spacing, typography } = useTheme();
  const [focused, setFocused] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const borderColor = error ? colors.danger : focused ? colors.primary : colors.border;
  const hidden = revealable ? !revealed : secureTextEntry;

  return (
    <View style={{ gap: spacing.sm }}>
      <AppText variant="label" color={focused ? 'text' : 'textMuted'}>
        {label}
      </AppText>
      <View
        style={[
          styles.box,
          {
            borderColor,
            borderRadius: radius.md,
            backgroundColor: colors.surface,
            paddingLeft: spacing.lg,
            paddingRight: revealable ? spacing.xs : spacing.lg,
          },
        ]}
      >
        {icon ? <Icon name={icon} size={20} color={focused ? 'primary' : 'textSubtle'} /> : null}
        {prefix ? <AppText color="textMuted">{prefix}</AppText> : null}
        <TextInput
          ref={ref}
          placeholderTextColor={colors.textSubtle}
          selectionColor={colors.primary}
          cursorColor={colors.primary}
          accessibilityLabel={label}
          secureTextEntry={hidden}
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
        {revealable ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={revealed ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            onPress={() => setRevealed((value) => !value)}
            hitSlop={8}
            style={styles.reveal}
          >
            <Icon name={revealed ? 'eyeOff' : 'eye'} size={20} color="textSubtle" />
          </Pressable>
        ) : null}
      </View>
      {error ? (
        <View style={styles.message}>
          <Icon name="error" size={15} color="danger" />
          <AppText variant="caption" color="danger" style={{ flex: 1 }}>
            {error}
          </AppText>
        </View>
      ) : hint ? (
        <AppText variant="caption" color="textSubtle">
          {hint}
        </AppText>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  box: { minHeight: 56, borderWidth: 1.5, flexDirection: 'row', alignItems: 'center', gap: 10 },
  input: { flex: 1, paddingVertical: 14, outlineStyle: 'none' } as object,
  reveal: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  message: { flexDirection: 'row', alignItems: 'center', gap: 6 },
});

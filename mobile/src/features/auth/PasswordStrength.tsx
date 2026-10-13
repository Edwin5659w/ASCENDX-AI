import { View } from 'react-native';
import { AppText, Icon } from '@/components/ui';
import { useTheme } from '@/theme/useTheme';

/** Mismas reglas que valida el backend (auth.schemas.ts). */
export const PASSWORD_RULES = [
  { label: '8 caracteres o más', test: (value: string) => value.length >= 8 },
  { label: 'Una letra', test: (value: string) => /[A-Za-zÁÉÍÓÚáéíóúÑñ]/.test(value) },
  { label: 'Un número', test: (value: string) => /\d/.test(value) },
];

export function isPasswordValid(value: string) {
  return value.length <= 72 && PASSWORD_RULES.every((rule) => rule.test(value));
}

export function PasswordStrength({ value }: { value: string }) {
  const { colors, spacing, radius } = useTheme();
  const passed = PASSWORD_RULES.filter((rule) => rule.test(value)).length;
  const strongEnough = passed === PASSWORD_RULES.length && value.length >= 12;
  const barColor = passed === PASSWORD_RULES.length ? colors.primary : passed >= 2 ? colors.warning : colors.danger;

  return (
    <View style={{ gap: spacing.sm }} accessibilityLabel={`Cumple ${passed} de ${PASSWORD_RULES.length} requisitos`}>
      <View style={{ flexDirection: 'row', gap: 6 }}>
        {[0, 1, 2, 3].map((index) => {
          const filled = index < passed || (index === 3 && strongEnough);
          return (
            <View
              key={index}
              style={{
                flex: 1,
                height: 4,
                borderRadius: radius.pill,
                backgroundColor: value && filled ? barColor : colors.surfaceAlt,
              }}
            />
          );
        })}
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', columnGap: spacing.lg, rowGap: spacing.xs }}>
        {PASSWORD_RULES.map((rule) => {
          const ok = rule.test(value);
          return (
            <View key={rule.label} style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
              <Icon name={ok ? 'check' : 'pending'} size={15} color={ok ? 'primary' : 'textSubtle'} />
              <AppText variant="caption" color={ok ? 'text' : 'textSubtle'}>
                {rule.label}
              </AppText>
            </View>
          );
        })}
      </View>
    </View>
  );
}

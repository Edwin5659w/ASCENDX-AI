import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import { useTheme } from '@/theme/useTheme';
import { Icon } from './Icon';

interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  children: ReactNode;
  invalid?: boolean;
  accessibilityLabel: string;
}

export function Checkbox({ checked, onChange, children, invalid = false, accessibilityLabel }: CheckboxProps) {
  const { colors, spacing } = useTheme();
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      accessibilityLabel={accessibilityLabel}
      onPress={() => onChange(!checked)}
      hitSlop={6}
      style={{ flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' }}
    >
      <View
        style={{
          width: 24,
          height: 24,
          borderRadius: 7,
          marginTop: 1,
          borderWidth: 1.5,
          borderColor: invalid ? colors.danger : checked ? colors.primary : colors.textSubtle,
          backgroundColor: checked ? colors.primary : 'transparent',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {checked ? <Icon name="checkSmall" size={17} color="onPrimary" /> : null}
      </View>
      <View style={{ flex: 1 }}>{children}</View>
    </Pressable>
  );
}

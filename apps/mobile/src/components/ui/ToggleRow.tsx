import { Pressable, Switch, View } from 'react-native';
import { useTheme } from '@/theme/useTheme';
import { AppText } from './AppText';
import { Icon, type IconName } from './Icon';

interface ToggleRowProps {
  icon: IconName;
  title: string;
  description: string;
  value: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
}

/** Permiso o preferencia que se activa y desactiva (p. ej. consentimiento de IA). */
export function ToggleRow({ icon, title, description, value, onChange, disabled }: ToggleRowProps) {
  const { colors, radius, spacing } = useTheme();
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: value, disabled }}
      accessibilityLabel={title}
      accessibilityHint={description}
      disabled={disabled}
      onPress={() => onChange(!value)}
      style={{ flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start', minHeight: 48 }}
    >
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: radius.md,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.primarySoft,
        }}
      >
        <Icon name={icon} size={20} color="primary" />
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <AppText variant="bodyStrong">{title}</AppText>
        <AppText variant="caption" color="textMuted">
          {description}
        </AppText>
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        disabled={disabled}
        trackColor={{ false: colors.surfaceAlt, true: colors.primary }}
        thumbColor={value ? colors.onPrimary : colors.textSubtle}
        accessibilityElementsHidden
        importantForAccessibility="no"
      />
    </Pressable>
  );
}

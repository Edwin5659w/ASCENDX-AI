import { View } from 'react-native';
import { useTheme } from '@/theme/useTheme';
import { AppText } from './AppText';
import { Card } from './Card';
import { Icon, type IconName } from './Icon';

interface ComingSoonProps {
  icon: IconName;
  title: string;
  description: string;
  /** Lo que incluirá la función cuando esté lista */
  features: string[];
}

/** Pantalla honesta para funciones planificadas que aún no están construidas. */
export function ComingSoon({ icon, title, description, features }: ComingSoonProps) {
  const { colors, radius, spacing } = useTheme();
  return (
    <Card>
      <View
        style={{
          width: 52,
          height: 52,
          borderRadius: radius.md,
          backgroundColor: colors.primarySoft,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon name={icon} color="primary" size={26} />
      </View>
      <AppText variant="overline" color="primary">
        En desarrollo
      </AppText>
      <AppText variant="heading">{title}</AppText>
      <AppText color="textMuted">{description}</AppText>
      <View style={{ gap: spacing.sm, marginTop: spacing.xs }}>
        {features.map((feature) => (
          <View key={feature} style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'center' }}>
            <Icon name="pending" size={16} color="textSubtle" />
            <AppText variant="caption" color="textMuted" style={{ flex: 1 }}>
              {feature}
            </AppText>
          </View>
        ))}
      </View>
    </Card>
  );
}

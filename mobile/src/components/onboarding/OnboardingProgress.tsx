import { Text, View } from 'react-native';
import { onboardingStepIndex, type OnboardingStepId } from '../../../../shared/onboarding-helpers';
import type { AppTheme } from '@/constants/theme';
import { useThemedStyles } from '@/src/hooks/useThemedStyles';

interface OnboardingProgressProps {
  step: OnboardingStepId;
}

function createStyles(theme: AppTheme) {
  return {
    wrap: { marginBottom: 24 },
    label: {
      color: theme.colors.textMuted,
      fontSize: 12,
      textAlign: 'center' as const,
      marginBottom: 8,
      fontWeight: '600' as const,
    },
    track: {
      flexDirection: 'row' as const,
      gap: 6,
      paddingHorizontal: 8,
    },
    segment: {
      flex: 1,
      height: 4,
      borderRadius: 2,
      backgroundColor: theme.colors.border,
    },
    segmentActive: {
      backgroundColor: theme.colors.primary,
    },
  };
}

export function OnboardingProgress({ step }: OnboardingProgressProps) {
  const styles = useThemedStyles(createStyles);
  const current = onboardingStepIndex(step);
  const total = 3;

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>
        Paso {current} de {total}
      </Text>
      <View style={styles.track}>
        {Array.from({ length: total }).map((_, i) => (
          <View
            key={i}
            style={[styles.segment, i < current && styles.segmentActive]}
          />
        ))}
      </View>
    </View>
  );
}

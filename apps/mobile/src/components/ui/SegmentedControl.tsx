import { useEffect, useState } from 'react';
import { Animated, Pressable, View, type LayoutChangeEvent } from 'react-native';
import { haptic, useReducedMotion } from '@/components/motion';
import { useTheme } from '@/theme/useTheme';
import { AppText } from './AppText';
import { Icon, type IconName } from './Icon';

interface Option<T extends string> {
  value: T;
  label: string;
  icon?: IconName;
}

interface SegmentedControlProps<T extends string> {
  options: readonly Option<T>[];
  value: T;
  onChange: (value: T) => void;
  accessibilityLabel: string;
}

/** Selector de opciones excluyentes con un indicador que se desliza a la opción elegida. */
export function SegmentedControl<T extends string>({ options, value, onChange, accessibilityLabel }: SegmentedControlProps<T>) {
  const { colors, radius, spacing, elevate } = useTheme();
  const reduced = useReducedMotion();
  const [width, setWidth] = useState(0);
  const index = Math.max(0, options.findIndex((option) => option.value === value));
  const [position] = useState(() => new Animated.Value(index));
  const padding = 4;
  const segment = width > 0 ? (width - padding * 2) / options.length : 0;

  useEffect(() => {
    if (reduced) position.setValue(index);
    else Animated.spring(position, { toValue: index, useNativeDriver: true, speed: 16, bounciness: 6 }).start();
  }, [index, position, reduced]);

  return (
    <View
      accessibilityRole="radiogroup"
      accessibilityLabel={accessibilityLabel}
      onLayout={(event: LayoutChangeEvent) => setWidth(event.nativeEvent.layout.width)}
      style={{ flexDirection: 'row', padding, borderRadius: radius.md, backgroundColor: colors.surfaceAlt }}
    >
      {segment > 0 ? (
        <Animated.View
          pointerEvents="none"
          style={[
            {
              position: 'absolute',
              top: padding,
              bottom: padding,
              left: padding,
              width: segment,
              borderRadius: radius.md - 2,
              backgroundColor: colors.surfaceElevated,
              borderWidth: 1,
              borderColor: colors.border,
              transform: [{ translateX: Animated.multiply(position, segment) }],
            },
            elevate('low'),
          ]}
        />
      ) : null}
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            accessibilityLabel={option.label}
            onPress={() => {
              if (selected) return;
              haptic('selection');
              onChange(option.value);
            }}
            style={{ flex: 1, minHeight: 48, alignItems: 'center', justifyContent: 'center', gap: 2, paddingVertical: spacing.xs }}
          >
            {option.icon ? <Icon name={option.icon} size={20} color={selected ? 'primary' : 'textMuted'} /> : null}
            <AppText variant="label" color={selected ? 'text' : 'textMuted'}>
              {option.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

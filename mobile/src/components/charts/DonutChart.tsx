import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import { theme } from '@/constants/theme';

export interface DonutSegment {
  name: string;
  value: number;
  color: string;
}

interface DonutChartProps {
  data: DonutSegment[];
  size?: number;
  strokeWidth?: number;
  centerValue?: string;
  centerHint?: string;
}

export function DonutChart({
  data,
  size = 160,
  strokeWidth = 28,
  centerValue,
  centerHint = 'total',
}: DonutChartProps) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  if (total <= 0) {
    return (
      <View style={[styles.empty, { width: size, height: size }]}>
        <Text style={styles.emptyText}>Sin datos</Text>
      </View>
    );
  }

  let offset = 0;

  return (
    <View style={styles.wrap}>
      <Svg width={size} height={size}>
        <G rotation="-90" origin={`${center}, ${center}`}>
          {data.map((segment) => {
            const pct = segment.value / total;
            const dash = pct * circumference;
            const circle = (
              <Circle
                key={segment.name}
                cx={center}
                cy={center}
                r={radius}
                stroke={segment.color}
                strokeWidth={strokeWidth}
                fill="transparent"
                strokeDasharray={`${dash} ${circumference - dash}`}
                strokeDashoffset={-offset}
                strokeLinecap="butt"
              />
            );
            offset += dash;
            return circle;
          })}
        </G>
      </Svg>
      <View style={[styles.centerLabel, { width: size, height: size }]}>
        <Text style={styles.centerValue}>{centerValue ?? `$${total}`}</Text>
        <Text style={styles.centerHint}>{centerHint}</Text>
      </View>
      <View style={styles.legend}>
        {data.map((segment) => (
          <View key={segment.name} style={styles.legendRow}>
            <View style={[styles.dot, { backgroundColor: segment.color }]} />
            <Text style={styles.legendName}>{segment.name}</Text>
            <Text style={styles.legendValue}>${segment.value}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center' },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 80,
    borderWidth: 2,
    borderColor: theme.colors.border,
  },
  emptyText: { color: theme.colors.textMuted, fontSize: 13 },
  centerLabel: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerValue: {
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: '700',
  },
  centerHint: {
    color: theme.colors.textMuted,
    fontSize: 11,
  },
  legend: {
    marginTop: theme.spacing.md,
    width: '100%',
    gap: 8,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendName: {
    flex: 1,
    color: theme.colors.textMuted,
    fontSize: 13,
  },
  legendValue: {
    color: theme.colors.text,
    fontWeight: '600',
    fontSize: 13,
  },
});

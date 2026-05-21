import { StyleSheet, Text, View } from 'react-native';
import { Card } from '@/src/components/ui/Card';
import { theme } from '@/constants/theme';

export interface BarChartItem {
  name: string;
  value: number;
  color: string;
}

interface BarChartCardProps {
  title: string;
  data: BarChartItem[];
  height?: number;
}

export function BarChartCard({ title, data, height = 200 }: BarChartCardProps) {
  const max = Math.max(...data.map((d) => d.value), 1);

  return (
    <Card style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      <View style={[styles.chart, { height }]}>
        {data.map((item) => {
          const barHeight = Math.max((item.value / max) * (height - 48), item.value > 0 ? 8 : 4);
          return (
            <View key={item.name} style={styles.barCol}>
              <Text style={styles.barValue}>
                {item.value >= 1000 ? `$${(item.value / 1000).toFixed(1)}k` : `$${item.value}`}
              </Text>
              <View style={styles.barTrack}>
                <View
                  style={[
                    styles.barFill,
                    { height: barHeight, backgroundColor: item.color },
                  ]}
                />
              </View>
              <Text style={styles.barLabel} numberOfLines={2}>
                {item.name}
              </Text>
            </View>
          );
        })}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginHorizontal: theme.spacing.md },
  title: {
    color: theme.colors.text,
    fontSize: 17,
    fontWeight: '600',
    marginBottom: theme.spacing.md,
  },
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 8,
  },
  barCol: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: '100%',
  },
  barValue: {
    color: theme.colors.textMuted,
    fontSize: 11,
    marginBottom: 4,
    fontWeight: '600',
  },
  barTrack: {
    flex: 1,
    width: '100%',
    justifyContent: 'flex-end',
    alignItems: 'center',
    minHeight: 60,
  },
  barFill: {
    width: '72%',
    borderRadius: 6,
    minWidth: 12,
  },
  barLabel: {
    color: theme.colors.textMuted,
    fontSize: 10,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 13,
  },
});

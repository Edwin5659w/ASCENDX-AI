import { StyleSheet, Text, View } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Card } from './ui/Card';
import { theme } from '@/constants/theme';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ComponentProps<typeof FontAwesome>['name'];
  color?: string;
}

export function StatCard({ label, value, icon, color = theme.colors.primary }: StatCardProps) {
  return (
    <Card style={styles.card}>
      <View style={[styles.iconWrap, { backgroundColor: color + '22' }]}>
        <FontAwesome name={icon} size={18} color={color} />
      </View>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: '45%',
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  value: {
    color: theme.colors.text,
    fontSize: 22,
    fontWeight: '700',
  },
  label: {
    color: theme.colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
});

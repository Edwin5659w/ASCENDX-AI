import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import type { ComponentProps } from 'react';
import { theme } from '@/constants/theme';

const LINKS: {
  href: '/(tabs)/goals' | '/(tabs)/finance' | '/(tabs)/achievements' | '/(tabs)/profile';
  title: string;
  subtitle: string;
  icon: ComponentProps<typeof FontAwesome>['name'];
  color: string;
}[] = [
  {
    href: '/(tabs)/goals',
    title: 'Objetivos',
    subtitle: 'Metas SMART y progreso vinculado a tareas',
    icon: 'flag',
    color: theme.colors.primary,
  },
  {
    href: '/(tabs)/finance',
    title: 'Finanzas',
    subtitle: 'Ingresos, gastos y balance personal',
    icon: 'money',
    color: theme.colors.success,
  },
  {
    href: '/(tabs)/achievements',
    title: 'Logros',
    subtitle: 'Insignias, XP y rachas desbloqueadas',
    icon: 'trophy',
    color: theme.colors.warning,
  },
  {
    href: '/(tabs)/profile',
    title: 'Perfil',
    subtitle: 'Plan, referidos, notificaciones y cuenta',
    icon: 'user',
    color: theme.colors.accent,
  },
];

export default function MoreScreen() {
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.lead}>Tu Life OS completo — todo lo que no cabe abajo.</Text>
      {LINKS.map((item) => (
        <Pressable
          key={item.href}
          style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
          onPress={() => router.push(item.href)}>
          <View style={styles.iconWrap}>
            <FontAwesome name={item.icon} size={20} color={item.color} />
          </View>
          <View style={styles.copy}>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.subtitle}>{item.subtitle}</Text>
          </View>
          <FontAwesome name="chevron-right" size={14} color={theme.colors.textMuted} />
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: 16, gap: 10, paddingBottom: 32 },
  lead: { color: theme.colors.textMuted, fontSize: 14, marginBottom: 8, lineHeight: 20 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 14,
    padding: 14,
  },
  cardPressed: { opacity: 0.85 },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surfaceLight,
  },
  copy: { flex: 1 },
  title: { color: theme.colors.text, fontSize: 16, fontWeight: '700' },
  subtitle: { color: theme.colors.textMuted, fontSize: 12, marginTop: 2 },
});
